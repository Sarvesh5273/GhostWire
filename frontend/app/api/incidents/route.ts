import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server-supabase'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('incidents')
      .select('id, created_at, risk_level, confidence_score, categories, decision, compliance_tags, blocked')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({ incidents: data ?? [] })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to load incidents.' },
      { status: 500 },
    )
  }
}
