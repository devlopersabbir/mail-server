package main

import (
	"log"
	"mail-server/config"
	"mail-server/internal/api"
	"mail-server/internal/queue"
	"net/http"
	"os"
)

func main() {
	cm := config.GetManager()
	cfg := cm.GetConfig()

	log.Printf("Starting Mail Server Engine (Active Provider: %s)", cfg.Provider)

	pool := queue.GetWorkerPool(cfg.MaxWorkers, cfg.QueueCapacity)

	router := api.NewRouter(pool)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("HTTP Server listening on port %s...", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
