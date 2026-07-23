package model

import "time"

type EmailMessage struct {
	From     string   `json:"from"`
	To       []string `json:"to"`
	Subject  string   `json:"subject"`
	Body     string   `json:"body"`
	HTMLBody string   `json:"html_body,omitempty"`
	ReplyTo  string   `json:"reply_to,omitempty"`
}

type SendEmailRequest struct {
	From     string   `json:"from,omitempty"`
	To       []string `json:"to"`
	Subject  string   `json:"subject"`
	Body     string   `json:"body"`
	HTMLBody string   `json:"html_body,omitempty"`
	ReplyTo  string   `json:"reply_to,omitempty"`
}

type JobStatus string

const (
	StatusPending    JobStatus = "pending"
	StatusProcessing JobStatus = "processing"
	StatusSuccess    JobStatus = "success"
	StatusFailed     JobStatus = "failed"
)

type Job struct {
	ID        string        `json:"id"`
	Message   *EmailMessage `json:"message"`
	Status    JobStatus     `json:"status"`
	Error     string        `json:"error,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
}

type APIResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
