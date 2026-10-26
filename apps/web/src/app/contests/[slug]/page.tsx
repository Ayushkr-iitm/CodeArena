'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Trophy,
  ArrowLeft,
  Clock,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Code2,
  RefreshCw,
  AlertCircle,
  FileText,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { subscribeToContest } from '@/lib/socket'

interface ContestDetail {
  id: string
  title: string
  slug: string
  description: string
  startTime: string
  endTime: string
  status: 'UPCOMING' | 'RUNNING' | 'ENDED'
  isRegistered: boolean
  problems: {
    id: string
    order: number
    points: number
    problem: {
      id: string
      title: string
      slug: string
      difficulty: string
      tags?: { tag: { name: string } }[]
    }
  }[]
  participantCount: number
}

interface LeaderboardData {
  contest: {
    id: string
    title: string
    slug: string
    status: string
    problems: { id: string; title: string; slug: string; order: number; points: number }[]
  }
  standings: {
    rank: number
    user: { id: string; username: string; displayName: string; avatarUrl?: string; rating: number }
    score: number
    penalty: number
    problems: Record<string, { solved: boolean; points: number; attempts: number; timeMinutes?: number }>
  }[]
}

export default function ContestDetailPage({ params }: { params: { slug: string } }) {
  const { isAuthenticated, user } = useAuth()
  const [contest, setContest] = useState<ContestDetail | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [activeTab, setActiveTab] = useState<'problems' | 'standings'>('problems')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [isRegistering, setIsRegistering] = useState(false)

  const loadContest = useCallback(async () => {
    try {
      const data = await api.getContest(params.slug)
      setContest(data)
    } catch (err) {
      console.error('Failed to load contest:', err)
    } finally {
      setIsLoading(false)
    }
  }, [params.slug])

  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true)
    try {
      const data = await api.getContestLeaderboard(params.slug)
      setLeaderboard(data)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    } finally {
      setLoadingLeaderboard(false)
    }
  }, [params.slug])

  useEffect(() => {
    loadContest()
    loadLeaderboard()

    const ticker = setInterval(() => setNow(Date.now()), 1000)

    // Real-Time Contest Leaderboard WebSocket Sync
    const unsubscribe = subscribeToContest(params.slug, () => {
      console.log('[Contest] Received real-time leaderboard update via WebSocket')
      loadLeaderboard()
    })

    return () => {
      clearInterval(ticker)
      unsubscribe()
    }
  }, [loadContest, loadLeaderboard, params.slug])

  const handleRegister = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to register for contests!')
      return
    }
    if (!contest) return

    setIsRegistering(true)
    try {
      await api.registerContest(contest.id)
      setContest((prev) => (prev ? { ...prev, isRegistered: true } : null))
    } catch (err: any) {
      alert(err.message || 'Registration failed')
    } finally {
      setIsRegistering(false)
    }
  }

  // Countdown timer string
  const getCountdownString = () => {
    if (!contest) return ''
    const target = contest.status === 'RUNNING' ? new Date(contest.endTime).getTime() : new Date(contest.startTime).getTime()
    const diff = target - now

    if (diff <= 0) return contest.status === 'RUNNING' ? 'Contest Concluded' : 'Starting soon...'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    const prefix = contest.status === 'RUNNING' ? 'Remaining: ' : 'Starts in: '
    return `${prefix}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono text-zinc-400">Loading contest workstation...</span>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface-200 border border-white/[0.08] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Contest Not Found</h2>
        <p className="text-xs text-zinc-400">The requested contest could not be found.</p>
        <Link
          href="/contests"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contests</span>
        </Link>
      </div>
    )
  }

  const isLive = contest.status === 'RUNNING'
  const isUpcoming = contest.status === 'UPCOMING'

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl bg-[#0B101D] border border-white/[0.08] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <Link
              href="/contests"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Contests</span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {contest.title}
              </h1>
              {isLive ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE NOW
                </span>
              ) : isUpcoming ? (
                <span className="px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-mono font-bold">
                  UPCOMING
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-zinc-700/30 border border-zinc-700 text-zinc-400 text-xs font-mono font-bold">
                  CONCLUDED
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {contest.description}
            </p>
          </div>

          {/* Right Action / Timer Box */}
          <div className="flex flex-col items-start sm:items-end justify-between gap-3 bg-[#070A12] p-4 rounded-xl border border-white/[0.06] min-w-[220px]">
            <div className="space-y-1 text-left sm:text-right">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                Contest Timer
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  isLive ? 'text-emerald-400 animate-pulse' : 'text-brand-300'
                }`}
              >
                {getCountdownString()}
              </span>
            </div>

            {isUpcoming && !contest.isRegistered && (
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="w-full px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-brand transition-all cursor-pointer"
              >
                {isRegistering ? 'Registering...' : 'Register for Contest'}
              </button>
            )}

            {contest.isRegistered && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Registered Participant</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/[0.06] text-xs font-mono">
          <button
            onClick={() => setActiveTab('problems')}
            className={`pb-2 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'problems'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Contest Problems ({contest.problems.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('standings')
              loadLeaderboard()
            }}
            className={`pb-2 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'standings'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Live Standings & ICPC Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Problems List */}
      {activeTab === 'problems' && (
        <div className="space-y-4">
          {contest.problems.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-surface-200/50 border border-white/[0.06] text-zinc-500 text-sm">
              Problems will be revealed when the contest starts.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {contest.problems.map((cp, idx) => {
                const label = String.fromCharCode(65 + idx)
                const isLocked = isUpcoming

                return (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-200/70 hover:bg-surface-100 border border-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Letter Avatar (A, B, C) */}
                      <div className="w-10 h-10 rounded-xl bg-surface-300 border border-white/[0.08] flex items-center justify-center font-mono font-bold text-base text-brand-400">
                        {label}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {cp.problem.title}
                          </span>
                          {!isLocked && (
                            <span
                              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                cp.problem.difficulty === 'EASY'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : cp.problem.difficulty === 'MEDIUM'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {cp.problem.difficulty}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">
                          <span className="text-brand-300 font-semibold">{cp.points} Points</span>
                          {cp.problem.tags?.map((t) => (
                            <span key={t.tag.name} className="text-zinc-500">
                              #{t.tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Solve CTA */}
                    <div>
                      {isLocked ? (
                        <span className="text-xs font-mono text-zinc-500 px-3 py-1.5 rounded-lg bg-surface-300 border border-white/[0.04]">
                          Locked until Start
                        </span>
                      ) : (
                        <Link
                          href={`/problems/${cp.problem.slug}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-brand transition-all"
                        >
                          <span>Solve Challenge</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Leaderboard / Standings */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Live Socket Standings</span>
              </span>
              <span className="hidden md:inline text-zinc-500">
                • ICPC Scoring: Points accumulated + 20m per penalty
              </span>
            </div>
            <button
              onClick={loadLeaderboard}
              disabled={loadingLeaderboard}
              className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
              <span>Refresh Standings</span>
            </button>
          </div>

          {!leaderboard || leaderboard.standings.length === 0 ? (
            <div className="text-center py-20 rounded-xl bg-surface-200/50 border border-white/[0.06] text-zinc-500 space-y-2">
              <Trophy className="w-10 h-10 mx-auto text-zinc-600" />
              <p className="font-semibold text-zinc-300 text-sm">No submissions recorded yet</p>
              <p className="text-xs">Solve problems during the contest to enter the live standings.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#090D17] border border-white/[0.08] overflow-x-auto shadow-2xl">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#0E1424] text-zinc-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4">Competitor</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Penalty</th>
                    {leaderboard.contest.problems.map((p, idx) => (
                      <th key={p.id} className="py-3 px-3 text-center">
                        {String.fromCharCode(65 + idx)} ({p.points})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {leaderboard.standings.map((row) => {
                    const isMedal = row.rank <= 3
                    const medalEmoji = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : ''

                    return (
                      <tr
                        key={row.user.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          user?.id === row.user.id ? 'bg-brand-500/10' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 font-bold text-sm">
                          {isMedal ? (
                            <span className="flex items-center gap-1">
                              <span>{medalEmoji}</span>
                              <span className="text-amber-400">{row.rank}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400">{row.rank}</span>
                          )}
                        </td>

                        {/* Competitor */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px]">
                              {row.user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-white">{row.user.username}</span>
                              <span className="text-[10px] text-zinc-500">⭐ {row.user.rating}</span>
                            </div>
                          </div>
                        </td>

                        {/* Total Score */}
                        <td className="py-3 px-4 text-center font-bold text-emerald-400 text-sm">
                          {row.score}
                        </td>

                        {/* Total Penalty */}
                        <td className="py-3 px-4 text-center text-zinc-400">
                          {row.penalty} m
                        </td>

                        {/* Problem Matrix */}
                        {leaderboard.contest.problems.map((p) => {
                          const res = row.problems[p.id]
                          if (!res || res.attempts === 0) {
                            return (
                              <td key={p.id} className="py-3 px-3 text-center text-zinc-600">
                                -
                              </td>
                            )
                          }

                          if (res.solved) {
                            return (
                              <td key={p.id} className="py-3 px-3 text-center">
                                <div className="inline-flex flex-col items-center justify-center p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 min-w-[45px]">
                                  <span className="font-bold">+{res.attempts}</span>
                                  <span className="text-[9px] text-zinc-400">{res.timeMinutes}m</span>
                                </div>
                              </td>
                            )
                          }

                          return (
                            <td key={p.id} className="py-3 px-3 text-center">
                              <div className="inline-flex flex-col items-center justify-center p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 min-w-[45px]">
                                <span className="font-bold">-{res.attempts}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
