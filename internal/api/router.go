package api

import (
	"mail-server/internal/queue"
	"net/http"
)

func NewRouter(pool *queue.WorkerPool) http.Handler {
	mux := http.NewServeMux()

	healthH := NewHealthHandler(pool)
	emailH := NewEmailHandler(pool)
	configH := NewConfigHandler()
	trackH := NewTrackHandler(pool)

	mux.HandleFunc("/", healthH.HandleRoot)
	mux.HandleFunc("/health", healthH.HandleHealth)
	mux.HandleFunc("/metrics", healthH.HandleMetrics)
	mux.HandleFunc("/configuration", configH.HandleConfiguration)
	mux.HandleFunc("/send-email", emailH.HandleSendEmailAsync)
	mux.HandleFunc("/send-email/sync", emailH.HandleSendEmailSync)
	mux.HandleFunc("/job-status", emailH.HandleGetJobStatus)
	mux.HandleFunc("/track/open", trackH.HandleTrackOpen)

	return enableCORS(mux)
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

