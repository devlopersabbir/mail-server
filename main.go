package main

import (
	"log"
	conf "mail-server/conf"
)

func main() {
	email := &conf.EmailMessage{
		From:    "devlopersabbir@gmail.com",
		To:      []string{"mdsabbirkhansabbir86@gmail.com"},
		Subject: "Production Email from Go",
		Body:    "This email was sent using Go's net/smtp package with proper error handling and message formatting.",
	}

	log.Printf("Sending email to %v...", email.To)
	if err := conf.SendEmail(email); err != nil {
		log.Fatalf("Error sending email: %v", err)
	}
	log.Println("Email sent successfully")
}
