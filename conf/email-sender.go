package conf

import (
	"crypto/rand"
	"fmt"
	"mail-server/auth"
	"mail-server/constants"
	"net/smtp"
	"strings"
	"time"
)

type EmailMessage struct {
	From     string
	To       []string
	Subject  string
	Body     string
	HTMLBody string
	ReplyTo  string
}

func SendEmail(msg *EmailMessage) error {
	if msg == nil {
		return fmt.Errorf("email message cannot be nil")
	}
	if strings.TrimSpace(msg.From) == "" {
		return fmt.Errorf("sender email address (From) cannot be empty")
	}
	if len(msg.To) == 0 {
		return fmt.Errorf("at least one recipient email address (To) is required")
	}
	for i, recipient := range msg.To {
		if strings.TrimSpace(recipient) == "" {
			return fmt.Errorf("recipient email address at index %d is empty", i)
		}
	}
	if strings.TrimSpace(msg.Subject) == "" {
		return fmt.Errorf("email subject line cannot be empty")
	}
	if strings.TrimSpace(msg.Body) == "" && strings.TrimSpace(msg.HTMLBody) == "" {
		return fmt.Errorf("email message content (Body or HTMLBody) cannot be empty")
	}

	authentication, err := auth.CreateAuth()
	if err != nil {
		return fmt.Errorf("authentication error: %w", err)
	}

	addr := fmt.Sprintf("%s:%s", constants.SmtpHost, constants.SmtpPort)
	formattedMsg := msg.Format()

	if err := smtp.SendMail(addr, authentication, msg.From, msg.To, formattedMsg); err != nil {
		return fmt.Errorf("failed to send email to %v via %s: %w", msg.To, addr, err)
	}

	return nil
}

func (e *EmailMessage) Format() []byte {
	var message strings.Builder

	// 1. Mandatory RFC 5322 Headers in standard sequence
	message.WriteString(fmt.Sprintf("From: %s\r\n", e.From))
	message.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(e.To, ", ")))
	if e.ReplyTo != "" {
		message.WriteString(fmt.Sprintf("Reply-To: %s\r\n", e.ReplyTo))
	}
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", e.Subject))

	// 2. Date Header (RFC 1123 format with numeric timezone offset)
	message.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))

	// 3. Unique Message-ID Header
	domain := "gmail.com"
	if parts := strings.Split(e.From, "@"); len(parts) == 2 {
		domain = parts[1]
	}
	msgID := fmt.Sprintf("<%d.%s@%s>", time.Now().UnixNano(), generateRandomID(), domain)
	message.WriteString(fmt.Sprintf("Message-ID: %s\r\n", msgID))

	// 4. MIME Headers & Content Encoding
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
