'use client'

import { useState, useEffect } from 'react'
import { onOnlineUsersCount } from '@/lib/socket'
import { Users } from 'lucide-react'

export default function OnlineUsersBadge() {
  const [onlineCount, setOnlineCount] = useState<number>(1)

  useEffect(() => {
    const unsubscribe = onOnlineUsersCount((count) => {
      setOnlineCount(count)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div
      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono transition-all hover:bg-emerald-500/15"
      title={`${onlineCount} active coder${onlineCount === 1 ? '' : 's'} connected via WebSocket`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="font-semibold">{onlineCount}</span>
      <span className="text-[10px] text-zinc-400">online</span>
    </div>
  )
}
