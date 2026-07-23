# Mail Server Engine Makefile

APP_NAME = mail-server
BUILD_DIR = bin
MAIN_FILE = cmd/server/main.go

.PHONY: all build run dev test clean fmt tidy help

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
