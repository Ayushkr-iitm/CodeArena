'use client'

import { useState, useEffect } from 'react'
import {
  Code2,
  ThumbsUp,
  Plus,
  Copy,
  Check,
  Clock,
  HardDrive,
  User,
  X,
  FileCode,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface SolutionItem {
  id: string
  title: string
  description: string
  code: string
  language: string
  timeComplexity: string
  spaceComplexity: string
  upvotes: number
  createdAt: string
  user: {
    id: string
    username: string
    displayName?: string
    rating: number
    avatarUrl?: string
  }
}

interface ProblemSolutionsProps {
  problemId: string
  problemTitle: string
}

export default function ProblemSolutions({ problemId, problemTitle }: ProblemSolutionsProps) {
  const { user, isAuthenticated } = useAuth()
  const [solutions, setSolutions] = useState<SolutionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state for publishing new solution
  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    language: 'CPP' as 'CPP' | 'PYTHON' | 'JAVA',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
  })

  const loadSolutions = async () => {
    try {
      const res = await api.getSolutions(problemId)
      const data = (res as any)?.data || res
      setSolutions(data || [])
    } catch (err) {
      console.error('Failed to load solutions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSolutions()
  }, [problemId])

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleVote = async (solutionId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to upvote solutions!')
      return
    }
    try {
      await api.voteSolution(solutionId)
      loadSolutions()
    } catch (err) {
      console.error('Failed to upvote:', err)
    }
  }

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Please sign in to share a solution!')
      return
    }
    if (!form.title.trim() || !form.code.trim() || !form.description.trim()) {
      alert('Please fill out all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await api.postSolution({
        problemId,
        title: form.title.trim(),
        description: form.description.trim(),
        code: form.code.trim(),
        language: form.language,
        timeComplexity: form.timeComplexity.trim(),
        spaceComplexity: form.spaceComplexity.trim(),
      })
      setIsModalOpen(false)
      setForm({
        title: '',
        description: '',
        code: '',
        language: 'CPP',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
      })
      loadSolutions()
    } catch (err: any) {
      alert(err.message || 'Failed to publish solution')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-2">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading community solutions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-xs text-zinc-300">
      
      {/* Header & Share Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold uppercase tracking-wider text-[11px]">
          <Code2 className="w-4 h-4" />
          <span>Community Solutions ({solutions.length})</span>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              alert('Please sign in to share your solution!')
              return
            }
            setIsModalOpen(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Share Solution</span>
        </button>
      </div>

      {/* Solutions List */}
      <div className="space-y-4">
        {solutions.length > 0 ? (
          solutions.map((sol) => (
            <div
              key={sol.id}
              className="p-4 rounded-xl bg-[#090D18] border border-white/[0.06] space-y-3"
            >
              {/* Title & Author */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">
                    {sol.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                    <span className="font-semibold text-zinc-300">
                      @{sol.user.username}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-300 text-zinc-300">
                      {sol.language}
                    </span>
                    <span>•</span>
                    <span>{new Date(sol.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Upvote Pill */}
                <button
                  onClick={() => handleVote(sol.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-300 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-mono font-semibold"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{sol.upvotes}</span>
                </button>
              </div>

              {/* Complexity Badges */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Time: {sol.timeComplexity}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Space: {sol.spaceComplexity}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs font-sans text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {sol.description}
              </p>

              {/* Code Snippet Box */}
              <div className="relative rounded-lg bg-[#060910] border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04] text-[10px] font-mono text-zinc-400">
                  <span>{sol.language} Solution</span>
                  <button
                    onClick={() => handleCopyCode(sol.id, sol.code)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedId === sol.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono text-zinc-200 overflow-x-auto custom-scrollbar">
                  {sol.code}
                </pre>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 rounded-xl bg-surface-300/30 border border-white/[0.04] text-zinc-500 space-y-1">
            <Code2 className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs font-semibold text-zinc-400">No community solutions yet</p>
            <p className="text-[11px]">Solved this problem? Click &quot;Share Solution&quot; to publish your approach!</p>
          </div>
        )}
      </div>

      {/* Share Solution Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-surface-200 border border-white/[0.1] shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Publish Solution: {problemTitle}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Explain your algorithmic approach and code to help fellow competitive programmers.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSolution} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono font-semibold text-zinc-300">SOLUTION TITLE *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Clean O(N) Hash Table Solution with Intuitive Explanation"
                  className="w-full px-3 py-2 bg-surface-300 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-mono font-semibold text-zinc-300">LANGUAGE</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value as any })}
                    className="w-full px-3 py-2 bg-surface-300 border border-white/[0.08] rounded-xl text-white focus:outline-none"
                  >
                    <option value="CPP">C++ (GCC)</option>
                    <option value="PYTHON">Python 3</option>
                    <option value="JAVA">Java (OpenJDK)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-semibold text-zinc-300">TIME COMPLEXITY</label>
                  <input
                    type="text"
                    value={form.timeComplexity}
                    onChange={(e) => setForm({ ...form, timeComplexity: e.target.value })}
                    placeholder="e.g. O(N) or O(N log N)"
                    className="w-full px-3 py-2 bg-surface-300 border border-white/[0.08] rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-semibold text-zinc-300">SPACE COMPLEXITY</label>
                  <input
                    type="text"
                    value={form.spaceComplexity}
                    onChange={(e) => setForm({ ...form, spaceComplexity: e.target.value })}
                    placeholder="e.g. O(1) or O(N)"
                    className="w-full px-3 py-2 bg-surface-300 border border-white/[0.08] rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-semibold text-zinc-300">EXPLANATION & APPROACH *</label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain why this approach works, the key observation, and step-by-step logic..."
                  className="w-full p-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-semibold text-zinc-300">CODE IMPLEMENTATION *</label>
                <textarea
                  rows={6}
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Paste your verified working solution here..."
                  className="w-full p-2.5 bg-[#060910] border border-white/[0.08] rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-300 text-zinc-300 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Solution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
