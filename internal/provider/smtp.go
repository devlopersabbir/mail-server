package provider

import (
	"crypto/rand"
	"fmt"
	"mail-server/internal/model"
	"net/smtp"
	"regexp"
	"strings"
	"time"
)

type SMTPProvider struct {
	Host     string
	Port     string
	Username string
	Password string
}

func NewSMTPProvider(cfg model.ConfigState) *SMTPProvider {
	return &SMTPProvider{
		Host:     cfg.SMTPHost,
		Port:     cfg.SMTPPort,
		Username: cfg.SenderEmail,
		Password: cfg.SenderPassword,
	}
}

func (s *SMTPProvider) Name() string {
	return "SMTP (" + s.Host + ")"
}

func (s *SMTPProvider) Send(msg *model.EmailMessage) error {
	if s.Username == "" || s.Password == "" {
		return fmt.Errorf("missing SMTP credentials: ensure SMTP_EMAIL and SMTP_PASSWORD are configured in .env or via Configuration panel")
	}

	host := s.Host
	if host == "" {
		host = "smtp.gmail.com"
	}
	port := s.Port
	if port == "" {
		port = "587"
	}

	// Remove spaces from Gmail App Password if needed
	password := strings.TrimSpace(s.Password)
	if strings.Contains(host, "gmail.com") {
		password = strings.ReplaceAll(password, " ", "")
	}

	fromAddr := msg.From
	if fromAddr == "" {
		fromAddr = s.Username
	}

	auth := smtp.PlainAuth("", s.Username, password, host)
	addr := fmt.Sprintf("%s:%s", host, port)

	// Guaranteed 1-to-1 Fanout: Dispatch individual email to each recipient so To: header shows only their address
	for _, recipient := range msg.To {
		singleMsg := *msg
		singleMsg.From = fromAddr
		singleMsg.To = []string{recipient}

		formattedMsg := formatRFC5322Message(&singleMsg, s.Username)

		if err := smtp.SendMail(addr, auth, fromAddr, []string{recipient}, formattedMsg); err != nil {
			return fmt.Errorf("SMTP send failed for recipient %s via %s: %w", recipient, addr, err)
		}
	}

	return nil
}

func formatRFC5322Message(e *model.EmailMessage, defaultFrom string) []byte {
	var message strings.Builder

	fromAddr := e.From
	if fromAddr == "" {
		fromAddr = defaultFrom
	}

	message.WriteString(fmt.Sprintf("From: %s\r\n", fromAddr))
	message.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(e.To, ", ")))
	if e.ReplyTo != "" {
		message.WriteString(fmt.Sprintf("Reply-To: %s\r\n", e.ReplyTo))
	}
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", e.Subject))
	message.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))

	// List-Unsubscribe headers for high deliverability & reputation
	message.WriteString(fmt.Sprintf("List-Unsubscribe: <mailto:%s?subject=unsubscribe>\r\n", fromAddr))
	message.WriteString("List-Unsubscribe-Post: List-Unsubscribe=One-Click\r\n")

	boundary := fmt.Sprintf("bnd_%d_%s", time.Now().UnixNano(), generateRandomID())
	message.WriteString("MIME-Version: 1.0\r\n")
	message.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n\r\n", boundary))

	// 1. Plain Text Part (Required to pass MIME_HTML_ONLY)
	plainText := e.Body
	if plainText == "" && e.HTMLBody != "" {
		plainText = stripHTML(e.HTMLBody)
	}
	if plainText == "" {
		plainText = "Hello, please view this message in an HTML-compatible email reader."
	}

	message.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	message.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	message.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
	message.WriteString(plainText)
	message.WriteString("\r\n\r\n")

	// 2. HTML Part
	htmlContent := e.HTMLBody
	if htmlContent == "" && e.Body != "" {
		formattedLines := strings.ReplaceAll(e.Body, "\n", "<br/>")
		htmlContent = fmt.Sprintf(`<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6;">%s</div>`, formattedLines)
	}

	// Always wrap in valid HTML5 document structure to avoid HTML_MIME_NO_HTML_TAG penalty
	if !strings.Contains(strings.ToLower(htmlContent), "<html") {
		htmlContent = fmt.Sprintf(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>%s</title></head><body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">%s</body></html>`, e.Subject, htmlContent)
	}

	// Inject 1x1 tracking pixel
	recipientEmail := ""
	if len(e.To) > 0 {
		recipientEmail = e.To[0]
	}

	baseURL := e.TrackingBaseURL
	if baseURL == "" {
		baseURL = "https://mail-server-web.vercel.app"
	}
	baseURL = strings.TrimSuffix(baseURL, "/")

	trackingPixel := fmt.Sprintf(`<img src="%s/track/open?recipient=%s" width="1" height="1" style="display:none;" alt="" />`, baseURL, recipientEmail)

	if strings.Contains(htmlContent, "</body>") {
		htmlContent = strings.Replace(htmlContent, "</body>", trackingPixel+"</body>", 1)
	} else {
		htmlContent += trackingPixel
	}

	message.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	message.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	message.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
	message.WriteString(htmlContent)
	message.WriteString(fmt.Sprintf("\r\n\r\n--%s--\r\n", boundary))

	return []byte(message.String())
}

func stripHTML(input string) string {
	re := regexp.MustCompile("<[^>]*>")
	return strings.TrimSpace(re.ReplaceAllString(input, ""))
}

func generateRandomID() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%x", b)
}
