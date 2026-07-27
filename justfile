# glowworm - Network Worm for educational purposes
# Run `just` to see all available commands

# Default recipe - show help
default:
    @just --list

# Build the worm binary
build:
    go build -o bin/glowworm ./cmd/glowworm

# Build for Windows
build-windows:
    GOOS=windows GOARCH=amd64 go build -o bin/glowworm.exe ./cmd/glowworm

# Build for Linux (static)
build-linux:
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/glowworm-linux ./cmd/glowworm

# Build frontend (requires pnpm)
build-frontend:
    cd frontend && pnpm install && pnpm build

# Build everything
build-all: build build-windows build-linux build-frontend

# Run in dry-run mode (scan only, no spreading)
dry-run range="192.168.1.0/24":
    go run ./cmd/glowworm scan --range {{range}} --dry-run

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

# Show help
help:
    go run ./cmd/glowworm --help
