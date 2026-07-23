# Mail Server Engine Makefile

APP_NAME = mail-server
IMAGE_NAME = ghcr.io/devlopersabbir/mail-server
BUILD_DIR = bin
MAIN_FILE = cmd/server/main.go

.PHONY: all build run dev test clean fmt tidy help docker-build docker-push docker-up docker-down

all: build

## build: Compiles the mail server binary into bin/
build:
	@echo "Building $(APP_NAME)..."
	@go build -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_FILE)
	@echo "Build complete: $(BUILD_DIR)/$(APP_NAME)"

## run: Runs the application directly
run:
	@go run $(MAIN_FILE)

## dev: Runs the application with root main.go
dev:
	@go run main.go

## web-install: Installs frontend dependencies in web/
web-install:
	@cd web && bun install

## web-dev: Starts the Vite React TypeScript frontend dashboard
web-dev:
	@cd web && bun run dev

## web-build: Builds the React TypeScript frontend production bundle
web-build:
	@cd web && bun run build

## docker-build: Builds the multi-stage Docker image for GHCR
docker-build:
	@echo "Building Docker image for GHCR..."
	@docker build -t $(IMAGE_NAME):latest .

## docker-push: Pushes the Docker image to GitHub Container Registry (ghcr.io)
docker-push:
	@echo "Pushing Docker image to GHCR ($(IMAGE_NAME):latest)..."
	@docker push $(IMAGE_NAME):latest

## docker-dev: Starts Redis 7 and MongoDB 7 databases for local development (dev profile)
docker-dev:
	@echo "Starting development databases (Redis + MongoDB)..."
	@docker compose --profile dev up -d

## docker-prod: Starts full production stack (mail-server + Redis + MongoDB - prod profile)
docker-prod:
	@echo "Starting production stack (mail-server + Redis + MongoDB)..."
	@docker compose --profile prod up -d --build

## docker-down: Stops and removes all Docker Compose services
docker-down:
	@echo "Stopping Docker Compose stack..."
	@docker compose --profile prod --profile dev down

## test: Runs all Go unit tests
test:
	@go test -v ./...

## fmt: Formats all Go source files
fmt:
	@go fmt ./...

## tidy: Cleans up and verifies dependencies in go.mod
tidy:
	@go mod tidy

## clean: Removes build artifacts
clean:
	@echo "Cleaning build directory..."
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete."

## help: Displays available Makefile targets
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@sed -n 's/^##//p' $(MAKEFILE_LIST) | column -t -s ':' | sed -e 's/^/ /'
