'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getIncidents } from '@/lib/api'

interface Incident {
  id: string
  created_at: string
  risk_level: string
  decision: string
  categories: string[]
  compliance_tags: string[]
  blocked: boolean
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'text-[#ffb4ab]'
    case 'HIGH': return 'text-orange-400'
    case 'MEDIUM': return 'text-[#ffb783]'
    case 'LOW': return 'text-[#c0c1ff]'
    default: return 'text-green-400'
  }
}

const getDecisionStyle = (decision: string) => {
  switch (decision) {
    case 'BLOCK': return 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20'
    case 'WARN': return 'bg-[#ffb783]/10 text-[#ffb783] border border-[#ffb783]/20'
    default: return 'bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20'
  }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')

  useEffect(() => {
    async function load() {
      try {
        const data = await getIncidents()
        setIncidents(data.incidents || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = incidents
    if (search) {
      result = result.filter(i =>
        i.id.toLowerCase().includes(search.toLowerCase()) ||
        i.categories.some(c => c.toLowerCase().includes(search.toLowerCase()))
      )
    }
    if (severityFilter !== 'ALL') {
      result = result.filter(i => i.risk_level === severityFilter)
    }
    return result
  }, [search, severityFilter, incidents])

  const totalCount = incidents.length
  const criticalCount = incidents.filter(i => i.risk_level === 'CRITICAL').length
  const blockedCount = incidents.filter(i => i.blocked).length
  const safeCount = totalCount - blockedCount
  const criticalPct = totalCount > 0 ? Math.round((criticalCount / totalCount) * 100) : 0
  const blockedPct = totalCount > 0 ? Math.round((blockedCount / totalCount) * 100) : 0
  const safePct = totalCount > 0 ? Math.round((safeCount / totalCount) * 100) : 0

  return (
    <div className="bg-[#13131b] text-[#e4e1ed] min-h-screen">
      {/* TopAppBar */}
      <header className="bg-zinc-950/80 backdrop-blur-md text-sm tracking-wide font-medium top-0 z-50 border-b border-zinc-800/50 w-full px-6 h-16 fixed">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter text-white uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">security</span>
              GhostWire
            </span>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Scanner</Link>
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/incidents" className="text-indigo-400 border-b-2 border-indigo-500 pb-1">Incidents</Link>
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

      <main className="pt-16 max-w-[1440px] mx-auto p-8 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <div>
            <h1 className="text-[40px] font-semibold leading-tight tracking-tight text-[#e4e1ed]">Security Incidents</h1>
            <p className="text-[#c7c4d7] text-[15px] mt-1 max-w-2xl">
              Review and manage prioritized security alerts. Use filters to narrow down specific threat vectors.
            </p>
          </div>
          <button className="flex items-center gap-1 px-6 py-3 bg-[#1f1f27] border border-[#464554] rounded-lg text-xs font-semibold text-[#e4e1ed] hover:bg-[#393841] transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>

        {/* Filter Bar */}
        <div className="border border-[#1F1F1F] bg-[#1b1b23] rounded-xl p-6 flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[300px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c7c4d7]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0d0d15] border border-[#464554] rounded-lg pl-16 pr-6 py-3 text-[15px] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] outline-none transition-all text-[#e4e1ed] placeholder:text-zinc-600"
              placeholder="Search by Incident ID or category..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-3">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
              <button
                key={level}
                onClick={() => setSeverityFilter(level)}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                  severityFilter === level
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'bg-[#34343d] border-[#464554] text-[#e4e1ed] hover:bg-[#393841]'
                }`}
              >
                {level}
              </button>
            ))}
            <button
              onClick={() => { setSearch(''); setSeverityFilter('ALL') }}
              className="px-3 py-2 text-[#c0c1ff] hover:bg-[#c0c1ff]/10 rounded-lg transition-colors text-xs font-semibold"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Incidents List */}
        {loading ? (
          <div className="border border-[#1F1F1F] bg-[#1b1b23] rounded-xl flex items-center justify-center py-24">
            <p className="text-zinc-500 font-mono text-sm">Loading incidents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-[#1F1F1F] bg-[#1b1b23] rounded-xl flex flex-col items-center justify-center py-24 px-8 min-h-[500px] text-center">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-[#c0c1ff]/10 blur-[60px] rounded-full" />
              <div className="relative w-32 h-32 flex items-center justify-center bg-[#1f1f27] border border-[#464554] rounded-full">
                <span className="material-symbols-outlined text-[64px] text-[#908fa0]">database_off</span>
              </div>
            </div>
            <h2 className="text-[30px] font-semibold text-[#e4e1ed] mb-3">No incidents match your filters</h2>
            <p className="text-[#c7c4d7] text-[15px] max-w-md mb-16 leading-relaxed">
              Adjust your search or filter criteria. Try removing some parameters to see a broader range.
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => { setSearch(''); setSeverityFilter('ALL') }}
                className="bg-indigo-500 text-white px-16 py-3 rounded-lg text-xs font-semibold hover:bg-indigo-400 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-[#1F1F1F] bg-[#1b1b23] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#908fa0] text-[10px] uppercase tracking-wider border-b border-zinc-900">
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Risk Level</th>
                  <th className="px-6 py-4 font-semibold">Decision</th>
                  <th className="px-6 py-4 font-semibold">Categories</th>
                  <th className="px-6 py-4 font-semibold">Compliance Flags</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-zinc-900/40 transition-colors group">
                    <td className="px-6 py-5 font-mono text-xs text-[#b9c8de]">
                      {new Date(inc.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`flex items-center gap-1.5 ${getRiskColor(inc.risk_level)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-current ${inc.risk_level === 'CRITICAL' ? 'animate-pulse' : ''}`} />
                        {inc.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${getDecisionStyle(inc.decision)}`}>
                        {inc.decision}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[#908fa0] text-sm">
                      {(inc.categories || []).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 flex-wrap">
                        {(inc.compliance_tags || []).slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/incidents/${inc.id}`}
                        className="text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-zinc-900 flex justify-between items-center text-[#908fa0] text-[11px]">
              <span>Showing {filtered.length} of {incidents.length} incidents</span>
              <span className="text-indigo-400 text-xs">{blockedCount} blocked · {criticalCount} critical</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Critical Alerts', value: criticalCount, color: 'bg-[#ffb4ab]', percent: criticalPct, detail: `${criticalPct}% of total`, detailColor: 'text-[#ffb4ab]' },
            { label: 'Total Blocked', value: blockedCount, color: 'bg-[#c0c1ff]', percent: blockedPct, detail: `${blockedPct}% blocked`, detailColor: 'text-[#c0c1ff]' },
            { label: 'Total Incidents', value: totalCount, color: 'bg-[#ffb783]', percent: totalCount > 0 ? 100 : 0, detail: `${filtered.length} filtered`, detailColor: 'text-[#908fa0]' },
            { label: 'Safe Prompts', value: safeCount, color: 'bg-[#464554]', percent: safePct, detail: `${safePct}% safe`, detailColor: 'text-[#c0c1ff]' },
          ].map(({ label, value, color, percent, detail, detailColor }) => (
            <div key={label} className="border border-[#1F1F1F] bg-[#1b1b23] p-6 rounded-xl flex flex-col gap-1">
              <span className="text-[#c7c4d7] text-[10px] font-semibold uppercase tracking-wider">{label}</span>
              <div className="flex items-end justify-between">
                <span className="text-[30px] font-semibold text-[#e4e1ed]">{loading ? '...' : value}</span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${detailColor}`}>{loading ? '...' : detail}</span>
              </div>
              <div className="w-full bg-neutral-900 h-1 mt-3 rounded-full overflow-hidden">
                <div
                  className={`${color} h-full`}
                  style={{ width: `${percent > 0 ? Math.max(percent, 4) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* AI Assistant FAB */}
      <div className="fixed bottom-2 right-2 flex flex-col gap-3 items-end z-40">
        <div className="bg-[#13131b]/80 backdrop-blur-xl border border-[#1F1F1F] rounded-xl p-6 max-w-xs flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#c0c1ff] animate-pulse" />
            <span className="text-xs font-semibold text-[#e4e1ed]">AI Threat Assistant</span>
          </div>
          <p className="text-xs text-[#c7c4d7] leading-relaxed">
            {incidents.length} incidents loaded. {criticalCount} critical threats detected.
          </p>
          <Link href="/" className="bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 text-[#c0c1ff] px-6 py-1 rounded-lg text-xs font-semibold hover:bg-[#c0c1ff]/20 transition-colors text-center">
            Scan New Prompt →
          </Link>
        </div>
        <button className="w-14 h-14 bg-indigo-500 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
        </button>
      </div>
    </div>
  )
}
