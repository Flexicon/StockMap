import type { H3Event } from 'h3'

interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  meta: Record<string, unknown>
  error?: string
}

interface D1RunResult {
  success: boolean
  meta: Record<string, unknown>
  error?: string
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run(): Promise<D1RunResult>
}

export interface D1DatabaseBinding {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
}

interface CloudflareContext {
  env?: {
    DB?: D1DatabaseBinding
    GOOGLE_MAPS_SERVER_KEY?: string
  }
}

export function getCloudflareContext(event: H3Event): CloudflareContext {
  return (event.context.cloudflare ?? {}) as CloudflareContext
}

export function getDb(event: H3Event): D1DatabaseBinding {
  const db = getCloudflareContext(event).env?.DB

  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 database binding DB is not configured',
    })
  }

  return db
}

export function getGoogleMapsServerKey(event: H3Event): string {
  const runtimeConfig = useRuntimeConfig(event)
  const key = [
    getCloudflareContext(event).env?.GOOGLE_MAPS_SERVER_KEY,
    runtimeConfig.googleMapsServerKey,
  ].find(isPresentString)

  if (key) return key

  throw createError({
    statusCode: 500,
    statusMessage: 'Google Maps server key is not configured',
  })
}

function isPresentString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
