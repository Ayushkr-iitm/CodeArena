'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Trophy,
  Medal,
  Award,
  Search,
  CheckCircle2,
  TrendingUp,
  Flame,
  Users,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface LeaderboardUser {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  rating: number
  rank: number
  totalSolved?: number
}

// Rating tier helper function
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

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const res = await api.getLeaderboard(1, 100)
        const data = res?.data || res
        setUsers(data?.items || [])
      } catch (err: any) {
        console.error('Failed to load global leaderboard:', err)
        setError(err.message || 'Failed to load leaderboard data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const query = search.toLowerCase()
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        (u.displayName && u.displayName.toLowerCase().includes(query))
    )
  }, [users, search])

  const top3 = useMemo(() => users.slice(0, 3), [users])

  return (
    <div className="space-y-10 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/20">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Hall of Fame
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Global Leaderboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Top competitive programmers ranked by algorithm rating points and accepted submissions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-10 pr-4 py-2 bg-surface-200 border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {!isLoading && top3.length > 0 && !search && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* #2 Silver */}
          {top3[1] && (
            <div className="order-2 md:order-1 p-6 rounded-2xl bg-surface-200/90 border border-white/[0.08] flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md hover:border-slate-400/40 transition-all">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-400 to-zinc-200" />
              <div className="w-12 h-12 rounded-2xl bg-slate-500/20 border border-slate-400/30 flex items-center justify-center text-xl font-black text-slate-300 mb-3 shadow-lg">
                🥈
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">2nd Place</span>
              <Link
                href={`/profile/${top3[1].username}`}
                className="text-lg font-bold text-white mt-1 hover:text-brand-400 transition-colors"
              >
                {top3[1].displayName || top3[1].username}
              </Link>
              <Link href={`/profile/${top3[1].username}`} className="text-xs font-mono text-zinc-400 hover:text-zinc-200">
                @{top3[1].username}
              </Link>
              
              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-black text-slate-200 font-mono">
                  {top3[1].rating}
                </span>
                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${getRatingTier(top3[1].rating).color}`}>
                  {getRatingTier(top3[1].rating).name}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-2 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{top3[1].totalSolved ?? 0} Problems Solved</span>
              </div>
            </div>
          )}

          {/* #1 Gold */}
          {top3[0] && (
            <div className="order-1 md:order-2 p-7 rounded-2xl bg-gradient-to-b from-amber-500/10 via-surface-200/90 to-surface-200 border-2 border-amber-500/40 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md shadow-glow-amber transition-all -translate-y-2">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 shadow-glow-amber" />
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl font-black text-amber-300 mb-3 shadow-xl">
                🥇
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-black flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Grand Champion
              </span>
              <Link
                href={`/profile/${top3[0].username}`}
                className="text-xl font-extrabold text-white mt-1 hover:text-amber-300 transition-colors"
              >
                {top3[0].displayName || top3[0].username}
              </Link>
              <Link href={`/profile/${top3[0].username}`} className="text-xs font-mono text-zinc-400 hover:text-zinc-200">
                @{top3[0].username}
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-3xl font-black text-amber-300 font-mono">
                  {top3[0].rating}
                </span>
                <span className={`text-xs font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border ${getRatingTier(top3[0].rating).color}`}>
                  {getRatingTier(top3[0].rating).name}
                </span>
              </div>
              <div className="text-xs text-zinc-300 mt-2 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{top3[0].totalSolved ?? 0} Problems Solved</span>
              </div>
            </div>
          )}

          {/* #3 Bronze */}
          {top3[2] && (
            <div className="order-3 p-6 rounded-2xl bg-surface-200/90 border border-white/[0.08] flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md hover:border-amber-700/40 transition-all">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-700 to-amber-600" />
              <div className="w-12 h-12 rounded-2xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center text-xl font-black text-amber-600 mb-3 shadow-lg">
                🥉
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-600 font-bold">3rd Place</span>
              <Link
                href={`/profile/${top3[2].username}`}
                className="text-lg font-bold text-white mt-1 hover:text-brand-400 transition-colors"
              >
                {top3[2].displayName || top3[2].username}
              </Link>
              <Link href={`/profile/${top3[2].username}`} className="text-xs font-mono text-zinc-400 hover:text-zinc-200">
                @{top3[2].username}
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {top3[2].rating}
                </span>
                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${getRatingTier(top3[2].rating).color}`}>
                  {getRatingTier(top3[2].rating).name}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-2 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{top3[2].totalSolved ?? 0} Problems Solved</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Standings Table */}
      <div className="rounded-2xl border border-white/[0.1] bg-surface-200/90 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            Rankings ({filteredUsers.length} Competitors)
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">Updated in real-time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-surface-300/80 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="py-4 px-6 w-20 text-center">Rank</th>
                <th className="py-4 px-6">Competitor</th>
                <th className="py-4 px-6 w-40 text-center">Rating</th>
                <th className="py-4 px-6 w-40 text-center">Tier</th>
                <th className="py-4 px-6 w-36 text-center">Solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-400">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading global standings...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-rose-400">
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.username === u.username
                  const tier = getRatingTier(u.rating)

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isCurrent ? 'bg-amber-500/[0.04]' : ''
                      }`}
                    >
                      {/* Rank Column with Medals */}
                      <td className="py-4 px-6 text-center">
                        {u.rank === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : u.rank === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : u.rank === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="font-bold text-zinc-400 text-xs">#{u.rank}</span>
                        )}
                      </td>

                      {/* Competitor Name + Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                            {u.displayName
                              ? u.displayName.charAt(0).toUpperCase()
                              : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <Link
                                href={`/profile/${u.username}`}
                                className="hover:text-brand-400 transition-colors"
                              >
                                {u.displayName || u.username}
                              </Link>
                              {isCurrent && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/profile/${u.username}`}
                              className="text-xs text-zinc-500 font-mono hover:text-zinc-300 transition-colors block"
                            >
                              @{u.username}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-6 text-center font-black text-base text-white">
                        {u.rating}
                      </td>

                      {/* Tier Badge */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${tier.color}`}
                        >
                          {tier.name}
                        </span>
                      </td>

                      {/* Solved Problems */}
                      <td className="py-4 px-6 text-center font-bold text-emerald-400">
                        {u.totalSolved ?? 0}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    No competitors match &quot;{search}&quot;.
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
