import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server-supabase'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('incidents')
      .select('risk_level, blocked')

    if (error) {
      throw error
    }

    const incidents = data ?? []
    const total = incidents.length
    const blocked = incidents.filter((incident) => incident.blocked).length
    const by_severity = incidents.reduce<Record<string, number>>((acc, incident) => {
      const severity = incident.risk_level || 'UNKNOWN'
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      total,
      blocked,
      allowed: total - blocked,
      by_severity,
    })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to load stats.' },
      { status: 500 },
    )
  }
}
