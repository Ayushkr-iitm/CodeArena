'use client'

import { useState } from 'react'
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
  Zap,
  Layers
} from 'lucide-react'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

interface Problem {
  id: number
  slug: string
  title: string
  difficulty: Difficulty
  acceptance: string
  acceptanceRateNum: number
  solved: boolean
  tags: string[]
  submissions: number
}

const mockProblems: Problem[] = [
  { 
    id: 1, 
    slug: 'two-sum', 
    title: 'Two Sum', 
    difficulty: 'EASY', 
    acceptance: '52.8%', 
    acceptanceRateNum: 52.8,
    solved: true, 
    tags: ['Arrays', 'Hash Table'],
    submissions: 124500
  },
  { 
    id: 2, 
    slug: 'reverse-string', 
    title: 'Reverse String', 
    difficulty: 'EASY', 
    acceptance: '76.4%', 
    acceptanceRateNum: 76.4,
    solved: true, 
    tags: ['Strings', 'Two Pointers'],
    submissions: 89300
  },
  { 
    id: 3, 
    slug: 'maximum-subarray', 
    title: 'Maximum Subarray', 
    difficulty: 'MEDIUM', 
    acceptance: '49.1%', 
    acceptanceRateNum: 49.1,
    solved: false, 
    tags: ['Arrays', 'Dynamic Programming'],
    submissions: 65200
  },
  { 
    id: 4, 
    slug: 'valid-parentheses', 
    title: 'Valid Parentheses', 
    difficulty: 'EASY', 
    acceptance: '41.2%', 
    acceptanceRateNum: 41.2,
    solved: false, 
    tags: ['Strings', 'Stack'],
    submissions: 110400
  },
  { 
    id: 5, 
    slug: 'longest-common-subsequence', 
    title: 'Longest Common Subsequence', 
    difficulty: 'HARD', 
    acceptance: '32.6%', 
    acceptanceRateNum: 32.6,
    solved: false, 
    tags: ['Strings', 'Dynamic Programming'],
    submissions: 42100
  },
]

const topicTags = [
  'All Topics',
  'Arrays',
  'Strings',
  'Hash Table',
  'Dynamic Programming',
  'Two Pointers',
  'Stack',
  'Binary Search',
]

export default function ProblemsPage() {
  const [selectedTopic, setSelectedTopic] = useState('All Topics')
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | Difficulty>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SOLVED' | 'UNSOLVED'>('ALL')
  const [search, setSearch] = useState('')

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
    }
  }

  const filteredProblems = mockProblems.filter((p) => {
    const matchesDifficulty = difficultyFilter === 'ALL' || p.difficulty === difficultyFilter
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SOLVED' && p.solved) ||
      (statusFilter === 'UNSOLVED' && !p.solved)
    const matchesTopic =
      selectedTopic === 'All Topics' || p.tags.includes(selectedTopic)
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))

    return matchesDifficulty && matchesStatus && matchesTopic && matchesSearch
  })

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
              Algorithmic Problem Archive
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Problem Directory
            </h1>
            
            <p className="text-zinc-300 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
              Explore curated algorithmic problems to master data structures, algorithmic paradigms, and system constraints.
            </p>
          </div>

          {/* High-Visibility, Clean Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/[0.1]">
            
            {/* Metric 1: Total */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-white/[0.08] flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Total</span>
              <span className="text-2xl font-black text-white mt-1">5</span>
            </div>

            {/* Metric 2: Solved */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-emerald-500/20 flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                <BookCheck className="w-3.5 h-3.5" />
                Solved
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1">2 <span className="text-sm font-medium text-zinc-500">/ 5</span></span>
            </div>

            {/* Metric 3: Easy */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-emerald-500/20 flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Easy</span>
              <span className="text-2xl font-black text-emerald-400 mt-1">3</span>
            </div>

            {/* Metric 4: Medium */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-amber-500/20 flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">Medium</span>
              <span className="text-2xl font-black text-amber-400 mt-1">1</span>
            </div>

            {/* Metric 5: Hard */}
            <div className="p-3.5 rounded-xl bg-surface-400/80 border border-rose-500/20 flex flex-col col-span-2 sm:col-span-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-rose-400">Hard</span>
              <span className="text-2xl font-black text-rose-400 mt-1">1</span>
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
              Two Sum
            </h3>
            
            <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
              Find indices of two numbers in an array that sum to a given target.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Easy
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-sm font-semibold text-zinc-300">52.8% Acceptance</span>
            </div>
          </div>

          <Link
            href="/problems/two-sum"
            className="mt-6 flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-surface-400 font-extrabold text-sm transition-all shadow-md group"
          >
            <span>Solve Daily Problem</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Topic Filter Pills Carousel */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
        {topicTags.map((topic) => {
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
        
        {/* Search Bar with clear text */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by title or topic..."
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

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 text-sm font-semibold bg-surface-300 border border-white/[0.08] rounded-xl text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="SOLVED">Solved Only</option>
            <option value="UNSOLVED">Unsolved Only</option>
          </select>
        </div>
      </div>

      {/* High-Contrast Problems Data Table */}
      <div className="rounded-2xl border border-white/[0.1] bg-surface-200/90 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.1] bg-surface-300/80 text-zinc-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                <th className="py-4 px-6 w-20 text-center">Status</th>
                <th className="py-4 px-6">Problem Title</th>
                <th className="py-4 px-6 w-40">Difficulty</th>
                <th className="py-4 px-6 w-52 hidden md:table-cell">Acceptance</th>
                <th className="py-4 px-6 w-32 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredProblems.map((problem) => (
                <tr
                  key={problem.id}
                  className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                >
                  {/* Status Indicator */}
                  <td className="py-5 px-6 text-center">
                    {problem.solved ? (
                      <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 mx-auto rounded-full flex items-center justify-center text-zinc-600">
                        <Circle className="w-4 h-4" />
                      </div>
                    )}
                  </td>

                  {/* Title & Tags */}
                  <td className="py-5 px-6">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors flex items-center gap-2"
                    >
                      <span className="text-zinc-400 font-semibold text-sm">#{problem.id}.</span>
                      <span>{problem.title}</span>
                    </Link>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {problem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-400 text-zinc-300 border border-white/[0.08]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Difficulty Badge */}
                  <td className="py-5 px-6">
                    {getDifficultyBadge(problem.difficulty)}
                  </td>

                  {/* Acceptance */}
                  <td className="py-5 px-6 hidden md:table-cell">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-zinc-200 w-14">
                        {problem.acceptance}
                      </span>
                      <div className="w-28 h-2 bg-surface-400 rounded-full overflow-hidden border border-white/[0.06]">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-brand-accent rounded-full"
                          style={{ width: `${problem.acceptanceRateNum}%` }}
                        />
                      </div>
                    </div>
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
              ))}

              {filteredProblems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-zinc-400">
                    <Code2 className="w-10 h-10 mx-auto mb-3 text-zinc-500" />
                    <p className="text-lg font-bold text-white">No problems found</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Try adjusting your search terms or filter criteria.
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
