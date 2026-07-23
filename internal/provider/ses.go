package provider

import (
	"fmt"
	"mail-server/internal/model"
	"net/smtp"
)

type SESProvider struct {
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	SenderEmail     string
}

func NewSESProvider(cfg model.ConfigState) *SESProvider {
	region := cfg.AWSRegion
	if region == "" {
		region = "us-east-1"
	}
	return &SESProvider{
		Region:          region,
		AccessKeyID:     cfg.AWSAccessKeyID,
		SecretAccessKey: cfg.AWSSecretAccessKey,
		SenderEmail:     cfg.SenderEmail,
	}
}

func (s *SESProvider) Name() string {
	return "AWS SES (" + s.Region + ")"
}

func (s *SESProvider) Send(msg *model.EmailMessage) error {
	if s.AccessKeyID == "" || s.SecretAccessKey == "" {
		return fmt.Errorf("missing AWS SES credentials: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required")
	}

	host := fmt.Sprintf("email-smtp.%s.amazonaws.com", s.Region)
	port := "587"
	addr := fmt.Sprintf("%s:%s", host, port)
	auth := smtp.PlainAuth("", s.AccessKeyID, s.SecretAccessKey, host)

	// Guaranteed 1-to-1 Fanout for AWS SES
	for _, recipient := range msg.To {
		singleMsg := *msg
		singleMsg.To = []string{recipient}

		formattedMsg := formatRFC5322Message(&singleMsg, s.SenderEmail)

		if err := smtp.SendMail(addr, auth, msg.From, []string{recipient}, formattedMsg); err != nil {
			return fmt.Errorf("AWS SES SMTP send failed for recipient %s via %s: %w", recipient, host, err)
		}
	}

	return nil
}
