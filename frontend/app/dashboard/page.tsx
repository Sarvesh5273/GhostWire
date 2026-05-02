'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getIncidents, getStats } from '@/lib/api'

interface Incident {
  id: string
  created_at: string
  risk_level: string
  decision: string
  categories: string[]
  compliance_tags: string[]
  blocked: boolean
}

interface Stats {
  total: number
  blocked: number
  allowed: number
  by_severity: Record<string, number>
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

const SEVERITY_CONFIG = [
  { key: 'CRITICAL', label: 'Critical', dotClass: 'bg-[#ffb4ab]', stroke: '#ffb4ab' },
  { key: 'HIGH', label: 'High', dotClass: 'bg-orange-400', stroke: '#f97316' },
  { key: 'MEDIUM', label: 'Medium', dotClass: 'bg-[#ffb783]', stroke: '#ffb783' },
  { key: 'LOW', label: 'Low', dotClass: 'bg-[#c0c1ff]', stroke: '#c0c1ff' },
  { key: 'SAFE', label: 'Safe', dotClass: 'bg-[#34343d]', stroke: '#52525b' },
]

const getPercent = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0)

const buildChartPaths = (values: number[]) => {
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? 100 / (values.length - 1) : 100
  const baseline = 95
  const top = 22
  const points = values.map((value, index) => {
    const x = index * step
    const y = baseline - (value / max) * (baseline - top)
    return { x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
  const areaPath = `${linePath} L 100 100 L 0 100 Z`

  return { linePath, areaPath }
}

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [incData, statsData] = await Promise.all([getIncidents(), getStats()])
        setIncidents(incData.incidents || [])
        setStats(statsData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalCount = stats?.total ?? incidents.length
  const blockedCount = stats?.blocked ?? incidents.filter((incident) => incident.blocked).length
  const safeCount = stats?.allowed ?? Math.max(totalCount - blockedCount, 0)
  const mediumCount = stats?.by_severity?.['MEDIUM'] ?? incidents.filter((incident) => incident.risk_level === 'MEDIUM').length
  const blockedRate = getPercent(blockedCount, totalCount)
  const mediumRate = getPercent(mediumCount, totalCount)
  const safeRate = getPercent(safeCount, totalCount)

  const severityCounts = useMemo(() => {
    if (stats?.by_severity) {
      return stats.by_severity
    }

    return incidents.reduce<Record<string, number>>((acc, incident) => {
      acc[incident.risk_level] = (acc[incident.risk_level] || 0) + 1
      return acc
    }, {})
  }, [incidents, stats])

  const severityLegend = useMemo(() => (
    SEVERITY_CONFIG.map((severity) => {
      const count = severityCounts[severity.key] || 0
      const pctRaw = totalCount > 0 ? (count / totalCount) * 100 : 0

      return {
        ...severity,
        count,
        pctRaw,
        pctLabel: `${Math.round(pctRaw)}%`,
      }
    })
  ), [severityCounts, totalCount])

  const donutSegments = useMemo(() => {
    const visibleSegments = severityLegend.filter((segment) => segment.count > 0)

    return visibleSegments.map((segment, index) => {
      const offset = visibleSegments
        .slice(0, index)
        .reduce((sum, current) => sum + current.pctRaw, 0)

      return {
        ...segment,
        offset,
      }
    })
  }, [severityLegend])

  const activityData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        allowed: 0,
        blocked: 0,
      }
    })

    const bucketIndexByDate = new Map(buckets.map((bucket, index) => [bucket.key, index]))
    incidents.forEach((incident) => {
      const created = new Date(incident.created_at)
      if (Number.isNaN(created.getTime())) {
        return
      }

      created.setHours(0, 0, 0, 0)
      const bucketIndex = bucketIndexByDate.get(created.toISOString().slice(0, 10))
      if (bucketIndex === undefined) {
        return
      }

      if (incident.blocked) {
        buckets[bucketIndex].blocked += 1
      } else {
        buckets[bucketIndex].allowed += 1
      }
    })

    return buckets
  }, [incidents])

  const allowedPaths = useMemo(() => buildChartPaths(activityData.map((item) => item.allowed)), [activityData])
  const blockedPaths = useMemo(() => buildChartPaths(activityData.map((item) => item.blocked)), [activityData])

  return (
    <div className="bg-[#13131b] text-[#e4e1ed] min-h-screen overflow-x-hidden">
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
              <Link href="/dashboard" className="text-indigo-400 border-b-2 border-indigo-500 pb-1">Dashboard</Link>
              
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
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-6 space-y-10">

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
            <div>
              <h1 className="text-[40px] font-semibold leading-tight tracking-tight text-[#e4e1ed]">Security Overview</h1>
              <p className="text-[#908fa0] text-[15px] mt-1">Real-time prompt injection monitoring & node health.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-[#292932] border border-[#464554] px-4 py-2 rounded-lg text-[#b9c8de] hover:bg-[#34343d] transition-colors flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-sm">download</span>
                Export Report
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#121212] border border-[#1F1F1F] p-6 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <span className="material-symbols-outlined text-indigo-400">radar</span>
                </div>
                <span className="text-[#c0c1ff] font-mono text-xs flex items-center gap-1">
                  Live
                </span>
              </div>
              <div className="mt-4">
                <div className="text-[#908fa0] text-[10px] uppercase tracking-wider font-semibold">Total Scans</div>
                <div className="text-white text-3xl font-semibold mt-1">
                  {loading ? '...' : totalCount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#1F1F1F] p-6 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#ffb4ab]/10 rounded-lg">
                  <span className="material-symbols-outlined text-[#ffb4ab]">block</span>
                </div>
                <span className="text-[#ffb4ab] font-mono text-xs flex items-center gap-1">
                  {loading ? '...' : `${blockedRate}%`}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-[#908fa0] text-[10px] uppercase tracking-wider font-semibold">Blocked Threats</div>
                <div className="text-white text-3xl font-semibold mt-1">
                  {loading ? '...' : blockedCount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#1F1F1F] p-6 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#d97721]/20 rounded-lg">
                  <span className="material-symbols-outlined text-[#ffb783]">warning</span>
                </div>
                <span className="text-[#ffb783] font-mono text-xs flex items-center gap-1">
                  {loading ? '...' : `${mediumRate}%`}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-[#908fa0] text-[10px] uppercase tracking-wider font-semibold">Active Warnings</div>
                <div className="text-white text-3xl font-semibold mt-1">
                  {loading ? '...' : mediumCount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#1F1F1F] p-6 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#39485a]/30 rounded-lg">
                  <span className="material-symbols-outlined text-[#b9c8de]">verified_user</span>
                </div>
                <span className="text-[#b9c8de] font-mono text-xs">{loading ? '...' : `${safeRate}% safe`}</span>
              </div>
              <div className="mt-4">
                <div className="text-[#908fa0] text-[10px] uppercase tracking-wider font-semibold">Safe Prompts</div>
                <div className="text-white text-3xl font-semibold mt-1">
                  {loading ? '...' : `${safeRate}%`}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
            {/* Area Chart */}
            <div className="xl:col-span-6 bg-[#121212] border border-[#1F1F1F] rounded-xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-medium text-white">Scan Activity</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#c0c1ff]" />
                    <span className="text-[#908fa0] text-[10px] font-semibold uppercase">Allowed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ffb4ab]" />
                    <span className="text-[#908fa0] text-[10px] font-semibold uppercase">Blocked</span>
                  </div>
                </div>
              </div>
              <div className="flex-grow min-h-[300px] border-l border-b border-zinc-800 relative">
                {loading ? (
                  <div className="absolute inset-0 p-6 flex items-center justify-center text-zinc-500 font-mono text-sm">
                    Loading activity...
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 p-6 overflow-hidden">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d={allowedPaths.areaPath} fill="rgba(192, 193, 255, 0.1)" />
                        <path d={allowedPaths.linePath} fill="none" stroke="#c0c1ff" strokeWidth="0.8" />
                        <path d={blockedPaths.areaPath} fill="rgba(255, 180, 171, 0.12)" />
                        <path d={blockedPaths.linePath} fill="none" stroke="#ffb4ab" strokeWidth="0.8" />
                      </svg>
                    </div>
                    <div className="absolute bottom-[-24px] left-0 w-full flex justify-between px-6 font-mono text-[#908fa0] text-[10px]">
                      {activityData.map((bucket) => (
                        <span key={bucket.key}>{bucket.label}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="xl:col-span-4 bg-[#121212] border border-[#1F1F1F] rounded-xl p-6 flex flex-col">
              <h3 className="text-2xl font-medium text-white mb-10">Severity Distribution</h3>
              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 mb-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#34343d" strokeWidth="4" />
                    {!loading && donutSegments.map((segment) => (
                      <circle
                        key={segment.key}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={segment.stroke}
                        strokeDasharray={`${segment.pctRaw} ${100 - segment.pctRaw}`}
                        strokeDashoffset={-segment.offset}
                        strokeWidth="4"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white text-2xl font-semibold">{loading ? '...' : totalCount}</span>
                    <span className="text-[#908fa0] text-[10px] font-semibold uppercase">Alerts</span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-4">
                  {severityLegend.map(({ key, label, dotClass, count, pctLabel }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                      <div className="flex flex-col">
                        <span className="text-white text-xs font-semibold">{label} ({loading ? '...' : count})</span>
                        <span className="text-[#908fa0] text-[10px]">{loading ? '...' : pctLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Incidents Table */}
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
              <h3 className="text-2xl font-medium text-white">Recent Incidents</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-zinc-900 rounded border border-zinc-800 text-[#908fa0]">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
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
                <tbody className="text-[#e4e1ed] divide-y divide-zinc-900">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
                  ) : incidents.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No incidents yet.</td></tr>
                  ) : incidents.slice(0, 10).map((inc) => (
                    <tr key={inc.id} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs text-[#b9c8de]">
                        {new Date(inc.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`flex items-center gap-1.5 ${getRiskColor(inc.risk_level)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${inc.risk_level === 'CRITICAL' ? 'bg-[#ffb4ab] animate-pulse' : 'bg-current'}`} />
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
                          {(inc.compliance_tags || []).slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/incidents/${inc.id}`} className="text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-zinc-900 flex justify-between items-center text-[#908fa0] text-[11px]">
              <span>Showing {Math.min(incidents.length, 10)} of {incidents.length} incidents</span>
              <Link href="/incidents" className="text-indigo-400 hover:underline text-xs">View All →</Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-zinc-900 mt-16">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold uppercase tracking-tighter text-sm">GhostWire</span>
            <span className="text-zinc-600 text-xs">© 2026 GhostWire Security</span>
          </div>
          <div className="flex gap-6 text-xs text-zinc-500">
            <span>System Status</span>
            <span>Privacy Protocol</span>
            <span>API Docs</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
