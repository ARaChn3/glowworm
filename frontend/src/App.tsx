import { useState } from 'react'
import { Wifi, Search, Zap, Activity, CheckCircle, XCircle, AlertTriangle, Globe, Server, Terminal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

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
  { ip: '192.168.1.20', ports: [445], services: { 445: 'smb' }, status: 'discovered', hostname: 'accounting-pc', os: 'Windows 10', lastAttempt: undefined },
  { ip: '192.168.1.25', ports: [22], services: { 22: 'ssh' }, status: 'failed', hostname: 'hardened-box', os: 'Rocky Linux 9', lastAttempt: '5m ago' },
  { ip: '192.168.1.30', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'infected', hostname: 'dev-workstation', os: 'Ubuntu 24.04', lastAttempt: '1m ago' },
  { ip: '192.168.1.35', ports: [445], services: { 445: 'smb' }, status: 'immune', hostname: 'backup-nas', os: 'Synology DSM', lastAttempt: '4m ago' },
  { ip: '192.168.1.40', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'raspberry-pi', os: 'Raspbian 11', lastAttempt: '30s ago' },
  { ip: '192.168.1.45', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'discovered', hostname: 'print-server', os: 'Windows Server 2016', lastAttempt: undefined },
  { ip: '192.168.1.50', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'docker-host', os: 'Debian 12', lastAttempt: '45s ago' },
  { ip: '192.168.1.55', ports: [445], services: { 445: 'smb' }, status: 'failed', hostname: 'hr-desktop', os: 'Windows 11', lastAttempt: '6m ago' },
  { ip: '192.168.1.60', ports: [22], services: { 22: 'ssh' }, status: 'infected', hostname: 'monitoring', os: 'CentOS 8', lastAttempt: '2m ago' },
  { ip: '192.168.1.65', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'discovered', hostname: 'sales-pc', os: 'Windows 10', lastAttempt: undefined },
]

const INITIAL_LOGS: LogEntry[] = [
  { time: '14:30:01', message: 'Glowworm v0.1.0 initialized', type: 'info' },
  { time: '14:30:02', message: 'Loaded SSH vector with 15 credential pairs', type: 'info' },
  { time: '14:30:02', message: 'Loaded SMB vector with 8 credential pairs', type: 'info' },
  { time: '14:30:05', message: 'Starting scan of 192.168.1.0/24', type: 'info' },
  { time: '14:30:12', message: 'Found 12 hosts with open ports', type: 'success' },
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 dark">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Zap className="w-6 h-6 text-green-400" />
            <span className="text-green-400">glowworm</span>
            <Badge variant="outline" className="text-xs">v0.1.0</Badge>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <Globe className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-zinc-500">Discovered</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">{stats.infected}</div>
              <p className="text-xs text-zinc-500">Infected</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
              <p className="text-xs text-zinc-500">Failed</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-400">{stats.immune}</div>
              <p className="text-xs text-zinc-500">Immune</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <Server className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{stats.discovered}</div>
              <p className="text-xs text-zinc-500">Ready</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scanner */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-green-400" />
                  Network Scanner
                </CardTitle>
                <CardDescription>Scan for hosts with SSH/SMB ports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    value={targetRange}
                    onChange={e => setTargetRange(e.target.value)}
                    placeholder="192.168.1.0/24"
                    className="flex-1 bg-zinc-800 border-zinc-700 font-mono"
                  />
                  <Button onClick={startScan} disabled={scanning} className="bg-green-600 hover:bg-green-500">
                    <Wifi className={`w-4 h-4 mr-2 ${scanning ? 'animate-pulse' : ''}`} />
                    {scanning ? 'Scanning...' : 'Scan'}
                  </Button>
                </div>

                {/* Hosts Table */}
                <div className="rounded-md border border-zinc-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-800 hover:bg-zinc-800">
                        <TableHead>Host</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hosts.map(host => (
                        <TableRow
                          key={host.ip}
                          onClick={() => setSelectedHost(selectedHost === host.ip ? null : host.ip)}
                          className={`cursor-pointer ${selectedHost === host.ip ? 'bg-zinc-800' : ''}`}
                        >
                          <TableCell>
                            <div className="font-medium">{host.hostname || '-'}</div>
                            <div className="text-xs text-zinc-500">{host.os || 'Unknown'}</div>
                          </TableCell>
                          <TableCell className="font-mono text-zinc-400">{host.ip}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {host.ports.map(p => (
                                <Badge key={p} variant="secondary" className="text-xs">{host.services[p]}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {host.status === 'infected' && <Badge className="bg-green-600">Infected</Badge>}
                            {host.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                            {host.status === 'immune' && <Badge className="bg-yellow-600">Immune</Badge>}
                            {host.status === 'discovered' && <Badge variant="outline">Ready</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Spread Config */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  Spread Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={vectors.ssh} onCheckedChange={c => setVectors(v => ({ ...v, ssh: !!c }))} />
                    <span>SSH (Port 22)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={vectors.smb} onCheckedChange={c => setVectors(v => ({ ...v, smb: !!c }))} />
                    <span>SMB (Port 445)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={trollMode} onCheckedChange={c => setTrollMode(!!c)} />
                    <span className="text-green-400">Troll Mode</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={dryRun} onCheckedChange={c => setDryRun(!!c)} />
                    <span className="text-yellow-400">Dry Run</span>
                  </label>
                </div>
                <Button onClick={startSpread} disabled={hosts.length === 0} className="bg-green-600 hover:bg-green-500">
                  Start Spread
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Log */}
          <Card className="bg-zinc-900 border-zinc-800 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 rounded p-4 font-mono text-xs max-h-[500px] overflow-auto space-y-1">
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
              <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="mt-4 text-xs">
                Clear logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Selected Host Detail */}
        {selectedHost && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-green-400" />
                Host Details: {hosts.find(h => h.ip === selectedHost)?.hostname || selectedHost}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default App
