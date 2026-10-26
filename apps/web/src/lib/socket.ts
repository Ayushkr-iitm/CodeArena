'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
  'http://localhost:4000'

/**
 * Get or initialize the singleton Socket.IO connection
 */
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    // Return dummy or null-safe object for SSR
    return {} as Socket
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to CodeArena real-time hub:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message)
    })
  }

  return socket
}

/**
 * Hook/helper to listen to online users count
 */
export function onOnlineUsersCount(callback: (count: number) => void): () => void {
  const s = getSocket()
  if (!s.on) return () => {}

  const handler = (data: { count: number }) => {
    if (typeof data?.count === 'number') {
      callback(data.count)
    }
  }

  s.on('online:count', handler)
  return () => {
    s.off('online:count', handler)
  }
}

/**
 * Subscribe to real-time status updates for a specific submission
 */
export function subscribeToSubmission(
  submissionId: string,
  callback: (data: any) => void
): () => void {
  const s = getSocket()
  if (!s.emit || !s.on) return () => {}

  s.emit('subscribe:submission', submissionId)

  const handler = (data: any) => {
    if (data.submissionId === submissionId) {
      callback(data)
    }
  }

  s.on('submission:status', handler)

  return () => {
    s.emit('unsubscribe:submission', submissionId)
    s.off('submission:status', handler)
  }
}

/**
 * Subscribe to real-time updates for a contest leaderboard
 */
export function subscribeToContest(
  contestSlug: string,
  callback: (data: any) => void
): () => void {
  const s = getSocket()
  if (!s.emit || !s.on) return () => {}

  s.emit('subscribe:contest', contestSlug)

  const handler = (data: any) => {
    callback(data)
  }

  s.on('contest:leaderboard_update', handler)

  return () => {
    s.emit('unsubscribe:contest', contestSlug)
    s.off('contest:leaderboard_update', handler)
  }
}

/**
 * Listen to platform-wide activity feed events
 */
export function onActivityFeed(callback: (activity: any) => void): () => void {
  const s = getSocket()
  if (!s.on) return () => {}

  const handler = (activity: any) => {
    callback(activity)
  }

  s.on('activity:feed', handler)
  return () => {
    s.off('activity:feed', handler)
  }
}
