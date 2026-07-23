package api

import (
	"encoding/json"
	"fmt"
	"mail-server/config"
	"mail-server/internal/model"
	"net/http"
)

type ConfigHandler struct{}

func NewConfigHandler() *ConfigHandler {
	return &ConfigHandler{}
}

func (ch *ConfigHandler) HandleConfiguration(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		ch.get(w, r)
	case http.MethodPost:
		ch.post(w, r)
	default:
		sendJSON(w, http.StatusMethodNotAllowed, model.APIResponse{
			Status:  "error",
			Message: "Only GET and POST methods are allowed",
		})
	}
}

func (ch *ConfigHandler) get(w http.ResponseWriter, r *http.Request) {
	safeConfig := config.GetManager().GetSafeResponse()
	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "success",
		Message: "Active server configuration retrieved",
		Data:    safeConfig,
	})
}

func (ch *ConfigHandler) post(w http.ResponseWriter, r *http.Request) {
	var req model.ConfigState
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, model.APIResponse{
			Status:  "error",
			Message: fmt.Sprintf("Invalid JSON payload: %v", err),
		})
		return
	}

	updated := config.GetManager().UpdateConfig(req)

	sendJSON(w, http.StatusOK, model.APIResponse{
		Status:  "success",
		Message: fmt.Sprintf("Configuration updated successfully. Active provider: %s", updated.Provider),
		Data:    config.GetManager().GetSafeResponse(),
	})
}
