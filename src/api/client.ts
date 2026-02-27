import axios from 'axios'

const DEFAULT_TENANT = 'demo-tenant'
const DEFAULT_USER = 'demo-user'

function getApiBaseUrl(): string | undefined {
  const v = import.meta.env.VITE_API_BASE_URL
  return v && String(v).trim() ? String(v).trim() : undefined
}

export function getTenantId(): string {
  return localStorage.getItem('tenantId') || DEFAULT_TENANT
}

export function getUserId(): string {
  return localStorage.getItem('userId') || DEFAULT_USER
}

export function ensureAuthDefaults() {
  if (!localStorage.getItem('tenantId')) localStorage.setItem('tenantId', DEFAULT_TENANT)
  if (!localStorage.getItem('userId')) localStorage.setItem('userId', DEFAULT_USER)
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
})

apiClient.interceptors.request.use((config) => {
  ensureAuthDefaults()
  const tenantId = getTenantId()
  const userId = getUserId()

  config.headers = config.headers ?? {}
  config.headers['x-tenant-id'] = tenantId
  config.headers['x-user-id'] = userId
  return config
})

apiClient.interceptors.response.use((response) => {
  const contentType = String((response.headers as any)?.['content-type'] || '')
  if (
    typeof response.data === 'string' &&
    (response.data.includes('<!doctype html') || response.data.includes('<html'))
  ) {
    const base = getApiBaseUrl()
    const hint = base
      ? `VITE_API_BASE_URL is set to "${base}" but this response looks like HTML.`
      : 'VITE_API_BASE_URL is not set, so requests are hitting the Vite dev server.'
    throw new Error(
      `API base URL misconfigured. ${hint} Set VITE_API_BASE_URL (e.g. http://localhost:8080) and restart npm run dev.`,
    )
  }
  if (contentType.includes('text/html')) {
    const base = getApiBaseUrl()
    throw new Error(
      `API base URL misconfigured (received text/html). VITE_API_BASE_URL=${base || '(not set)'}.
Set VITE_API_BASE_URL to your FastAPI server and restart npm run dev.`,
    )
  }
  return response
})
