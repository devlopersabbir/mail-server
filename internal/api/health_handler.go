package api

import (
	"encoding/json"
	"mail-server/internal/model"
	"mail-server/internal/queue"
	"net/http"
	"os"
)

type HealthHandler struct {
	pool *queue.WorkerPool
}

func NewHealthHandler(pool *queue.WorkerPool) *HealthHandler {
	return &HealthHandler{pool: pool}
}

func (hh *HealthHandler) HandleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	nodeName, err := os.Hostname()
	if err != nil || nodeName == "" {
		nodeName = "unknown"
	}

	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "ok",
		Message: "Mail server engine is operational",
		Data: map[string]interface{}{
			"node_name": nodeName,
		},
	})
}

func (hh *HealthHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSON(w, http.StatusMethodNotAllowed, model.APIResponse{
			Status:  "error",
			Message: "Method not allowed",
		})
		return
	}

	nodeName, err := os.Hostname()
	if err != nil || nodeName == "" {
		nodeName = "unknown"
	}

	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "ok",
		Message: "Mail server engine is operational",
		Data: map[string]interface{}{
			"node_name": nodeName,
		},
	})
}

func (hh *HealthHandler) HandleMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSON(w, http.StatusMethodNotAllowed, model.APIResponse{
			Status:  "error",
			Message: "Method not allowed",
		})
		return
	}

	metrics := hh.pool.GetMetrics()
	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "success",
		Message: "System performance metrics",
		Data:    metrics,
	})
}

func sendJSON(w http.ResponseWriter, statusCode int, response model.APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(response)
}
