'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Trophy,
  CheckCircle2,
  Calendar,
  Code2,
  Activity,
  Layers,
  ArrowLeft,
  Clock,
  HardDrive,
  Award,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface ProfileData {
  user: {
    id: string
    username: string
    displayName: string
    rating: number
    avatarUrl?: string
    createdAt: string
  }
  stats: {
    totalSolved: number
    easySolved: number
    mediumSolved: number
    hardSolved: number
    totalSubmissions: number
    acceptanceRate: number
    languageStats: Record<string, number>
    recentSubmissions: {
      id: string
      language: string
      verdict: string
      runtime: number | null
      memory: number | null
      createdAt: string
      problem: {
        title: string
        slug: string
        difficulty: string
      }
    }[]
  }
}

function getRatingTier(rating: number) {
  if (rating >= 2400) {
    return { name: 'Grandmaster', color: 'text-red-400 bg-red-500/10 border-red-500/30' }
  }
  if (rating >= 2000) {
    return { name: 'Master', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
  }
  if (rating >= 1600) {
    return { name: 'Expert', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' }
  }
  if (rating >= 1400) {
    return { name: 'Specialist', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' }
  }
  if (rating >= 1200) {
    return { name: 'Pupil', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
  }
  return { name: 'Newbie', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' }
}

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true)
      try {
        const res = await api.getProfile(params.username)
        const data = res?.data || res
        setProfile(data)
      } catch (err: any) {
        console.error('Failed to load profile:', err)
        setError(err.message || 'User not found')
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [params.username])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface-200 border border-rose-500/30 text-center space-y-4">
        <User className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
        <p className="text-zinc-400 text-sm">
          No programmer found with username &quot;{params.username}&quot;.
        </p>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-300 text-zinc-300 hover:text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leaderboard</span>
        </Link>
      </div>
    )
  }

  const { user, stats } = profile
  const tier = getRatingTier(user.rating)
  const isSelf = currentUser?.username === user.username

  const joinedDate = new Date(user.createdAt).toLocaleDateString([], {
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Back Link */}
      <div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leaderboard</span>
        </Link>
      </div>

      {/* User Bio Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface-200/90 border border-white/[0.08] shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-0.5 shadow-glow-brand flex-shrink-0">
            <div className="w-full h-full bg-[#090D18] rounded-[14px] flex items-center justify-center font-black text-3xl text-white">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {user.displayName || user.username}
              </h1>
              {isSelf && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Your Profile
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
              <span>@{user.username}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Joined {joinedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Rating & Tier Pill */}
        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-white/[0.06] pt-4 md:pt-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">
              Contest Rating
            </div>
            <div className="text-3xl font-black text-white font-mono mt-0.5">
              {user.rating}
            </div>
          </div>

          <div className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase font-mono tracking-wider ${tier.color}`}>
            {tier.name}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Problems Solved Card */}
        <div className="p-6 rounded-2xl bg-surface-200/90 border border-white/[0.08] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase font-bold text-zinc-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Problems Solved
            </h3>
            <span className="text-2xl font-black text-white font-mono">
              {stats.totalSolved}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-emerald-400 font-semibold">Easy</span>
                <span className="text-zinc-400">{stats.easySolved} Solved</span>
              </div>
              <div className="h-1.5 w-full bg-surface-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, stats.easySolved * 25)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-amber-400 font-semibold">Medium</span>
                <span className="text-zinc-400">{stats.mediumSolved} Solved</span>
              </div>
              <div className="h-1.5 w-full bg-surface-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, stats.mediumSolved * 25)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-rose-400 font-semibold">Hard</span>
                <span className="text-zinc-400">{stats.hardSolved} Solved</span>
              </div>
              <div className="h-1.5 w-full bg-surface-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, stats.hardSolved * 25)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance & Submissions Card */}
        <div className="p-6 rounded-2xl bg-surface-200/90 border border-white/[0.08] space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase font-bold text-zinc-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              Submission Accuracy
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-brand-400 font-mono">
                {stats.acceptanceRate}%
              </span>
              <span className="text-xs font-mono text-zinc-400">Acceptance Rate</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Total Submissions</span>
            <span className="font-bold text-white text-base">{stats.totalSubmissions}</span>
          </div>
        </div>

        {/* Language Breakdown */}
        <div className="p-6 rounded-2xl bg-surface-200/90 border border-white/[0.08] space-y-4 shadow-xl">
          <h3 className="text-xs font-mono uppercase font-bold text-zinc-400 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            Language Distribution
          </h3>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-300/60 border border-white/[0.04]">
              <span className="text-xs font-mono font-bold text-blue-300">C++ (GCC)</span>
              <span className="text-xs font-mono text-zinc-300">
                {stats.languageStats?.CPP || 0} submissions
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-300/60 border border-white/[0.04]">
              <span className="text-xs font-mono font-bold text-amber-300">Python 3</span>
              <span className="text-xs font-mono text-zinc-300">
                {stats.languageStats?.PYTHON || 0} submissions
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-300/60 border border-white/[0.04]">
              <span className="text-xs font-mono font-bold text-orange-300">Java (OpenJDK)</span>
              <span className="text-xs font-mono text-zinc-300">
                {stats.languageStats?.JAVA || 0} submissions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Activity Table */}
      <div className="rounded-2xl border border-white/[0.1] bg-surface-200/90 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            Recent Judge Submissions
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            Last {stats.recentSubmissions.length} submissions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-surface-300/80 text-zinc-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5">Problem</th>
                <th className="py-3 px-5 w-32 text-center">Verdict</th>
                <th className="py-3 px-5 w-24 text-center">Language</th>
                <th className="py-3 px-5 w-28 text-center">Runtime</th>
                <th className="py-3 px-5 w-36 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {stats.recentSubmissions.length > 0 ? (
                stats.recentSubmissions.map((s) => {
                  const isAc = s.verdict === 'ACCEPTED'
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <Link
                          href={`/problems/${s.problem.slug}`}
                          className="font-bold text-white hover:text-brand-400 transition-colors"
                        >
                          {s.problem.title}
                        </Link>
                        <span className="ml-2 text-[10px] text-zinc-500">
                          ({s.problem.difficulty})
                        </span>
                      </td>

                      <td className="py-3 px-5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAc
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {s.verdict.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-center text-zinc-400">
                        {s.language}
                      </td>

                      <td className="py-3 px-5 text-center text-zinc-400">
                        {s.runtime ? `${s.runtime} ms` : '--'}
                      </td>

                      <td className="py-3 px-5 text-right text-zinc-500 text-[11px]">
                        {new Date(s.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">
                    No submissions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
