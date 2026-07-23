package provider

import (
	"fmt"
	"mail-server/config"
	"mail-server/internal/model"
)

type EmailProvider interface {
	Send(msg *model.EmailMessage) error
	Name() string
}

func GetProvider() (EmailProvider, error) {
	cfg := config.GetManager().GetConfig()

	switch cfg.Provider {
	case model.ProviderSMTP:
		return NewSMTPProvider(cfg), nil
	case model.ProviderSES:
		return NewSESProvider(cfg), nil
	default:
		return NewSMTPProvider(cfg), nil
	}
}

func GetProviderForConfig(cfg model.ConfigState) (EmailProvider, error) {
	switch cfg.Provider {
	case model.ProviderSMTP:
		return NewSMTPProvider(cfg), nil
	case model.ProviderSES:
		return NewSESProvider(cfg), nil
	default:
		return nil, fmt.Errorf("unsupported provider: %s", cfg.Provider)
	}
}
