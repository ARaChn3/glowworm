import { useState } from 'react'
import { Wifi, Search, Zap, Activity, CheckCircle, XCircle } from 'lucide-react'

interface Host {
  ip: string
  ports: number[]
  services: Record<number, string>
  status: 'discovered' | 'infected' | 'failed'
}

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

const GLOW_ART = `
                                      ---------------
                                 -++==-----------------==-
                                ****+-----------------=+***+
                                **+=---------:..:------=+**@
                                +==-------*@@@@@@@@@@*==+**@
                             -@@@@@@@*++*@@@@@@@@@@@@@%****@
                            @@@@@@@@@@@**@@@@@@*++*%#@@****@
                           *@@@*-*@@@@@=*@@@@=@@@@@  @@@***@
                           -@@@@@@- @@@ -*@@*@@@@@@@.+@@@**%
                            @@@@@@*.*@* -+**%@@@@@@@%@*:-=*@
                            @@@@@@@@@#=:-++==*@@@@@*-  :--*@.
                           :+*@@@*++*%-.-+**+===-----==***%@:
                          .%*=--=**@#*------*@@@@@@@@@@@@@@@-
                           *@@@@@@@@@@@@@@@@@**@@@@@@@@@@@@@-
                            +@@@@@@*@@@@@@@@=  .+@@@@@@@@@@@=
                              #*@@@%@@@@@@@@@@@@@%*%@@@@@@@@+
                               :*@@@@@@@@@***%@@*+**#@@@@@@@+
                                -@@@@@@@@@@@@@*++***%@@@@@@@+
                                 :@@@@@@@@**+++***%@@#%@@@@@*
                                  @@@@@@@@%%#@@@@@@%***#@@@@*
                                 .%@@@@@@@@@@@@@#*******#%@@*
                                 -+@@@@@@@@@@#***********--*+
                                 #=@@@@@@@#************@@***=
                                #@*@@@@@%************%%@@@**-
                                @@@#@@@@*************%%@@@**=
                                @@@+@@@@#************#%@@@@**
                                @@@+@@@@@%#***********%@@@@%*+
                               :@@@+@@@@@@%##*********#@@@%-+=
                               %@@@@@@@@@%%#**********#@@@*=+
                               @@@@@@@@@@%%##*********#@@%=+:
                               *@@@@@@@@@%%###*******#%@@*+*
                               @@+ @@@@@@@%%%###**###%@@*-*.
                               =@+ @@@@@@@%%%#######%#****#
                              .@%@@@@@@@@@@%%%%#####*@@@*%@
                               @@%@@@@@@@@@@%%###%@@@@@*@@@
                               .*#@@@@@@@@@@@%%%%@@@@@@@@
                              :+*@+ @@@@@@@*..=%@@@@@@@=
                             =+*@:  %@@@@@@     @@@%@@@
                           .+*#%    +@@@@@@     #****@%
                          ++*%*     :@#@@@@     *****@*
                        =+**@+      :@*#@@@     *****@*
                       +++*@:       =@**@@@     -****@+
                     =++*%@          @@@@@%      %@@@@*
                    +++*@*           @@@@@@      *@@@@@
                  +++*#@=            #@@@@@      :@@@%@-
                =****@@.              @@@@@       @@%@@*
              -**+*#@@                #@@@@:      #@@@@*
            -*****@@#                 :@@@@*      *@@@@=
          .******@@*                   @@@@*      +@@@@
         ******%@@+                    @@@@#      .@@@@
       *******%@@.                     @%@@@       @@@@
     :******#@@@                      -**%@@%     +%%%@
    *#****#%@@*                      -+**%@@@@    *+**@*
  =#*****%@@@=                    :-=****%@@@@@@ -=+***@=
 #@%**#%@@@@          .**+=-:::--=+****@@@@@@@@*-==+*****
#@@@@@@@@@%          ***+***+=+*****@@@@@@#***===++++++**+
   +@@@@@           :@@#******#@@@@@:       -+********+***+
                        *%@%%*.           :=**#***@**@*#@*@:
                                          #@@@**@@**#*-+: 
`

function App() {
  const [targetRange, setTargetRange] = useState('192.168.1.0/24')
  const [scanning, setScanning] = useState(false)
  const [hosts, setHosts] = useState<Host[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [vectors, setVectors] = useState({ ssh: true, smb: false })
  const [dryRun, setDryRun] = useState(true)
  const [showArt, setShowArt] = useState(false)

  function addLog(message: string, type: LogEntry['type'] = 'info') {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }])
  }

  async function startScan() {
    setScanning(true)
    setHosts([])
    addLog(`Scanning ${targetRange}...`, 'info')

    // Mock scan results
    await new Promise(r => setTimeout(r, 1500))

    const mockHosts: Host[] = [
      { ip: '192.168.1.10', ports: [22], services: { 22: 'ssh' }, status: 'discovered' },
      { ip: '192.168.1.15', ports: [22, 445], services: { 22: 'ssh', 445: 'smb' }, status: 'discovered' },
      { ip: '192.168.1.20', ports: [445], services: { 445: 'smb' }, status: 'discovered' },
    ]

    setHosts(mockHosts)
    addLog(`Found ${mockHosts.length} hosts with open ports`, 'success')
    setScanning(false)
  }

  async function startSpread() {
    if (hosts.length === 0) {
      addLog('No targets available. Run a scan first.', 'error')
      return
    }

    const activeVectors = Object.entries(vectors).filter(([, v]) => v).map(([k]) => k)
    addLog(`Starting spread with vectors: ${activeVectors.join(', ')}${dryRun ? ' (DRY RUN)' : ''}`, 'info')

    for (const host of hosts) {
      await new Promise(r => setTimeout(r, 800))

      if (dryRun) {
        addLog(`[DRY RUN] Would attempt ${host.ip} via ${Object.values(host.services).join('/')}`, 'info')
      } else {
        const success = Math.random() > 0.3
        if (success) {
          addLog(`Infected ${host.ip}`, 'success')
          setHosts(prev => prev.map(h => h.ip === host.ip ? { ...h, status: 'infected' } : h))
        } else {
          addLog(`Failed to infect ${host.ip}`, 'error')
          setHosts(prev => prev.map(h => h.ip === host.ip ? { ...h, status: 'failed' } : h))
        }
      }
    }

    addLog('Spread complete', 'success')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Zap className="w-6 h-6 text-green-400" />
            <span className="glow">glowworm</span>
          </h1>
          <button
            onClick={() => setShowArt(!showArt)}
            className="text-sm text-zinc-400 hover:text-green-400 transition"
          >
            {showArt ? 'Hide' : 'Show'} ASCII Art
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* ASCII Art */}
        {showArt && (
          <div className="bg-zinc-900 border border-green-900 rounded-lg p-4">
            <pre className="text-green-400 text-xs font-mono text-center">{GLOW_ART}</pre>
          </div>
        )}

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
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-4 py-2 focus:outline-none focus:border-green-500"
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
          {hosts.length > 0 && (
            <div className="bg-zinc-800 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-700">
                  <tr>
                    <th className="text-left px-4 py-2">IP</th>
                    <th className="text-left px-4 py-2">Ports</th>
                    <th className="text-left px-4 py-2">Services</th>
                    <th className="text-left px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map(host => (
                    <tr key={host.ip} className="border-t border-zinc-700">
                      <td className="px-4 py-2 font-mono">{host.ip}</td>
                      <td className="px-4 py-2">{host.ports.join(', ')}</td>
                      <td className="px-4 py-2">{Object.values(host.services).join(', ')}</td>
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
                        {host.status === 'discovered' && (
                          <span className="text-zinc-400">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

        {/* Activity Log */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Activity Log
          </h2>

          <div className="bg-zinc-950 rounded p-4 font-mono text-sm max-h-64 overflow-auto">
            {logs.length === 0 ? (
              <span className="text-zinc-500">No activity yet</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-zinc-500">{log.time}</span>
                  <span className={
                    log.type === 'success' ? 'text-green-400' :
                      log.type === 'error' ? 'text-red-400' :
                        'text-zinc-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
