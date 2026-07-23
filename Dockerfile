# Stage 1: Build the Go binary
FROM golang:alpine AS builder

WORKDIR /app

# Install ca-certificates and git
RUN apk add --no-cache ca-certificates git

# Copy dependency files and download modules
COPY go.mod ./
RUN go mod download || true

# Copy source code
COPY . .

# Build clean standalone binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server/main.go

# Stage 2: Minimal Alpine Runtime Container
FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

# Copy compiled binary from builder stage
COPY --from=builder /app/server .

# Expose Go Mail Server API port
EXPOSE 8080

CMD ["./server"]
