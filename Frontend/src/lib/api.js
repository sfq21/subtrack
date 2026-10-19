import { supabase } from './supabase'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function api(path, options = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error

  const headers = new Headers(options.headers)
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`)

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch (parseError) {
      if (!(parseError instanceof SyntaxError)) throw parseError
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  return response.status === 204 ? null : response.json()
}
