import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server-supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ detail: 'Incident not found.' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to load incident.' },
      { status: 500 },
    )
  }
}
