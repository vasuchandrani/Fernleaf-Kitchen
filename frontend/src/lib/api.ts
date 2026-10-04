import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL

function getApiUrl() {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured')
  }
  return API_URL
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || `API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/**
 * Server-side API client. 
 * Automatically attaches the HTTP-only JWT token to all requests.
 */
export const api = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const headers = (await getAuthHeader()) as Record<string, string>;
    const res = await fetch(`${getApiUrl()}${endpoint}`, {
      headers,
      cache: 'no-store',
    })
    return handleResponse(res)
  },
  
  post: async <T = any>(endpoint: string, body: any): Promise<T> => {
    const headers = { 
      'Content-Type': 'application/json',
      ...(await getAuthHeader()) 
    } as Record<string, string>;

    const res = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },

  patch: async <T = any>(endpoint: string, body: any): Promise<T> => {
    const headers = { 
      'Content-Type': 'application/json',
      ...(await getAuthHeader()) 
    } as Record<string, string>;

    const res = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },
  
  delete: async <T = any>(endpoint: string): Promise<T> => {
    const headers = (await getAuthHeader()) as Record<string, string>;
    const res = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'DELETE',
      headers,
    })
    return handleResponse(res)
  }
}
