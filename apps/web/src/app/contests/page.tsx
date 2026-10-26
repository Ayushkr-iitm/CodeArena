'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  Award,
  ChevronRight,
  Flame,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface ContestItem {
  id: string
  title: string
  slug: string
  description: string
  startTime: string
  endTime: string
  status: 'UPCOMING' | 'RUNNING' | 'ENDED'
  problemCount: number
  participantCount: number
}

export default function ContestsPage() {
  const { isAuthenticated } = useAuth()
  const [contests, setContests] = useState<ContestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'RUNNING' | 'UPCOMING' | 'ENDED'>('ALL')
  const [now, setNow] = useState(Date.now())
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [registeredIds, setRegisteredIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadContests() {
      try {
        const data = await api.getContests()
        setContests(data || [])
      } catch (err) {
        console.error('Failed to load contests:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadContests()

    // Clock ticker for live countdowns
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRegister = async (contestId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to register for contests!')
      return
    }

    setRegisteringId(contestId)
    try {
      await api.registerContest(contestId)
      setRegisteredIds((prev) => ({ ...prev, [contestId]: true }))
      // Update count locally
      setContests((prev) =>
        prev.map((c) => (c.id === contestId ? { ...c, participantCount: c.participantCount + 1 } : c))
      )
    } catch (err: any) {
      alert(err.message || 'Registration failed')
    } finally {
      setRegisteringId(null)
    }
  }

  // Format countdown string
  const formatCountdown = (targetTime: string, label: string) => {
    const target = new Date(targetTime).getTime()
    const diff = target - now

    if (diff <= 0) return 'Concluded'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) {
      return `${label} in ${days}d ${hours}h ${minutes}m`
    }
    return `${label} in ${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const filteredContests = contests.filter((c) => {
    if (filter === 'ALL') return true
    return c.status === filter
  })

  const liveCount = contests.filter((c) => c.status === 'RUNNING').length
  const upcomingCount = contests.filter((c) => c.status === 'UPCOMING').length
  const pastCount = contests.filter((c) => c.status === 'ENDED').length

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-surface-200 via-surface-100 to-[#121A2B] border border-white/[0.08] p-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-mono font-medium">
            <Trophy className="w-3.5 h-3.5" />
            <span>Competitive Programming Arena</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Rated Coding Contests
          </h1>

          <p className="text-sm text-zinc-300 leading-relaxed">
            Test your algorithmic prowess under timed pressure, solve multi-tiered challenges, climb the ICPC standings, and boost your global Elo rating.
          </p>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.06]">
          <div className="bg-[#0A0E17]/60 border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Contests
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{liveCount}</span>
          </div>

          <div className="bg-[#0A0E17]/60 border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              Upcoming
            </span>
            <span className="text-2xl font-bold font-mono text-brand-400">{upcomingCount}</span>
          </div>

          <div className="bg-[#0A0E17]/60 border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Concluded
            </span>
            <span className="text-2xl font-bold font-mono text-amber-400">{pastCount}</span>
          </div>

          <div className="bg-[#0A0E17]/60 border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              Total Events
            </span>
            <span className="text-2xl font-bold font-mono text-white">{contests.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          {(['ALL', 'RUNNING', 'UPCOMING', 'ENDED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-brand-600 text-white shadow-glow-brand'
                  : 'bg-surface-200 text-zinc-400 hover:text-white hover:bg-surface-100 border border-white/[0.06]'
              }`}
            >
              {tab === 'ALL' && `All Contests (${contests.length})`}
              {tab === 'RUNNING' && `🔴 Live Now (${liveCount})`}
              {tab === 'UPCOMING' && `⏳ Upcoming (${upcomingCount})`}
              {tab === 'ENDED' && `🏁 Completed (${pastCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Contests List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-surface-200/50 border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-surface-200/40 border border-white/[0.06] space-y-3">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-base font-semibold text-zinc-300">No Contests Found</p>
          <p className="text-xs text-zinc-500">There are no contests in this category right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContests.map((contest) => {
            const isLive = contest.status === 'RUNNING'
            const isUpcoming = contest.status === 'UPCOMING'
            const isEnded = contest.status === 'ENDED'
            const isRegistered = registeredIds[contest.id]

            return (
              <div
                key={contest.id}
                className={`flex flex-col justify-between rounded-2xl p-6 border transition-all relative overflow-hidden group ${
                  isLive
                    ? 'bg-[#0B1321] border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)]'
                    : 'bg-surface-200/70 hover:bg-surface-100/80 border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                {/* Glow accent */}
                {isLive && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="space-y-4">
                  {/* Status & Timing Pill */}
                  <div className="flex items-center justify-between gap-2">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        LIVE ARENA
                      </span>
                    ) : isUpcoming ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-mono font-bold tracking-wide">
                        <Clock className="w-3.5 h-3.5" />
                        UPCOMING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-700/30 border border-zinc-700 text-zinc-400 text-xs font-mono font-semibold">
                        CONCLUDED
                      </span>
                    )}

                    {/* Countdown */}
                    <span className="font-mono text-xs text-zinc-300">
                      {isLive && (
                        <span className="text-emerald-400 font-semibold">
                          {formatCountdown(contest.endTime, 'Ends')}
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-brand-300">
                          {formatCountdown(contest.startTime, 'Starts')}
                        </span>
                      )}
                      {isEnded && (
                        <span className="text-zinc-500">
                          {new Date(contest.endTime).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="text-lg font-bold text-white hover:text-brand-400 transition-colors block"
                    >
                      {contest.title}
                    </Link>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {contest.description}
                    </p>
                  </div>

                  {/* Meta Stats Row */}
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{contest.problemCount} Problems</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{contest.participantCount} Registered</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-6 pt-4 flex items-center justify-between border-t border-white/[0.06]">
                  {isLive ? (
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs shadow-glow-emerald transition-all"
                    >
                      <span>Enter Live Arena</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : isUpcoming ? (
                    <div className="w-full flex items-center gap-3">
                      <button
                        onClick={() => handleRegister(contest.id)}
                        disabled={isRegistered || registeringId === contest.id}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isRegistered
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                            : 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand cursor-pointer'
                        }`}
                      >
                        {isRegistered ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Registered</span>
                          </>
                        ) : registeringId === contest.id ? (
                          <span>Registering...</span>
                        ) : (
                          <span>Register for Contest</span>
                        )}
                      </button>

                      <Link
                        href={`/contests/${contest.slug}`}
                        className="px-4 py-2.5 rounded-xl bg-surface-300 hover:bg-surface-100 text-zinc-300 text-xs font-semibold border border-white/[0.06] transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-300 hover:bg-surface-100 text-zinc-200 font-semibold text-xs border border-white/[0.06] transition-colors"
                    >
                      <span>View Standings & Archive</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
