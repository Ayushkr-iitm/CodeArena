const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface RequestOptions extends RequestInit {
  data?: any
}

async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, ...customConfig } = options

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...customConfig,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'API request failed')
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// API Functions
export const api = {
  login: (data: any) => apiFetch('/auth/login', { data }),
  register: (data: any) => apiFetch('/auth/register', { data }),
  
  getProblems: () => apiFetch('/problems'),
  getProblem: (slug: string) => apiFetch(`/problems/${slug}`),
  
  submitCode: (problemId: string, code: string, language: string) => 
    apiFetch(`/submissions`, { data: { problemId, code, language } }),
  
  getSubmissions: (problemId?: string) => {
    const query = problemId ? `?problemId=${problemId}` : ''
    return apiFetch(`/submissions${query}`)
  },
  
  getProfile: () => apiFetch('/users/me'),
  getLeaderboard: () => apiFetch('/users/leaderboard'),
}
