const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '')

const requestJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = typeof data === 'object' && data && 'detail' in data
      ? String((data as { detail: unknown }).detail)
      : `Request failed: ${res.status}`
    throw new Error(detail)
  }

  return data
}

const requestWithLocalFallback = async (path: string) => {
  if (!API_BASE) {
    return requestJson(path)
  }

  try {
    return await requestJson(`${API_BASE}${path}`)
  } catch {
    return requestJson(path)
  }
}

export async function scanPrompt(prompt: string) {
  const baseUrl = API_BASE || ''
  return requestJson(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
}

export async function getIncidents() {
  return requestWithLocalFallback('/api/incidents')
}

export async function getIncident(id: string) {
  return requestWithLocalFallback(`/api/incidents/${id}`)
}

export async function getStats() {
  return requestWithLocalFallback('/api/stats')
}
