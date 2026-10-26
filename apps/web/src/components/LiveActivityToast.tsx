'use client'

import { useState, useEffect } from 'react'
import { onActivityFeed } from '@/lib/socket'
import { Award, CheckCircle2, X } from 'lucide-react'

interface ActivityItem {
  id: string
  username: string
  problemTitle: string
  verdict: string
  timestamp: string
}

export default function LiveActivityToast() {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    const unsubscribe = onActivityFeed((item: any) => {
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substring(7),
        username: item.username || 'A coder',
        problemTitle: item.problemTitle || 'a problem',
        verdict: item.verdict || 'ACCEPTED',
        timestamp: item.timestamp || new Date().toISOString(),
      }

      setActivities((prev) => [newActivity, ...prev.slice(0, 2)])

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActivities((prev) => prev.filter((a) => a.id !== newActivity.id))
      }, 6000)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (activities.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {activities.map((act) => (
        <div
          key={act.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0C1222]/95 border border-emerald-500/30 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold flex items-center gap-1.5">
                <span className="text-emerald-400">@{act.username}</span>
                <span className="text-zinc-400">solved</span>
              </div>
              <div className="text-zinc-300 font-medium truncate max-w-[200px]">
                {act.problemTitle}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActivities((prev) => prev.filter((a) => a.id !== act.id))}
            className="p-1 rounded-md text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
