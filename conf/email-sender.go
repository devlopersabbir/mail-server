package conf

import (
	"fmt"
	"mail-server/auth"
	"mail-server/constants"
	"net/smtp"
	"strings"
)

type EmailMessage struct {
	From    string
	To      []string
	Subject string
	Body    string
}

func SendEmail(msg *EmailMessage) error {
	if msg.From == "" || len(msg.To) == 0 {
		return fmt.Errorf("Sender and at least one recipient required")
	}

	authentication := auth.CreateAuth()

	addr := fmt.Sprintf("%s:%s", constants.SmtpHost, constants.SmtpPort)

	formattedMsg := msg.Format()

	err := smtp.SendMail(addr, authentication, msg.From, msg.To, formattedMsg)
	if err != nil {
		return fmt.Errorf("Fail to send email: %w", err)
	}
	return nil
}
func (e *EmailMessage) Format() []byte {
	headers := make(map[string]string)

	headers["From"] = e.From
	headers["To"] = strings.Join(e.To, ",")
	headers["Subject"] = e.Subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/plain; charset=\"utf-8\""

	var message strings.Builder

	for key, value := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}
	message.WriteString("\r\n")
	message.WriteString(e.Body)
	return []byte(message.String())
}
