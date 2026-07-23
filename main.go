package main

import (
	"encoding/json"
	"fmt"
	"log"
	conf "mail-server/conf"
	"mail-server/constants"
	"net/http"
	"os"
)

type SendEmailRequest struct {
	To       []string `json:"to"`
	Subject  string   `json:"subject"`
	Body     string   `json:"body"`
	HTMLBody string   `json:"html_body"`
	ReplyTo  string   `json:"reply_to"`
}

type APIResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func main() {
	http.HandleFunc("/health", handleHealthCheck)
	http.HandleFunc("/send-email", handleSendEmail)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSONResponse(w, http.StatusMethodNotAllowed, "error", "Method not allowed")
		return
	}
	sendJSONResponse(w, http.StatusOK, "ok", "Mail server API is running")
}

func handleSendEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSONResponse(w, http.StatusMethodNotAllowed, "error", "Only POST requests are allowed")
		return
	}

	var req SendEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, "error", fmt.Sprintf("Invalid JSON payload: %v", err))
		return
	}

	email := &conf.EmailMessage{
		From:     constants.GetSenderEmail(),
		To:       req.To,
		Subject:  req.Subject,
		Body:     req.Body,
		HTMLBody: req.HTMLBody,
		ReplyTo:  req.ReplyTo,
	}

	log.Printf("Received API request to send email to %v...", email.To)
	if err := conf.SendEmail(email); err != nil {
		log.Printf("Failed to send email: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, "error", err.Error())
		return
	}

	log.Printf("Email successfully sent to %v", email.To)
	sendJSONResponse(w, http.StatusOK, "success", "Email sent successfully")
}

func sendJSONResponse(w http.ResponseWriter, statusCode int, status string, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(APIResponse{
		Status:  status,
		Message: message,
	})
}

