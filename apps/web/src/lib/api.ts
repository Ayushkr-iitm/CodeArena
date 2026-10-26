const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface RequestOptions extends RequestInit {
  data?: any
}

// Token storage helpers
export const tokenStorage = {
  getAccessToken: () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
  getRefreshToken: () => (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null),
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    }
  },
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  },
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, ...customConfig } = options

  const token = tokenStorage.getAccessToken()

  const config: RequestInit = {
    method: data ? (customConfig.method || 'POST') : (customConfig.method || 'GET'),
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
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  const json = await response.json()
  // If the backend wraps responses in { success: true, data: ... }
  return (json && typeof json === 'object' && 'data' in json && json.success !== undefined)
    ? json.data
    : json
}

// Typed API operations
export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiFetch<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      data: credentials,
    }),

  register: (payload: { email: string; username: string; displayName?: string; password: string }) =>
    apiFetch<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      data: payload,
    }),

  getMe: () => apiFetch<any>('/auth/me', { method: 'GET' }),

  refreshToken: (refreshToken: string) =>
    apiFetch<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      data: { refreshToken },
    }),

  // Problems
  getProblems: (params?: { page?: number; pageSize?: number; difficulty?: string; tag?: string; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    if (params?.difficulty) searchParams.set('difficulty', params.difficulty)
    if (params?.tag) searchParams.set('tag', params.tag)
    if (params?.search) searchParams.set('search', params.search)
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiFetch<any>(`/problems${queryString}`)
  },

  getProblem: (slug: string) => apiFetch<any>(`/problems/${slug}`),

  getAllTags: () => apiFetch<any[]>('/problems/tags/all'),

  getAdminProblems: () => apiFetch<any[]>('/problems/admin/all'),

  createProblem: (data: any) =>
    apiFetch<any>('/problems', {
      method: 'POST',
      data,
    }),

  updateProblem: (id: string, data: any) =>
    apiFetch<any>(`/problems/${id}`, {
      method: 'PUT',
      data,
    }),

  deleteProblem: (id: string) =>
    apiFetch<any>(`/problems/${id}`, {
      method: 'DELETE',
    }),

  togglePublish: (id: string) =>
    apiFetch<any>(`/problems/${id}/toggle-publish`, {
      method: 'PATCH',
    }),

  // Submissions
  runCode: (data: {
    language: string
    code: string
    stdin?: string
    problemId?: string
    expectedOutput?: string
  }) =>
    apiFetch<any>('/submissions/run', {
      method: 'POST',
      data,
    }),

  submitCode: (problemId: string, code: string, language: string) =>
    apiFetch<any>('/submissions', {
      method: 'POST',
      data: { problemId, code, language },
    }),

  getSubmissions: (problemId?: string) => {
    const query = problemId ? `?problemId=${problemId}` : ''
    return apiFetch<any>(`/submissions${query}`)
  },

  getProblemSubmissions: (slug: string) =>
    apiFetch<any>(`/submissions/problem/${slug}`),

  getSubmissionStatus: (id: string) =>
    apiFetch<any>(`/submissions/${id}/status`),

  getQueueMetrics: () =>
    apiFetch<any>('/submissions/queue/metrics'),

  // Users & Leaderboard
  getProfile: (username: string) => apiFetch<any>(`/users/profile/${username}`),
  getLeaderboard: (page = 1, pageSize = 50) => apiFetch<any>(`/users/leaderboard?page=${page}&pageSize=${pageSize}`),
}
