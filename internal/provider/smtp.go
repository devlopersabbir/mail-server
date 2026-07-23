package provider

import (
	"crypto/rand"
	"fmt"
	"mail-server/internal/model"
	"net/smtp"
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
		return fmt.Errorf("missing SMTP credentials: ensure SMTP_EMAIL and SMTP_PASSWORD are configured")
	}

	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)
	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)
	formattedMsg := formatRFC5322Message(msg, s.Username)

	if err := smtp.SendMail(addr, auth, msg.From, msg.To, formattedMsg); err != nil {
		return fmt.Errorf("SMTP send failed via %s: %w", addr, err)
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

	domain := "gmail.com"
	if parts := strings.Split(fromAddr, "@"); len(parts) == 2 {
		domain = parts[1]
	}
	msgID := fmt.Sprintf("<%d.%s@%s>", time.Now().UnixNano(), generateRandomID(), domain)
	message.WriteString(fmt.Sprintf("Message-ID: %s\r\n", msgID))
	message.WriteString("MIME-Version: 1.0\r\n")

	if e.HTMLBody != "" {
		message.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		message.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
		message.WriteString(e.HTMLBody)
	} else {
		message.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
		message.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
		message.WriteString(e.Body)
	}

	return []byte(message.String())
}

func generateRandomID() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%x", b)
}
