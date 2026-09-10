import { createClient, SupabaseClient } from '@supabase/supabase-js'

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && 'env' in import.meta) {
    const metaEnv = (import.meta as { env?: Record<string, string> }).env
    if (metaEnv && metaEnv[key]) return metaEnv[key]
  }
  const globalObj = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {}
  const proc = globalObj.process as { env?: Record<string, string> } | undefined
  if (proc?.env?.[key]) return proc.env[key]
  return ''
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes('your-anon-key')
  )
}

let clientInstance: SupabaseClient | null = null

if (isSupabaseConfigured()) {
  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

export const supabase = clientInstance
