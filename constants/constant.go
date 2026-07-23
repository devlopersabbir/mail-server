package constants

import (
	"bufio"
	"os"
	"strings"
)

const (
	SmtpHost = "smtp.gmail.com"
	SmtpPort = "587"
)

func init() {
	loadEnv(".env")
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

func GetSenderEmail() string {
	return os.Getenv("SMTP_EMAIL")
}

func GetSenderPassword() string {
	return os.Getenv("SMTP_PASSWORD")
}
