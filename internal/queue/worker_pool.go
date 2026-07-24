package queue

import (
	"crypto/rand"
	"fmt"
	"log"
	"mail-server/internal/model"
	"mail-server/internal/provider"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type Metrics struct {
	EnqueuedTotal   uint64  `json:"enqueued_total"`
	SentTotal       uint64  `json:"sent_total"`
	FailedTotal     uint64  `json:"failed_total"`
	OpenedTotal     uint64  `json:"opened_total"`
	OpenRatePercent float64 `json:"open_rate_percent"`
	QueueLength     int     `json:"queue_length"`
	MaxWorkers      int     `json:"max_workers"`
}

type WorkerPool struct {
	jobQueue chan *model.Job
	workers  int
	wg       sync.WaitGroup
	quit     chan struct{}
	enqueued uint64
	sent     uint64
	failed   uint64
	opened   uint64
	jobsMap  sync.Map
}

var defaultPool *WorkerPool
var poolOnce sync.Once

func GetWorkerPool(maxWorkers, capacity int) *WorkerPool {
	poolOnce.Do(func() {
		defaultPool = NewWorkerPool(maxWorkers, capacity)
		defaultPool.Start()
	})
	return defaultPool
}

func NewWorkerPool(workers, capacity int) *WorkerPool {
	if workers <= 0 {
		workers = 50
	}
	if capacity <= 0 {
		capacity = 100000
	}

	return &WorkerPool{
		jobQueue: make(chan *model.Job, capacity),
		workers:  workers,
		quit:     make(chan struct{}),
	}
}

func (wp *WorkerPool) Start() {
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(i + 1)
	}
	log.Printf("[WorkerPool] Started %d background workers for async email processing", wp.workers)
}

func (wp *WorkerPool) Enqueue(msg *model.EmailMessage) (*model.Job, error) {
	jobID := generateJobID()
	job := &model.Job{
		ID:               jobID,
		Message:          msg,
		Status:           model.StatusPending,
		CreatedAt:        time.Now(),
		OpenedAt:         make(map[string]time.Time),
		OpenedRecipients: make([]string, 0),
	}

	wp.jobsMap.Store(jobID, job)

	select {
	case wp.jobQueue <- job:
		atomic.AddUint64(&wp.enqueued, 1)
		return job, nil
	default:
		job.Status = model.StatusFailed
		job.Error = "worker pool queue capacity reached"
		atomic.AddUint64(&wp.failed, 1)
		return nil, fmt.Errorf("queue is full (capacity reached), try again later")
	}
}

func (wp *WorkerPool) RegisterJob(job *model.Job) {
	if job != nil && job.ID != "" {
		if job.OpenedAt == nil {
			job.OpenedAt = make(map[string]time.Time)
		}
		wp.jobsMap.Store(job.ID, job)
	}
}

func (wp *WorkerPool) RecordOpen(jobID, recipient string) {
	if recipient == "" {
		return
	}

	if jobID != "" {
		if val, ok := wp.jobsMap.Load(jobID); ok {
			wp.markJobOpened(val.(*model.Job), recipient)
		}
		return
	}

	// Fallback: If jobID is empty, locate any job with this recipient and mark open
	wp.jobsMap.Range(func(key, value interface{}) bool {
		if job, ok := value.(*model.Job); ok {
			if job.Message != nil {
				for _, r := range job.Message.To {
					if strings.EqualFold(r, recipient) {
						wp.markJobOpened(job, recipient)
					}
				}
			}
		}
		return true
	})
}

func (wp *WorkerPool) markJobOpened(job *model.Job, recipient string) {
	if job == nil {
		return
	}
	if job.OpenedAt == nil {
		job.OpenedAt = make(map[string]time.Time)
	}

	if _, exists := job.OpenedAt[recipient]; !exists {
		job.OpenedAt[recipient] = time.Now()
		job.OpenedRecipients = append(job.OpenedRecipients, recipient)
		atomic.AddUint64(&wp.opened, 1)
		log.Printf("[Tracking] Open event recorded for Job %s (Recipient: %s)", job.ID, recipient)
	}
}

func (wp *WorkerPool) GetJob(jobID string) (*model.Job, bool) {
	val, ok := wp.jobsMap.Load(jobID)
	if !ok {
		return nil, false
	}
	return val.(*model.Job), true
}

func (wp *WorkerPool) GetAllJobs() []*model.Job {
	var jobs []*model.Job
	wp.jobsMap.Range(func(key, value interface{}) bool {
		if j, ok := value.(*model.Job); ok {
			jobs = append(jobs, j)
		}
		return true
	})
	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].CreatedAt.After(jobs[j].CreatedAt)
	})
	return jobs
}

func (wp *WorkerPool) GetMetrics() Metrics {
	sent := atomic.LoadUint64(&wp.sent)
	opened := atomic.LoadUint64(&wp.opened)

	var rate float64 = 0
	if sent > 0 {
		rate = (float64(opened) / float64(sent)) * 100.0
	}

	return Metrics{
		EnqueuedTotal:   atomic.LoadUint64(&wp.enqueued),
		SentTotal:       sent,
		FailedTotal:     atomic.LoadUint64(&wp.failed),
		OpenedTotal:     opened,
		OpenRatePercent: rate,
		QueueLength:     len(wp.jobQueue),
		MaxWorkers:      wp.workers,
	}
}

func (wp *WorkerPool) Stop() {
	close(wp.quit)
	close(wp.jobQueue)
	wp.wg.Wait()
	log.Println("[WorkerPool] Worker pool stopped cleanly")
}

func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()

	for {
		select {
		case job, ok := <-wp.jobQueue:
			if !ok {
				return
			}
			job.Status = model.StatusProcessing

			p, err := provider.GetProvider()
			if err != nil {
				job.Status = model.StatusFailed
				job.Error = err.Error()
				atomic.AddUint64(&wp.failed, 1)
				log.Printf("[Worker %d] Failed to resolve provider for Job %s: %v", id, job.ID, err)
				continue
			}

			if err := p.Send(job.Message); err != nil {
				job.Status = model.StatusFailed
				job.Error = err.Error()
				atomic.AddUint64(&wp.failed, 1)
				log.Printf("[Worker %d] Failed to send email Job %s via %s: %v", id, job.ID, p.Name(), err)
			} else {
				job.Status = model.StatusSuccess
				atomic.AddUint64(&wp.sent, 1)
			}

		case <-wp.quit:
			return
		}
	}
}

func generateJobID() string {
	b := make([]byte, 6)
	_, _ = rand.Read(b)
	return fmt.Sprintf("job_%d_%x", time.Now().UnixNano(), b)
}
