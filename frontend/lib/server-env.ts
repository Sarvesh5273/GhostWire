import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

let cachedBackendEnv: Record<string, string> | null = null

const loadBackendEnv = () => {
  if (cachedBackendEnv !== null) {
    return cachedBackendEnv
  }

  const backendEnvPath = path.resolve(process.cwd(), '../backend/.env')
  if (!fs.existsSync(backendEnvPath)) {
    cachedBackendEnv = {}
    return cachedBackendEnv
  }

  const parsed: Record<string, string> = {}
  const content = fs.readFileSync(backendEnvPath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const splitIndex = line.indexOf('=')
    if (splitIndex === -1) {
      continue
    }

    const key = line.slice(0, splitIndex).trim()
    const value = line.slice(splitIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    parsed[key] = value
  }

  cachedBackendEnv = parsed
  return cachedBackendEnv
}

export const getServerEnv = (key: string) => {
  const direct = process.env[key]
  if (direct) {
    return direct
  }

  if (process.env.NODE_ENV === 'production') {
    return undefined
  }

  return loadBackendEnv()[key]
}
