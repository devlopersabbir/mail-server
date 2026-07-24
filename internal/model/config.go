package model

type ProviderType string

const (
	ProviderSMTP ProviderType = "smtp"
	ProviderSES  ProviderType = "aws_ses"
)

type ConfigState struct {
	Provider ProviderType `json:"provider"`

	// SMTP Settings
	SMTPHost       string `json:"smtp_host,omitempty"`
	SMTPPort       string `json:"smtp_port,omitempty"`
	SMTPUsername   string `json:"smtp_username,omitempty"`
	SenderEmail    string `json:"sender_email"`
	SenderName     string `json:"sender_name,omitempty"`
	SenderPassword string `json:"sender_password,omitempty"`
	ReplyTo        string `json:"reply_to,omitempty"`

	// AWS SES Settings
	AWSRegion          string `json:"aws_region,omitempty"`
	AWSAccessKeyID     string `json:"aws_access_key_id,omitempty"`
	AWSSecretAccessKey string `json:"aws_secret_access_key,omitempty"`

	// Worker Pool Settings
	MaxWorkers    int `json:"max_workers,omitempty"`
	QueueCapacity int `json:"queue_capacity,omitempty"`
}

type ConfigResponse struct {
	Provider           ProviderType `json:"provider"`
	SMTPHost           string       `json:"smtp_host,omitempty"`
	SMTPPort           string       `json:"smtp_port,omitempty"`
	SMTPUsername       string       `json:"smtp_username,omitempty"`
	SenderEmail        string       `json:"sender_email"`
	SenderName         string       `json:"sender_name,omitempty"`
	ReplyTo            string       `json:"reply_to,omitempty"`
	HasSenderPassword  bool         `json:"has_sender_password"`
	AWSRegion          string       `json:"aws_region,omitempty"`
	AWSAccessKeyID     string       `json:"aws_access_key_id,omitempty"`
	HasAWSSecretAccess bool         `json:"has_aws_secret_access"`
	MaxWorkers         int          `json:"max_workers"`
	QueueCapacity      int          `json:"queue_capacity"`
}
