// Utility to return standardized API base URL
export function getApiBase(): string {
  const env = (import.meta.env.VITE_API_URL as string) || ''
  const base = env ? env : 'http://localhost:5000'
  const cleaned = base.replace(/\/$/, '')
  // If user provided '/api' already, return as-is; otherwise append '/api'
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
}

export default getApiBase
