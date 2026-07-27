# glowworm - Network Worm for educational purposes
# Run `make help` to see all available commands

.PHONY: all build build-windows build-linux build-frontend build-all \
        dry-run test test-cov fmt lint clean install deps help

# Default target
all: build

# Build the worm binary
build:
	go build -o bin/glowworm ./cmd/glowworm

# Build for Windows
build-windows:
	GOOS=windows GOARCH=amd64 go build -o bin/glowworm.exe ./cmd/glowworm

# Build for Linux (static binary)
build-linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/glowworm-linux ./cmd/glowworm

# Build frontend (requires pnpm)
build-frontend:
	cd frontend && pnpm install && pnpm build

# Build everything
build-all: build build-windows build-linux build-frontend

# Run in dry-run mode (scan only, no spreading)
dry-run:
	go run ./cmd/glowworm scan --range 192.168.1.0/24 --dry-run

# Run tests
test:
	go test ./...

# Run tests with coverage
test-cov:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Format code
fmt:
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html
	rm -rf frontend/dist frontend/node_modules

# Install to $GOPATH/bin
install:
	go install ./cmd/glowworm

# Update dependencies
deps:
	go mod tidy
	go mod download

# Show available commands
help:
	@echo "glowworm - Network Worm (Educational)"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  build          Build worm binary"
	@echo "  build-windows  Build for Windows"
	@echo "  build-linux    Build static Linux binary"
	@echo "  build-frontend Build web UI"
	@echo "  build-all      Build everything"
	@echo "  dry-run        Test scan (no spreading)"
	@echo "  test           Run tests"
	@echo "  test-cov       Run tests with coverage"
	@echo "  fmt            Format code"
	@echo "  lint           Lint code"
	@echo "  clean          Clean build artifacts"
	@echo "  install        Install to GOPATH/bin"
	@echo "  deps           Update dependencies"
