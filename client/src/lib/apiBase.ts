// Utility to return standardized API base URL
export function getApiBase(): string {
  const env = (import.meta.env.VITE_API_URL as string) || ''
  const base = env ? env : 'http://localhost:5000'
  const cleaned = base.replace(/\/$/, '')
  // If user provided '/api' already, return as-is; otherwise append '/api'
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
}

// Build full API URL with endpoint
export function buildApi(endpoint: string): string {
  const base = getApiBase()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${cleanEndpoint}`
}

export default getApiBase
