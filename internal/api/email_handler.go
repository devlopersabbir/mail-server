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

// HandleSendEmailAsync handles POST /send-email (Async, High-Scale)
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

	msg, err := h.validateAndPrepareMsg(&req)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	job, err := h.pool.Enqueue(msg)
	if err != nil {
		sendJSON(w, http.StatusServiceUnavailable, model.APIResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	sendJSON(w, http.StatusAccepted, model.APIResponse{
		Status:  "accepted",
		Message: "Email enqueued for background processing",
		Data: map[string]interface{}{
			"job_id":     job.ID,
			"status":     job.Status,
			"created_at": job.CreatedAt,
		},
	})
}

// HandleSendEmailSync handles POST /send-email/sync (Instant synchronous delivery)
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

	msg, err := h.validateAndPrepareMsg(&req)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	job := &model.Job{
		ID:        fmt.Sprintf("job_sync_%d", time.Now().UnixNano()),
		Message:   msg,
		Status:    model.StatusProcessing,
		CreatedAt: time.Now(),
	}
	h.pool.RegisterJob(job)

	p, err := provider.GetProvider()
	if err != nil {
		job.Status = model.StatusFailed
		job.Error = err.Error()
		sendJSON(w, http.StatusInternalServerError, model.APIResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	if err := p.Send(msg); err != nil {
		job.Status = model.StatusFailed
		job.Error = err.Error()
		sendJSON(w, http.StatusInternalServerError, model.APIResponse{
			Status:  "error",
			Message: fmt.Sprintf("Failed to send email via %s: %v", p.Name(), err),
		})
		return
	}

	job.Status = model.StatusSuccess
	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "success",
		Message: fmt.Sprintf("Email sent successfully via %s", p.Name()),
		Data: map[string]interface{}{
			"job_id": job.ID,
		},
	})
}

// HandleGetJobStatus handles GET /job-status?id=job_...
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
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: "Missing required query parameter 'id'",
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
		From:     sender,
		To:       req.To,
		Subject:  req.Subject,
		Body:     req.Body,
		HTMLBody: req.HTMLBody,
		ReplyTo:  req.ReplyTo,
	}, nil
}
