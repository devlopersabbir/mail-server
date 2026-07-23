package auth

import (
	"fmt"
	"mail-server/constants"
	"net/smtp"
)

func CreateAuth() (smtp.Auth, error) {
	email := constants.GetSenderEmail()
	password := constants.GetSenderPassword()

	if email == "" || password == "" {
		return nil, fmt.Errorf("missing SMTP credentials: ensure SMTP_EMAIL and SMTP_PASSWORD are set in your .env file")
	}

	return smtp.PlainAuth("", email, password, constants.SmtpHost), nil
}

