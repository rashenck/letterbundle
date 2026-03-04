/**
 * API client for LetterBundle backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error: ApiError = {
        message: `API Error: ${response.status}`,
        status: response.status,
      }
      try {
        error.details = await response.json()
      } catch {
        error.details = await response.text()
      }
      throw error
    }

    return response.json() as Promise<T>
  }

  // Auth endpoints
  register(data: {
    email: string
    username: string
    password: string
    first_name: string
    last_name: string
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  login(data: {
    email: string
    password: string
  }) {
    return this.request<{ access_token: string; token_type: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  async me(token: string) {
    return this.request<{
      id: string
      email: string
      username: string
      first_name: string
      last_name: string
      created_at: string
      updated_at: string
    }>('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  logout(token: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // User endpoints
  getProfile(username: string) {
    return this.request(`/users/${username}`)
  }

  updateProfile(token: string, data: any) {
    return this.request<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Bundle endpoints
  listBundles(token: string) {
    return this.request('/bundles', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  createBundle(token: string, data: any) {
    return this.request('/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  getBundle(id: string) {
    return this.request(`/bundles/${id}`)
  }

  updateBundle(token: string, id: string, data: any) {
    return this.request(`/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  deleteBundle(token: string, id: string) {
    return this.request(`/bundles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  getBundleBySlug(slug: string) {
    return this.request(`/bundles/by-slug/${slug}`)
  }
}

export const apiClient = new ApiClient()
