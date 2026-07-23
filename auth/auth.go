package auth

import (
	"mail-server/constants"
	"net/smtp"
)

func CreateAuth() smtp.Auth {
	return smtp.PlainAuth("", constants.SenderEmail, constants.SenderPassword, constants.SmtpHost)
}
