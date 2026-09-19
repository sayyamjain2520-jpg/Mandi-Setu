import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_TARGETS = new Set(['hi', 'mr', 'gu', 'te', 'ta'])
const MAX_STRINGS = 100
const MAX_TOTAL_CHARS = 25_000

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')
    if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY is not configured.')

    const body = await req.json()
    const source = typeof body?.source === 'string' ? body.source : 'en'
    const target = typeof body?.target === 'string' ? body.target : ''
    const texts = Array.isArray(body?.texts) ? body.texts : []

    if (!ALLOWED_TARGETS.has(target)) {
      return new Response(JSON.stringify({ error: 'Unsupported target language.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!texts.length || texts.length > MAX_STRINGS) {
      return new Response(JSON.stringify({ error: `Send 1-${MAX_STRINGS} texts per request.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cleanTexts = texts.map((value: unknown) => String(value ?? '')).filter(Boolean)
    const totalChars = cleanTexts.reduce((sum: number, value: string) => sum + value.length, 0)

    if (totalChars > MAX_TOTAL_CHARS) {
      return new Response(JSON.stringify({ error: `Request is too large. Keep it under ${MAX_TOTAL_CHARS} characters.` }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const googleUrl = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`
    const googleResponse = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: cleanTexts,
        source,
        target,
        format: 'text',
        model: 'nmt',
      }),
    })

    const googleJson = await googleResponse.json()

    if (!googleResponse.ok) {
      console.error('Google Translation API error:', googleJson)
      return new Response(JSON.stringify({
        error: googleJson?.error?.message || 'Google Translation API request failed.',
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const translations = googleJson?.data?.translations?.map((item: { translatedText?: string }) => item.translatedText ?? '') ?? []

    return new Response(JSON.stringify({ translations }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('translate function error:', error)

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unexpected translation error.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
