import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getServerEnv } from '@/lib/server-env'

let supabaseClient: SupabaseClient | null = null

export const getSupabaseAdmin = () => {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = getServerEnv('SUPABASE_URL')
  const supabaseKey = getServerEnv('SUPABASE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase server credentials are not configured.')
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseClient
}
