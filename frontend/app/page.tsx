'use client'

import Link from 'next/link'
import { useState } from 'react'
import { scanPrompt } from '@/lib/api'

interface ScanResult {
  risk_level: string
  confidence_score: number
  categories: string[]
  decision: string
  explanation: string
  compliance_tags: string[]
}

export default function ScannerPage() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleScan = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const data = await scanPrompt(prompt)
      setResult(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400'
      case 'HIGH': return 'text-orange-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'LOW': return 'text-blue-400'
      default: return 'text-green-400'
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'BLOCK': return 'bg-red-900/50 text-red-400'
      case 'WARN': return 'bg-yellow-900/50 text-yellow-400'
      default: return 'bg-green-900/50 text-green-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#ffb4ab'
    if (score >= 60) return '#f97316'
    if (score >= 30) return '#eab308'
    return '#22c55e'
  }

  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = result
    ? circumference - (result.confidence_score / 100) * circumference
    : circumference

  return (
    <div className="bg-[#13131b] text-[#e4e1ed] min-h-screen antialiased">
      {/* TopAppBar */}
      <header className="bg-zinc-950/80 backdrop-blur-md text-sm tracking-wide font-medium top-0 z-50 border-b border-zinc-800/50 w-full px-6 h-16 fixed">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter text-white uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">security</span>
              GhostWire
            </span>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-indigo-400 border-b-2 border-indigo-500 pb-1">Scanner</Link>
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/incidents" className="text-zinc-400 hover:text-white transition-colors">Incidents</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-[#c0c1ff] text-[#1000a9] px-4 py-1.5 rounded-lg text-xs font-semibold uppercase">Upgrade Plan</button>
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-zinc-400 hover:text-white cursor-pointer p-2 hover:bg-zinc-900/50 rounded-full">notifications</span>
              <span className="material-symbols-outlined text-zinc-400 hover:text-white cursor-pointer p-2 hover:bg-zinc-900/50 rounded-full">settings</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">S</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen flex flex-col md:flex-row w-full">
        {/* Left Panel */}
        <section className="w-full md:w-1/2 p-10 flex flex-col justify-center min-h-[calc(100vh-64px)] border-r border-zinc-900">
          <div className="max-w-2xl mx-auto w-full">
            <header className="mb-8">
              <h1 className="text-[40px] font-semibold leading-tight tracking-tight text-white mb-2">
                Prompt Scanner
              </h1>
              <p className="text-[#c7c4d7] text-lg">
                Pre-execution analysis for secure AI deployment.
              </p>
            </header>
            <div className="relative">
              <div className="border border-[#1F1F1F] bg-[#0d0d15] rounded-xl p-6 focus-within:ring-2 focus-within:ring-[#c0c1ff]/20 transition-all duration-300">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-64 bg-transparent border-none text-[#e4e1ed] text-[15px] placeholder:text-zinc-600 focus:ring-0 resize-none outline-none"
                  placeholder="Paste your prompt here — GhostWire will analyze it before it reaches any AI system."
                />
                <div className="flex justify-between items-center mt-6">
                  <div className="flex items-center gap-4 text-zinc-500">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <p className="text-[11px] uppercase tracking-widest font-semibold">
                      Protected by GhostWire · EU AI Act compliant · SOC2 ready
                    </p>
                  </div>
                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="bg-[#c0c1ff] text-[#1000a9] px-8 py-3 rounded-xl text-[12px] font-semibold uppercase flex items-center gap-2 hover:bg-white transition-all active:translate-y-px disabled:opacity-50"
                  >
                    {loading ? 'Scanning...' : 'Scan Prompt'}
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#c0c1ff]/5 blur-[120px] rounded-full" />
            </div>
          </div>
        </section>

        {/* Right Panel */}
        <section className="w-full md:w-1/2 bg-[#1b1b23] p-10 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-xl mx-auto w-full space-y-6">
            {!result ? (
              <div className="border border-[#1F1F1F] bg-zinc-950 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-zinc-700 text-6xl mb-4">shield_lock</span>
                <p className="text-zinc-500 text-sm">Your scan results will appear here.</p>
                <p className="text-zinc-600 text-xs mt-2 font-mono">Awaiting prompt input...</p>
              </div>
            ) : (
              <>
                {/* Result Header Card */}
                <div className="border border-[#1F1F1F] bg-zinc-950 rounded-xl p-8 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-4 py-1 text-[10px] uppercase tracking-widest rounded-bl-lg font-mono ${getDecisionColor(result.decision)}`}>
                    Status: {result.decision}
                  </div>
                  <div className="flex items-start gap-8">
                    {/* Score Gauge */}
                    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="48" cy="48" fill="transparent" r="42" stroke="#1F1F1F" strokeWidth="4" />
                        <circle
                          cx="48" cy="48" fill="transparent" r="42"
                          stroke={getScoreColor(result.confidence_score)}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeWidth="4"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-white text-2xl font-semibold leading-none">{result.confidence_score}</span>
                        <span className={`text-[10px] font-mono ${getRiskColor(result.risk_level)}`}>
                          {result.risk_level}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 ${getRiskColor(result.risk_level)}`}>
                          {result.risk_level} Risk
                        </span>
                      </div>
                      <h3 className="text-white text-xl font-medium mb-4">
                        {result.decision === 'BLOCK' ? 'Security Violation Detected' :
                         result.decision === 'WARN' ? 'Potential Risk Detected' : 'Prompt Cleared'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.categories.map((cat) => (
                          <div key={cat} className="border border-[#1F1F1F] bg-zinc-900 px-3 py-1 rounded-full flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-400 text-sm">fingerprint</span>
                            <span className="text-zinc-300 font-mono text-xs">{cat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Box */}
                <div className="border border-[#1F1F1F] bg-zinc-950/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4 text-indigo-400">
                    <span className="material-symbols-outlined">psychology</span>
                    <h4 className="text-xs uppercase tracking-wider font-semibold">AI Analysis Insight</h4>
                  </div>
                  <div className="text-[#c7c4d7] text-[15px] space-y-4">
                    <p>{result.explanation}</p>
                    {result.decision === 'BLOCK' && (
                      <div className="p-4 bg-zinc-900/50 rounded border border-[#1F1F1F] border-l-2 border-l-red-400 font-mono text-xs leading-relaxed text-red-400/80">
                        [THREAT DETECTED] Prompt blocked by GhostWire AI Firewall before reaching LLM.
                      </div>
                    )}
                  </div>
                </div>

                {/* Compliance Footer */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex gap-4">
                    {result.compliance_tags.slice(0, 3).map((tag) => (
                      <div key={tag} className="flex items-center gap-1.5 opacity-60">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest">{tag}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/incidents" className="text-[#c0c1ff] text-[10px] font-mono uppercase tracking-widest hover:underline">
                    View Detailed Log →
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
