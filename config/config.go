package config

import (
	"bufio"
	"mail-server/internal/model"
	"os"
	"strings"
	"sync"
)

type ConfigManager struct {
	mu     sync.RWMutex
	config model.ConfigState
}

var globalConfig *ConfigManager
var once sync.Once

func GetManager() *ConfigManager {
	once.Do(func() {
		loadEnv(".env")
		globalConfig = &ConfigManager{
			config: model.ConfigState{
				Provider:           model.ProviderType(getEnvOrDefault("MAIL_PROVIDER", string(model.ProviderSMTP))),
				SMTPHost:           getEnvOrDefault("SMTP_HOST", "smtp.gmail.com"),
				SMTPPort:           getEnvOrDefault("SMTP_PORT", "587"),
				SMTPUsername:       getEnvOrDefault("SMTP_USERNAME", getEnvOrDefault("SMTP_EMAIL", "")),
				SenderEmail:        getEnvOrDefault("SMTP_EMAIL", ""),
				SenderName:         getEnvOrDefault("SENDER_NAME", ""),
				SenderPassword:     getEnvOrDefault("SMTP_PASSWORD", ""),
				ReplyTo:            getEnvOrDefault("REPLY_TO", ""),
				AWSRegion:          getEnvOrDefault("AWS_REGION", "us-east-1"),
				AWSAccessKeyID:     getEnvOrDefault("AWS_ACCESS_KEY_ID", ""),
				AWSSecretAccessKey: getEnvOrDefault("AWS_SECRET_ACCESS_KEY", ""),
				MaxWorkers:         50,
				QueueCapacity:      100000,
			},
		}
	})
	return globalConfig
}

func (cm *ConfigManager) GetConfig() model.ConfigState {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.config
}

func (cm *ConfigManager) GetSafeResponse() model.ConfigResponse {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	cfg := cm.config

	return model.ConfigResponse{
		Provider:           cfg.Provider,
		SMTPHost:           cfg.SMTPHost,
		SMTPPort:           cfg.SMTPPort,
		SMTPUsername:       cfg.SMTPUsername,
		SenderEmail:        cfg.SenderEmail,
		SenderName:         cfg.SenderName,
		ReplyTo:            cfg.ReplyTo,
		HasSenderPassword:  cfg.SenderPassword != "",
		AWSRegion:          cfg.AWSRegion,
		AWSAccessKeyID:     cfg.AWSAccessKeyID,
		HasAWSSecretAccess: cfg.AWSSecretAccessKey != "",
		MaxWorkers:         cfg.MaxWorkers,
		QueueCapacity:      cfg.QueueCapacity,
	}
}

func (cm *ConfigManager) UpdateConfig(newCfg model.ConfigState) model.ConfigState {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if newCfg.Provider != "" {
		cm.config.Provider = newCfg.Provider
	}
	if newCfg.SMTPHost != "" {
		cm.config.SMTPHost = newCfg.SMTPHost
	}
	if newCfg.SMTPPort != "" {
		cm.config.SMTPPort = newCfg.SMTPPort
	}
	if newCfg.SMTPUsername != "" {
		cm.config.SMTPUsername = newCfg.SMTPUsername
	}
	if newCfg.SenderEmail != "" {
		cm.config.SenderEmail = newCfg.SenderEmail
	}
	if newCfg.SenderName != "" {
		cm.config.SenderName = newCfg.SenderName
	}
	if newCfg.SenderPassword != "" {
		cm.config.SenderPassword = newCfg.SenderPassword
	}
	if newCfg.ReplyTo != "" {
		cm.config.ReplyTo = newCfg.ReplyTo
	}
	if newCfg.AWSRegion != "" {
		cm.config.AWSRegion = newCfg.AWSRegion
	}
	if newCfg.AWSAccessKeyID != "" {
		cm.config.AWSAccessKeyID = newCfg.AWSAccessKeyID
	}
	if newCfg.AWSSecretAccessKey != "" {
		cm.config.AWSSecretAccessKey = newCfg.AWSSecretAccessKey
	}
	if newCfg.MaxWorkers > 0 {
		cm.config.MaxWorkers = newCfg.MaxWorkers
	}
	if newCfg.QueueCapacity > 0 {
		cm.config.QueueCapacity = newCfg.QueueCapacity
	}

	return cm.config
}

func getEnvOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func loadEnv(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
	_ = scanner.Err()
}
