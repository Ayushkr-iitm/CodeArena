'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  Search, 
  CheckCircle2, 
  Circle, 
  Flame, 
  ArrowRight, 
  Code2, 
  Sparkles, 
  ChevronRight, 
  BookCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { api } from '@/lib/api'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

interface ProblemItem {
  id: string
  slug: string
  title: string
  difficulty: Difficulty
  submissionCount: number
  solved?: boolean
  tags: { id: string; name: string; slug: string }[]
}

interface Stats {
  total: number
  easy: number
  medium: number
  hard: number
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, easy: 0, medium: 0, hard: 0 })
  const [tags, setTags] = useState<string[]>(['All Topics'])
  const [selectedTopic, setSelectedTopic] = useState('All Topics')
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | Difficulty>('ALL')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch available tags on mount
  useEffect(() => {
    async function loadTags() {
      try {
        const tagList = await api.getAllTags()
        if (Array.isArray(tagList)) {
          setTags(['All Topics', ...tagList.map((t) => t.name)])
        }
      } catch (err) {
        console.warn('Could not load tags list:', err)
      }
    }
    loadTags()
  }, [])

  // Fetch problems whenever filters change
  const fetchProblems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getProblems({
        difficulty: difficultyFilter !== 'ALL' ? difficultyFilter : undefined,
        tag: selectedTopic !== 'All Topics' ? selectedTopic : undefined,
        search: search.trim() || undefined,
        pageSize: 50,
      })

      if (data && data.items) {
        setProblems(data.items)
        if (data.stats) {
          setStats(data.stats)
        }
      } else if (Array.isArray(data)) {
        setProblems(data)
      }
    } catch (err: any) {
      console.error('Failed to load problems:', err)
      setError(err.message || 'Failed to connect to judge database')
    } finally {
      setIsLoading(false)
    }
  }, [difficultyFilter, selectedTopic, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProblems()
    }, 250) // Debounce search
    return () => clearTimeout(timer)
  }, [fetchProblems])

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'EASY':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Easy
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Medium
          </span>
        )
      case 'HARD':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Hard
          </span>
        )
      default:
        return null
    }
  }

  // Choose spotlight problem (first available or fallback)
  const spotlightProblem = problems.find((p) => p.slug === 'two-sum') || problems[0]

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Banner: Directory Header & Daily Challenge Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Headline & Prominent Stats Bar (8 cols) */}
        <div className="lg:col-span-8 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-surface-200 to-surface-300 border border-white/[0.1] relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 blur-[90px] pointer-events-none" />
          
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 text-brand-300 text-sm font-semibold mb-4 border border-brand-500/30">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Live Database Archive
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Problem Directory
            </h1>
            
            <p className="text-zinc-300 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
              Explore algorithmic problems loaded directly from your Prisma database, complete with custom test cases and memory/CPU limits.
            </p>
          </div>

          {/* High-Visibility, Clean Metric Badges (Real Database Stats) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/[0.1]">
            
            {/* Metric 1: Total */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-white/[0.08] flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Total in DB</span>
              <span className="text-2xl font-black text-white mt-1">{stats.total}</span>
            </div>

            {/* Metric 2: Solved */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-emerald-500/20 flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                <BookCheck className="w-3.5 h-3.5" />
                Solved
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1">
                0 <span className="text-sm font-medium text-zinc-500">/ {stats.total}</span>
              </span>
            </div>

            {/* Metric 3: Easy */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-emerald-500/20 flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Easy</span>
              <span className="text-2xl font-black text-emerald-400 mt-1">{stats.easy}</span>
            </div>

            {/* Metric 4: Medium */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-amber-500/20 flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">Medium</span>
              <span className="text-2xl font-black text-amber-400 mt-1">{stats.medium}</span>
            </div>

            {/* Metric 5: Hard */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-rose-500/20 flex flex-col col-span-2 sm:col-span-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-rose-400">Hard</span>
              <span className="text-2xl font-black text-rose-400 mt-1">{stats.hard}</span>
            </div>

          </div>
        </div>

        {/* Daily Problem Spotlight Card (4 cols) */}
        <div className="lg:col-span-4 p-8 rounded-2xl bg-surface-200 border border-amber-500/30 relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 p-6">
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-400/20" />
              Daily Challenge
            </div>
            
            <h3 className="text-2xl font-extrabold text-white mt-3">
              {spotlightProblem ? spotlightProblem.title : 'Two Sum'}
            </h3>
            
            <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
              Solve today&apos;s featured challenge and verify your solution against hidden test cases.
            </p>

            <div className="flex items-center gap-3 mt-4">
              {spotlightProblem && getDifficultyBadge(spotlightProblem.difficulty)}
              <span className="text-zinc-500">•</span>
              <span className="text-sm font-semibold text-zinc-300">
                {spotlightProblem ? `${spotlightProblem.submissionCount} Submissions` : 'Active'}
              </span>
            </div>
          </div>

          {spotlightProblem && (
            <Link
              href={`/problems/${spotlightProblem.slug}`}
              className="mt-6 flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-surface-400 font-extrabold text-sm transition-all shadow-md group"
            >
              <span>Solve Challenge</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* Topic Filter Pills Carousel */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
        {tags.map((topic) => {
          const isSelected = selectedTopic === topic
          return (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-glow-brand font-bold'
                  : 'bg-surface-200 border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-surface-100'
              }`}
            >
              {topic}
            </button>
          )
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-200 border border-white/[0.1] shadow-lg">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems in database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base bg-surface-300 border border-white/[0.1] rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Difficulty Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-surface-300 border border-white/[0.08]">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  difficultyFilter === diff
                    ? 'bg-surface-100 text-white shadow font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {diff === 'ALL' ? 'All Difficulties' : diff.charAt(0) + diff.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchProblems}
            className="p-3 rounded-xl bg-surface-300 border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-surface-100 transition-colors"
            title="Refresh problems"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Error connecting to backend database: {error}. Make sure the API server is running on port 4000.</span>
        </div>
      )}

      {/* High-Contrast Problems Data Table */}
      <div className="rounded-2xl border border-white/[0.1] bg-surface-200/90 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.1] bg-surface-300/80 text-zinc-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                <th className="py-4 px-6 w-20 text-center">Status</th>
                <th className="py-4 px-6">Problem Title</th>
                <th className="py-4 px-6 w-40">Difficulty</th>
                <th className="py-4 px-6 w-52 hidden md:table-cell">Submissions</th>
                <th className="py-4 px-6 w-32 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-5 px-6 text-center">
                      <div className="w-6 h-6 rounded-full bg-white/[0.06] mx-auto" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="w-48 h-5 rounded bg-white/[0.06] mb-2" />
                      <div className="w-24 h-4 rounded bg-white/[0.04]" />
                    </td>
                    <td className="py-5 px-6">
                      <div className="w-20 h-6 rounded-full bg-white/[0.06]" />
                    </td>
                    <td className="py-5 px-6 hidden md:table-cell">
                      <div className="w-16 h-4 rounded bg-white/[0.04]" />
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="w-16 h-8 rounded-xl bg-white/[0.06] ml-auto" />
                    </td>
                  </tr>
                ))
              ) : problems.length > 0 ? (
                problems.map((problem, idx) => (
                  <tr
                    key={problem.id}
                    className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  >
                    {/* Status Indicator */}
                    <td className="py-5 px-6 text-center">
                      <div className="w-7 h-7 mx-auto rounded-full flex items-center justify-center text-zinc-600">
                        <Circle className="w-4 h-4" />
                      </div>
                    </td>

                    {/* Title & Tags */}
                    <td className="py-5 px-6">
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors flex items-center gap-2"
                      >
                        <span className="text-zinc-400 font-semibold text-sm">#{idx + 1}.</span>
                        <span>{problem.title}</span>
                      </Link>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {problem.tags && problem.tags.map((t) => (
                          <span
                            key={t.name}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-400 text-zinc-300 border border-white/[0.08]"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Difficulty Badge */}
                    <td className="py-5 px-6">
                      {getDifficultyBadge(problem.difficulty)}
                    </td>

                    {/* Submissions Count */}
                    <td className="py-5 px-6 hidden md:table-cell">
                      <span className="text-sm font-semibold text-zinc-300 font-mono">
                        {problem.submissionCount} submissions
                      </span>
                    </td>

                    {/* Solve Button */}
                    <td className="py-5 px-6 text-right">
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-surface-300 hover:bg-brand-600 text-white border border-white/[0.1] hover:border-brand-500 transition-all shadow-sm"
                      >
                        <span>Solve</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-zinc-400">
                    <Code2 className="w-10 h-10 mx-auto mb-3 text-zinc-500" />
                    <p className="text-lg font-bold text-white">No problems found</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      No problems match your search or filter criteria in the database.
                    </p>
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
