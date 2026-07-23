package api

import (
	"mail-server/internal/queue"
	"net/http"
)

func NewRouter(pool *queue.WorkerPool) *http.ServeMux {
	mux := http.NewServeMux()

	healthH := NewHealthHandler(pool)
	emailH := NewEmailHandler(pool)
	configH := NewConfigHandler()

	mux.HandleFunc("/health", healthH.HandleHealth)
	mux.HandleFunc("/metrics", healthH.HandleMetrics)
	mux.HandleFunc("/configuration", configH.HandleConfiguration)
	mux.HandleFunc("/send-email", emailH.HandleSendEmailAsync)
	mux.HandleFunc("/send-email/sync", emailH.HandleSendEmailSync)
	mux.HandleFunc("/job-status", emailH.HandleGetJobStatus)

	return mux
}
