package api

import (
	"encoding/json"
	"fmt"
	"mail-server/config"
	"mail-server/internal/model"
	"mail-server/internal/provider"
	"mail-server/internal/queue"
	"net/http"
	"strings"
	"time"
)

type EmailHandler struct {
	pool *queue.WorkerPool
}

func NewEmailHandler(pool *queue.WorkerPool) *EmailHandler {
	return &EmailHandler{pool: pool}
}

// HandleSendEmailAsync handles POST /send-email (Async, High-Scale, Individual Recipient Fan-Out)
func (h *EmailHandler) HandleSendEmailAsync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, model.APIResponse{
			Status:  "error",
			Message: "Only POST method is allowed",
		})
		return
	}

	var req model.SendEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: fmt.Sprintf("Invalid JSON payload: %v", err),
		})
		return
	}

	baseMsg, err := h.validateAndPrepareMsg(&req)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	// Fan-Out: Create individual 1-to-1 jobs for each recipient to protect privacy
	var jobIDs []string
	var lastJob *model.Job

	for _, recipient := range baseMsg.To {
		individualMsg := &model.EmailMessage{
			From:            baseMsg.From,
			To:              []string{recipient},
			Subject:         baseMsg.Subject,
			Body:            baseMsg.Body,
			HTMLBody:        baseMsg.HTMLBody,
			ReplyTo:         baseMsg.ReplyTo,
			TrackingBaseURL: baseMsg.TrackingBaseURL,
		}

		job, err := h.pool.Enqueue(individualMsg)
		if err != nil {
			sendJSON(w, http.StatusServiceUnavailable, model.APIResponse{
				Status:  "error",
				Message: fmt.Sprintf("Failed to enqueue dispatch for %s: %v", recipient, err),
			})
			return
		}
		jobIDs = append(jobIDs, job.ID)
		lastJob = job
	}

	sendJSON(w, http.StatusAccepted, model.APIResponse{
		Status:  "accepted",
		Message: fmt.Sprintf("Enqueued %d private 1-to-1 email dispatches", len(jobIDs)),
		Data: map[string]interface{}{
			"job_id":       lastJob.ID,
			"job_ids":      jobIDs,
			"total_sent":   len(jobIDs),
			"created_at":   lastJob.CreatedAt,
		},
	})
}

// HandleSendEmailSync handles POST /send-email/sync (Instant 1-to-1 synchronous delivery)
func (h *EmailHandler) HandleSendEmailSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, model.APIResponse{
			Status:  "error",
			Message: "Only POST method is allowed",
		})
		return
	}

	var req model.SendEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: fmt.Sprintf("Invalid JSON payload: %v", err),
		})
		return
	}

	baseMsg, err := h.validateAndPrepareMsg(&req)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	p, err := provider.GetProvider()
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, model.APIResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	var sentCount int
	var lastJobID string

	for _, recipient := range baseMsg.To {
		individualMsg := &model.EmailMessage{
			From:            baseMsg.From,
			To:              []string{recipient},
			Subject:         baseMsg.Subject,
			Body:            baseMsg.Body,
			HTMLBody:        baseMsg.HTMLBody,
			ReplyTo:         baseMsg.ReplyTo,
			TrackingBaseURL: baseMsg.TrackingBaseURL,
		}

		job := &model.Job{
			ID:        fmt.Sprintf("job_sync_%d", time.Now().UnixNano()),
			Message:   individualMsg,
			Status:    model.StatusProcessing,
			CreatedAt: time.Now(),
		}
		h.pool.RegisterJob(job)
		lastJobID = job.ID

		if err := p.Send(individualMsg); err != nil {
			job.Status = model.StatusFailed
			job.Error = err.Error()
			sendJSON(w, http.StatusInternalServerError, model.APIResponse{
				Status:  "error",
				Message: fmt.Sprintf("Failed to send email to %s via %s: %v", recipient, p.Name(), err),
			})
			return
		}
		job.Status = model.StatusSuccess
		sentCount++
	}

	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "success",
		Message: fmt.Sprintf("Successfully sent %d private 1-to-1 emails via %s", sentCount, p.Name()),
		Data: map[string]interface{}{
			"job_id":     lastJobID,
			"total_sent": sentCount,
		},
	})
}

// HandleGetJobStatus handles GET /job-status?id=job_... or GET /job-status for all jobs
func (h *EmailHandler) HandleGetJobStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSON(w, http.StatusMethodNotAllowed, model.APIResponse{
			Status:  "error",
			Message: "Only GET method is allowed",
		})
		return
	}

	jobID := r.URL.Query().Get("id")
	if jobID == "" {
		jobs := h.pool.GetAllJobs()
		sendJSON(w, http.StatusOK, model.APIResponse{
			Status:  "success",
			Message: "All jobs retrieved",
			Data:    jobs,
		})
		return
	}

	job, found := h.pool.GetJob(jobID)
	if !found {
		sendJSON(w, http.StatusNotFound, model.APIResponse{
			Status:  "error",
			Message: fmt.Sprintf("Job with ID '%s' not found", jobID),
		})
		return
	}

	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "success",
		Message: "Job status retrieved",
		Data:    job,
	})
}

func (h *EmailHandler) validateAndPrepareMsg(req *model.SendEmailRequest) (*model.EmailMessage, error) {
	sender := req.From
	if strings.TrimSpace(sender) == "" {
		sender = config.GetManager().GetConfig().SenderEmail
	}
	if strings.TrimSpace(sender) == "" {
		return nil, fmt.Errorf("sender email address is required (set 'from' in request or configure 'sender_email')")
	}

	if len(req.To) == 0 {
		return nil, fmt.Errorf("at least one recipient email address ('to') is required")
	}
	for i, recipient := range req.To {
		if strings.TrimSpace(recipient) == "" {
			return nil, fmt.Errorf("recipient email address at index %d is empty", i)
		}
	}

	if strings.TrimSpace(req.Subject) == "" {
		return nil, fmt.Errorf("email subject line cannot be empty")
	}
	if strings.TrimSpace(req.Body) == "" && strings.TrimSpace(req.HTMLBody) == "" {
		return nil, fmt.Errorf("email message content ('body' or 'html_body') cannot be empty")
	}

	return &model.EmailMessage{
		From:            sender,
		To:              req.To,
		Subject:         req.Subject,
		Body:            req.Body,
		HTMLBody:        req.HTMLBody,
		ReplyTo:         req.ReplyTo,
		TrackingBaseURL: req.TrackingBaseURL,
	}, nil
}
