'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getIncident } from '@/lib/api'

interface Incident {
  id: string
  created_at: string
  prompt: string
  risk_level: string
  confidence_score: number
  categories: string[]
  decision: string
  explanation: string
  compliance_tags: string[]
  blocked: boolean
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'text-[#ffb4ab]'
    case 'HIGH': return 'text-orange-400'
    case 'MEDIUM': return 'text-[#ffb783]'
    default: return 'text-[#c0c1ff]'
  }
}

const circumference = 2 * Math.PI * 58

export default function IncidentDetailPage() {
  const { id } = useParams()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getIncident(id as string)
        setIncident(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const strokeDashoffset = incident
    ? circumference - (incident.confidence_score / 100) * circumference
    : circumference

  return (
    <div className="bg-[#13131b] text-[#e4e1ed] min-h-screen antialiased">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c0c1ff]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#ffb783]/10 rounded-full blur-[120px]" />
      </div>

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="flex justify-between items-center w-full px-6 h-16 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter text-white uppercase">GhostWire</span>
            <nav className="hidden md:flex gap-6 text-sm tracking-wide font-medium">
              <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Scanner</Link>
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/incidents" className="text-indigo-400 border-b-2 border-indigo-500 pb-1">Incidents</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white font-medium text-xs hover:bg-indigo-400 transition-all">Upgrade</button>
            <div className="flex items-center gap-2">
              <button className="p-2 text-zinc-400 hover:bg-zinc-900/50 hover:text-white rounded-lg transition-all">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <button className="p-2 text-zinc-400 hover:bg-zinc-900/50 hover:text-white rounded-lg transition-all">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">S</div>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 pb-12 max-w-[1600px] mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 mb-4">
            <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-[11px] tracking-widest uppercase transition-colors">Dashboard</Link>
            <span className="material-symbols-outlined text-zinc-700 text-[16px]">chevron_right</span>
            <Link href="/incidents" className="text-zinc-500 hover:text-zinc-300 text-[11px] tracking-widest uppercase transition-colors">Incidents</Link>
            <span className="material-symbols-outlined text-zinc-700 text-[16px]">chevron_right</span>
            <span className="text-[#c0c1ff] text-[11px] tracking-widest uppercase font-semibold">
              {incident ? incident.id.slice(0, 8).toUpperCase() : '...'}
            </span>
          </nav>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[40px] font-semibold leading-tight tracking-tight text-[#e4e1ed] mb-1">
                Incident Detail
              </h1>
              <p className="text-[#908fa0] text-[15px]">
                {loading ? 'Loading...' : incident?.explanation?.slice(0, 80) + '...'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/incidents" className="px-4 py-2 border border-[#464554] hover:border-[#908fa0] text-[#908fa0] text-xs font-semibold uppercase rounded transition-all">
                ← Back to Incidents
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-zinc-500 font-mono text-sm">Loading incident data...</div>
          </div>
        ) : !incident ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-zinc-500 font-mono text-sm">Incident not found.</div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Prompt Content */}
              <section className="bg-[#1b1b23] border border-[#464554]/30 rounded-lg overflow-hidden">
                <div className="px-6 py-3 border-b border-[#464554]/20 bg-[#1f1f27] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">terminal</span>
                    <h3 className="text-base font-medium text-[#e4e1ed]">Prompt Content</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-500">RAW DATA</span>
                </div>
                <div className="p-6">
                  <div className="font-mono text-[13px] bg-[#0d0d15] p-6 rounded-lg border border-[#464554]/10 leading-relaxed overflow-x-auto whitespace-pre-wrap text-[#e4e1ed]">
                    <span className="text-[#464554]">User_Input: </span>
                    {incident.prompt}
                  </div>
                  <div className="mt-4 flex gap-4 text-[11px] font-semibold uppercase tracking-wider text-[#464554]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#ffb4ab]" /> Flagged Sensitive Token
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#c0c1ff]" /> Instruction Context
                    </span>
                  </div>
                </div>
              </section>

              {/* AI Analysis */}
              <section className="bg-[#1b1b23] border border-[#464554]/30 rounded-lg overflow-hidden">
                <div className="px-6 py-3 border-b border-[#464554]/20 bg-[#1f1f27] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">psychology</span>
                  <h3 className="text-base font-medium text-[#e4e1ed]">AI Forensic Analysis</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-[15px] text-[#c7c4d7] leading-relaxed">{incident.explanation}</p>
                  <div className="pt-4 border-t border-[#464554]/10">
                    <div className="flex items-center gap-2 text-[12px] bg-[#8083ff]/10 p-3 rounded-lg border border-[#8083ff]/20 text-[#c0c1ff]">
                      <span className="material-symbols-outlined text-[#c0c1ff]">info</span>
                      <span>Prompt intercepted by GhostWire AI Firewall before reaching foundational LLM. Decision: <strong>{incident.decision}</strong></span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Risk Summary */}
              <section className="bg-[#1b1b23] border border-[#464554]/30 rounded-lg p-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#908fa0] mb-6">Risk Summary</h3>
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" fill="transparent" r="58" stroke="#27272a" strokeWidth="6" />
                      <circle
                        cx="64" cy="64" fill="transparent" r="58"
                        stroke="#ffb4ab" strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-semibold ${getRiskColor(incident.risk_level)}`}>
                        {incident.confidence_score}%
                      </span>
                      <span className="text-[10px] font-mono text-[#908fa0] uppercase">Confidence</span>
                    </div>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 bg-[#93000a] text-[#ffdad6] ${getRiskColor(incident.risk_level)}`}>
                    {incident.risk_level} Threat
                  </span>
                </div>
              </section>

              {/* Detected Categories */}
              <section className="bg-[#1b1b23] border border-[#464554]/30 rounded-lg p-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#908fa0] mb-4">Detected Categories</h3>
                <div className="space-y-3">
                  {incident.categories.length === 0 ? (
                    <p className="text-zinc-500 text-xs font-mono">No categories detected.</p>
                  ) : incident.categories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-3 rounded bg-[#34343d]/50 border border-[#464554]/10">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">shield_lock</span>
                        <span className="font-mono text-xs text-[#e4e1ed]">{cat}</span>
                      </div>
                      <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">verified</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Compliance Impact */}
              <section className="bg-[#1b1b23] border border-[#464554]/30 rounded-lg overflow-hidden">
                <div className="p-6 pb-2">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#908fa0] mb-4">Compliance Impact</h3>
                </div>
                <div className="divide-y divide-[#464554]/10">
                  {incident.compliance_tags.length === 0 ? (
                    <div className="p-4 text-zinc-500 text-xs font-mono">No compliance flags.</div>
                  ) : incident.compliance_tags.map((tag) => (
                    <div key={tag} className="p-4 hover:bg-[#1f1f27] transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-[#e4e1ed]">{tag}</span>
                        <span className="text-[10px] font-mono text-[#ffb4ab] uppercase">
                          {incident.risk_level === 'CRITICAL' ? 'High Risk' : 'Moderate Risk'}
                        </span>
                      </div>
                      <p className="text-xs text-[#c7c4d7] leading-tight">
                        Sensitive data exposure detected under this regulatory framework.
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Metadata */}
              <section className="bg-[#1b1b23] border border-[#464554]/30 rounded-lg p-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#908fa0] mb-4">Incident Metadata</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Timestamp', value: new Date(incident.created_at).toLocaleString() },
                    { label: 'Incident ID', value: incident.id.slice(0, 13).toUpperCase() },
                    { label: 'Decision', value: incident.decision },
                    { label: 'Risk Level', value: incident.risk_level },
                    { label: 'Blocked', value: incident.blocked ? 'Yes' : 'No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between border-b border-[#464554]/5 pb-2">
                      <span className="text-xs text-zinc-500">{label}</span>
                      <span className="text-xs font-mono text-[#e4e1ed]">{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}