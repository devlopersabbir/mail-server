package api

import (
	"mail-server/internal/queue"
	"net/http"
)

// 1x1 transparent GIF image bytes
var transparentGIF = []byte{
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
	0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
	0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
	0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
	0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
	0x01, 0x00, 0x3b,
}

type TrackHandler struct {
	pool *queue.WorkerPool
}

func NewTrackHandler(pool *queue.WorkerPool) *TrackHandler {
	return &TrackHandler{pool: pool}
}

func (th *TrackHandler) HandleTrackOpen(w http.ResponseWriter, r *http.Request) {
	jobID := r.URL.Query().Get("job_id")
	recipient := r.URL.Query().Get("recipient")

	if recipient != "" {
		th.pool.RecordOpen(jobID, recipient)
	}

	w.Header().Set("Content-Type", "image/gif")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(transparentGIF)
}
