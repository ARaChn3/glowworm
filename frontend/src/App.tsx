import { useState } from 'react'
import { Wifi, Search, Zap, Activity, CheckCircle, XCircle, AlertTriangle, Globe, Server, Terminal } from 'lucide-react'

interface Host {
  ip: string
  ports: number[]
  services: Record<number, string>
  status: 'discovered' | 'infected' | 'failed' | 'immune'
  hostname?: string
  os?: string
  lastAttempt?: string
}

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

const MOCK_HOSTS: Host[] = [
  { ip: '192.168.1.10', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'ubuntu-server', os: 'Ubuntu 22.04', lastAttempt: '2m ago' },
  { ip: '192.168.1.15', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'infected', hostname: 'file-server', os: 'Windows Server 2019', lastAttempt: '3m ago' },
  { ip: '192.168.1.20', ports: [445], services: { 445: 'smb' }, status: 'discovered', hostname: 'accounting-pc', os: 'Windows 10', lastAttempt: null },
  { ip: '192.168.1.25', ports: [22], services: { 22: 'ssh' }, status: 'failed', hostname: 'hardened-box', os: 'Rocky Linux 9', lastAttempt: '5m ago' },
  { ip: '192.168.1.30', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'infected', hostname: 'dev-workstation', os: 'Ubuntu 24.04', lastAttempt: '1m ago' },
  { ip: '192.168.1.35', ports: [445], services: { 445: 'smb' }, status: 'immune', hostname: 'backup-nas', os: 'Synology DSM', lastAttempt: '4m ago' },
  { ip: '192.168.1.40', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'raspberry-pi', os: 'Raspbian 11', lastAttempt: '30s ago' },
  { ip: '192.168.1.45', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'discovered', hostname: 'print-server', os: 'Windows Server 2016', lastAttempt: null },
  { ip: '192.168.1.50', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'docker-host', os: 'Debian 12', lastAttempt: '45s ago' },
  { ip: '192.168.1.55', ports: [445], services: { 445: 'smb' }, status: 'failed', hostname: 'hr-desktop', os: 'Windows 11', lastAttempt: '6m ago' },
  { ip: '192.168.1.60', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'monitoring', os: 'CentOS 8', lastAttempt: '2m ago' },
  { ip: '192.168.1.65', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'discovered', hostname: 'sales-pc', os: 'Windows 10', lastAttempt: null },
  { ip: '192.168.1.70', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'jenkins-ci', os: 'Ubuntu 20.04', lastAttempt: '15s ago' },
  { ip: '192.168.1.75', ports: [445], services: { 445: 'smb' }, status: 'immune', hostname: 'domain-ctrl', os: 'Windows Server 2022', lastAttempt: '3m ago' },
  { ip: '192.168.1.80', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'kali-test', os: 'Kali 2024.1', lastAttempt: '1m ago' },
]

const INITIAL_LOGS: LogEntry[] = [
  { time: '14:30:01', message: 'Glowworm v0.1.0 initialized', type: 'info' },
  { time: '14:30:02', message: 'Loaded SSH vector with 15 credential pairs', type: 'info' },
  { time: '14:30:02', message: 'Loaded SMB vector with 8 credential pairs', type: 'info' },
  { time: '14:30:05', message: 'Starting scan of 192.168.1.0/24', type: 'info' },
  { time: '14:30:12', message: 'Found 15 hosts with open ports', type: 'success' },
  { time: '14:31:00', message: 'SSH auth success: ubuntu-server (root:toor)', type: 'success' },
  { time: '14:31:05', message: 'Payload deployed to ubuntu-server', type: 'success' },
  { time: '14:31:15', message: 'SSH auth failed: hardened-box (pubkey only)', type: 'error' },
  { time: '14:31:30', message: 'SMB auth success: file-server (admin:admin123)', type: 'success' },
  { time: '14:31:45', message: 'SMB blocked by AV: backup-nas', type: 'warning' },
]

function App() {
  const [targetRange, setTargetRange] = useState('192.168.1.0/24')
  const [scanning, setScanning] = useState(false)
  const [hosts, setHosts] = useState<Host[]>(MOCK_HOSTS)
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS)
  const [vectors, setVectors] = useState({ ssh: true, smb: true })
  const [dryRun, setDryRun] = useState(true)
  const [trollMode, setTrollMode] = useState(true)
  const [selectedHost, setSelectedHost] = useState<string | null>(null)

  function addLog(message: string, type: LogEntry['type'] = 'info') {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }])
  }

  async function startScan() {
    setScanning(true)
    addLog(`Scanning ${targetRange}...`, 'info')

    await new Promise(r => setTimeout(r, 1500))

    const newHosts = MOCK_HOSTS.map(h => ({ ...h, status: 'discovered' as const }))
    setHosts(newHosts)
    addLog(`Found ${newHosts.length} hosts with open ports`, 'success')
    setScanning(false)
  }

  async function startSpread() {
    if (hosts.length === 0) {
      addLog('No targets available. Run a scan first.', 'error')
      return
    }

    const activeVectors = Object.entries(vectors).filter(([, v]) => v).map(([k]) => k)
    addLog(`Starting spread with vectors: ${activeVectors.join(', ')}${dryRun ? ' (DRY RUN)' : ''}`, 'info')

    if (trollMode) {
      addLog('Troll mode enabled: dropping youve-been-glowed.txt', 'warning')
    }

    for (const host of hosts) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500))

      if (dryRun) {
        addLog(`[DRY RUN] Would attempt ${host.hostname || host.ip} via ${Object.values(host.services).join('/')}`, 'info')
      } else {
        const rand = Math.random()
        if (rand > 0.3) {
          addLog(`Infected ${host.hostname || host.ip} via ${Object.values(host.services)[0]}`, 'success')
          setHosts(prev => prev.map(h => h.ip === host.ip ? { ...h, status: 'infected', lastAttempt: 'just now' } : h))
        } else if (rand > 0.1) {
          addLog(`Failed to infect ${host.hostname || host.ip}: auth failed`, 'error')
          setHosts(prev => prev.map(h => h.ip === host.ip ? { ...h, status: 'failed', lastAttempt: 'just now' } : h))
        } else {
          addLog(`${host.hostname || host.ip} immune: AV/EDR detected`, 'warning')
          setHosts(prev => prev.map(h => h.ip === host.ip ? { ...h, status: 'immune', lastAttempt: 'just now' } : h))
        }
      }
    }

    addLog('Spread complete', 'success')
  }

  const stats = {
    total: hosts.length,
    infected: hosts.filter(h => h.status === 'infected').length,
    failed: hosts.filter(h => h.status === 'failed').length,
    immune: hosts.filter(h => h.status === 'immune').length,
    discovered: hosts.filter(h => h.status === 'discovered').length,
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Zap className="w-6 h-6 text-green-400" />
            <span className="glow">glowworm</span>
            <span className="text-xs text-zinc-500 font-normal">v0.1.0</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-zinc-900 rounded-lg p-4 text-center">
            <Globe className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-zinc-500">Discovered</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">{stats.infected}</div>
            <div className="text-xs text-zinc-500">Infected</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 text-center">
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-xs text-zinc-500">Failed</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">{stats.immune}</div>
            <div className="text-xs text-zinc-500">Immune</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 text-center">
            <Server className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">{stats.discovered}</div>
            <div className="text-xs text-zinc-500">Ready</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scanner */}
            <div className="bg-zinc-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-green-400" />
                Network Scanner
              </h2>

              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={targetRange}
                  onChange={e => setTargetRange(e.target.value)}
                  placeholder="192.168.1.0/24"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-4 py-2 focus:outline-none focus:border-green-500 font-mono"
                />
                <button
                  onClick={startScan}
                  disabled={scanning}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <Wifi className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
                  {scanning ? 'Scanning...' : 'Scan'}
                </button>
              </div>

              {/* Hosts Table */}
              <div className="bg-zinc-800 rounded overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-700 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2">Host</th>
                      <th className="text-left px-4 py-2">IP</th>
                      <th className="text-left px-4 py-2">Services</th>
                      <th className="text-left px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosts.map(host => (
                      <tr
                        key={host.ip}
                        onClick={() => setSelectedHost(selectedHost === host.ip ? null : host.ip)}
                        className={`border-t border-zinc-700 cursor-pointer transition ${selectedHost === host.ip ? 'bg-zinc-700' : 'hover:bg-zinc-750'}`}
                      >
                        <td className="px-4 py-2">
                          <div className="font-medium">{host.hostname || '-'}</div>
                          <div className="text-xs text-zinc-500">{host.os || 'Unknown'}</div>
                        </td>
                        <td className="px-4 py-2 font-mono text-zinc-400">{host.ip}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            {host.ports.map(p => (
                              <span key={p} className="px-2 py-0.5 bg-zinc-700 rounded text-xs">{host.services[p]}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {host.status === 'infected' && (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-4 h-4" /> Infected
                            </span>
                          )}
                          {host.status === 'failed' && (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle className="w-4 h-4" /> Failed
                            </span>
                          )}
                          {host.status === 'immune' && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <AlertTriangle className="w-4 h-4" /> Immune
                            </span>
                          )}
                          {host.status === 'discovered' && (
                            <span className="text-blue-400">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spread Config */}
            <div className="bg-zinc-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-400" />
                Spread Configuration
              </h2>

              <div className="flex flex-wrap gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vectors.ssh}
                    onChange={e => setVectors(v => ({ ...v, ssh: e.target.checked }))}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span>SSH (Port 22)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vectors.smb}
                    onChange={e => setVectors(v => ({ ...v, smb: e.target.checked }))}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span>SMB (Port 445)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trollMode}
                    onChange={e => setTrollMode(e.target.checked)}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-green-400">Troll Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={e => setDryRun(e.target.checked)}
                    className="w-4 h-4 accent-yellow-500"
                  />
                  <span className="text-yellow-400">Dry Run</span>
                </label>
              </div>

              <button
                onClick={startSpread}
                disabled={hosts.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 transition"
              >
                Start Spread
              </button>
            </div>
          </div>

          {/* Right Column - Activity Log */}
          <div className="bg-zinc-900 rounded-lg p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Activity Log
            </h2>

            <div className="bg-zinc-950 rounded p-4 font-mono text-xs max-h-[600px] overflow-auto space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-zinc-600 shrink-0">{log.time}</span>
                  <span className={
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-zinc-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setLogs([])}
              className="mt-4 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear logs
            </button>
          </div>
        </div>

        {/* Selected Host Detail */}
        {selectedHost && (
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-green-400" />
              Host Details: {hosts.find(h => h.ip === selectedHost)?.hostname || selectedHost}
            </h2>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-zinc-500">IP Address</div>
                <div className="font-mono">{selectedHost}</div>
              </div>
              <div>
                <div className="text-zinc-500">Operating System</div>
                <div>{hosts.find(h => h.ip === selectedHost)?.os || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-zinc-500">Open Ports</div>
                <div>{hosts.find(h => h.ip === selectedHost)?.ports.join(', ')}</div>
              </div>
              <div>
                <div className="text-zinc-500">Last Attempt</div>
                <div>{hosts.find(h => h.ip === selectedHost)?.lastAttempt || 'Never'}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
