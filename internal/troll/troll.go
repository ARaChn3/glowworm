/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package troll provides the fun/educational features of glowworm.
//
// These features demonstrate what malware could do in a harmless way:
// - Drop ASCII art files
// - Open funny videos
// - Display messages
//
// None of these are destructive - they're just educational demonstrations.
package troll

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// GlowArt is the ASCII art dropped on infected systems.
const GlowArt = `
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

// GlowVideoURL is the video opened on infected systems.
const GlowVideoURL = "https://youtu.be/VDYZH3KYBTs"

// DropGlowFile creates the "you've been glowed" marker file.
//
// The file is placed in the user's home directory as a visible
// indicator that the system was "infected" (for educational demo).
func DropGlowFile() error {
	// Get home directory
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	// Write the file
	path := filepath.Join(home, "youve-been-glowed.txt")
	return os.WriteFile(path, []byte(GlowArt), 0644)
}

// OpenGlowVideo opens the glow video in the default browser.
//
// This demonstrates how malware can interact with the user's
// browser to open arbitrary content.
func OpenGlowVideo() error {
	return openURL(GlowVideoURL)
}

// openURL opens a URL in the system's default browser.
//
// Uses platform-specific commands:
//   - Linux: xdg-open
//   - macOS: open
//   - Windows: start
func openURL(url string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	default:
		return nil
	}

	return cmd.Start()
}

// ShowMessage displays a popup message on the infected system.
//
// Uses platform-specific dialog tools:
//   - Linux: zenity or kdialog
//   - macOS: osascript
//   - Windows: PowerShell
func ShowMessage(message string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "linux":
		// Try zenity first, fall back to kdialog
		cmd = exec.Command("zenity", "--info", "--text", message, "--title", "glowworm")
		if err := cmd.Run(); err != nil {
			cmd = exec.Command("kdialog", "--msgbox", message, "--title", "glowworm")
			return cmd.Run()
		}
		return nil

	case "darwin":
		script := `display dialog "` + message + `" with title "glowworm" buttons {"OK"}`
		cmd = exec.Command("osascript", "-e", script)

	case "windows":
		script := `Add-Type -AssemblyName System.Windows.Forms; ` +
			`[System.Windows.Forms.MessageBox]::Show('` + message + `', 'glowworm')`
		cmd = exec.Command("powershell", "-Command", script)

	default:
		return nil
	}

	return cmd.Run()
}

// PerformTroll executes all troll actions.
//
// This is called after successful infection to leave
// the educational markers on the system.
func PerformTroll() {
	// Drop the marker file
	_ = DropGlowFile()

	// Open the video
	_ = OpenGlowVideo()
}
