<p align="center">
<img src="glowworm-logo.png" width="300">
</p>

# glowworm

A network worm written in Go. Lights up your network.

## :exclamation: Warning :exclamation:

This project is _strictly for educational/research purposes_, any malicious activities that involve use of this repository is not the responsibility of the owner.
**:zap: Ignore at your own risk! :zap:**

## Features

- [ ] Self-propagation via network scanning
- [ ] Multiple spreading vectors (SSH, SMB, exploits)
- [ ] Embedded payload support
- [ ] Cross-platform (Windows/Linux)
- [ ] Configurable scan ranges
- [ ] Stealth mode

## Installation

```bash
go install github.com/ARaChn3/glowworm@latest
```

## Usage

```bash
# Build a worm with embedded payload
glowworm build --payload ./payload.bin --vectors ssh,smb

# Dry run (scan only, no spreading)
glowworm scan --range 192.168.1.0/24 --dry-run
```

## Architecture

```
glowworm/
├── cmd/
│   └── glowworm/
├── internal/
│   ├── scanner/      # Network scanning
│   ├── spreader/     # Propagation logic
│   ├── vectors/      # Spreading vectors
│   └── payload/      # Payload handling
├── go.mod
└── go.sum
```

## References

- [Neurax](https://github.com/redcode-labs/Neurax) - Inspiration for spreading patterns

## License :scroll:

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more information.
