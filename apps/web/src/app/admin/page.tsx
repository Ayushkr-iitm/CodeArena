'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft,
  X,
  FileCode,
  Layers,
  Clock,
  HardDrive,
  Trophy,
  Calendar,
  Users
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface TestCaseItem {
  input: string
  expectedOutput: string
  isSample: boolean
  order: number
}

interface AdminProblem {
  id: string
  title: string
  slug: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  isPublished: boolean
  timeLimit: number
  memoryLimit: number
  totalTestCases: number
  submissionCount: number
  tags: { id: string; name: string; slug: string }[]
  createdAt: string
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth()
  const [viewTab, setViewTab] = useState<'problems' | 'contests'>('problems')
  const [problems, setProblems] = useState<AdminProblem[]>([])
  const [contests, setContests] = useState<any[]>([])
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isContestModalOpen, setIsContestModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form State for new problem
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    timeLimit: 2000,
    memoryLimit: 256,
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    isPublished: true,
    tagsInput: 'Arrays, Algorithms',
  })

  // Form State for new contest
  const [contestForm, setContestForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  })
  const [contestProblemsSelection, setContestProblemsSelection] = useState<
    { problemId: string; points: number }[]
  >([])

  // Testcases for new problem
  const [testCases, setTestCases] = useState<TestCaseItem[]>([
    { input: '', expectedOutput: '', isSample: true, order: 1 },
    { input: '', expectedOutput: '', isSample: false, order: 2 },
  ])

  // Load all problems and contests for admin
  const loadAdminData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [problemList, tagList, contestList] = await Promise.all([
        api.getAdminProblems(),
        api.getAllTags().catch(() => []),
        api.getContests().catch(() => []),
      ])
      setProblems(problemList || [])
      setTags(tagList || [])
      setContests(contestList || [])
    } catch (err: any) {
      console.error('Failed to load admin data:', err)
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch admin data' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData()
    }
  }, [isAuthenticated, isAdmin, loadAdminData])

  // Toggle problem publish status
  const handleTogglePublish = async (id: string) => {
    try {
      await api.togglePublish(id)
      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPublished: !p.isPublished } : p))
      )
      setFeedback({ type: 'success', message: 'Problem visibility updated' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle visibility' })
    }
  }

  // Delete problem
  const handleDeleteProblem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return

    try {
      await api.deleteProblem(id)
      setProblems((prev) => prev.filter((p) => p.id !== id))
      setFeedback({ type: 'success', message: `Deleted "${title}" successfully` })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete problem' })
    }
  }

  // Delete contest
  const handleDeleteContest = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete contest "${title}"? This cannot be undone.`)) return

    try {
      await api.deleteContest(id)
      setContests((prev) => prev.filter((c) => c.id !== id))
      setFeedback({ type: 'success', message: `Deleted contest "${title}" successfully` })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete contest' })
    }
  }

  // Create contest
  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contestForm.title || !contestForm.startTime || !contestForm.endTime) {
      alert('Please fill out all required fields')
      return
    }
    if (contestProblemsSelection.length === 0) {
      alert('Please select at least one problem for the contest')
      return
    }

    setIsSubmitting(true)
    try {
      await api.createContest({
        title: contestForm.title,
        description: contestForm.description,
        startTime: new Date(contestForm.startTime).toISOString(),
        endTime: new Date(contestForm.endTime).toISOString(),
        problems: contestProblemsSelection.map((p, idx) => ({
          problemId: p.problemId,
          points: Number(p.points) || 100,
          order: idx + 1,
        })),
      })
      setIsContestModalOpen(false)
      setContestForm({ title: '', description: '', startTime: '', endTime: '' })
      setContestProblemsSelection([])
      loadAdminData()
      setFeedback({ type: 'success', message: 'Contest created successfully!' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create contest' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add test case row in modal
  const addTestCase = (isSample: boolean) => {
    setTestCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isSample, order: prev.length + 1 },
    ])
  }

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTestCase = (index: number, field: 'input' | 'expectedOutput' | 'isSample', value: any) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    )
  }

  // Create problem submission
  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const parsedTags = formData.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        title: formData.title,
        difficulty: formData.difficulty,
        timeLimit: Number(formData.timeLimit),
        memoryLimit: Number(formData.memoryLimit),
        description: formData.description,
        inputFormat: formData.inputFormat,
        outputFormat: formData.outputFormat,
        constraints: formData.constraints,
        sampleInput: formData.sampleInput,
        sampleOutput: formData.sampleOutput,
        isPublished: formData.isPublished,
        tags: parsedTags,
        testCases: testCases.filter((tc) => tc.input.trim() || tc.expectedOutput.trim()),
      }

      await api.createProblem(payload)
      setFeedback({ type: 'success', message: `Problem "${formData.title}" created successfully!` })
      setIsModalOpen(false)
      // Reset form
      setFormData({
        title: '',
        difficulty: 'MEDIUM',
        timeLimit: 2000,
        memoryLimit: 256,
        description: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        sampleInput: '',
        sampleOutput: '',
        isPublished: true,
        tagsInput: 'Arrays, Algorithms',
      })
      loadAdminData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create problem' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Guard: Not Admin
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface-200 border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
        <p className="text-zinc-400 text-sm">
          You must be signed in with an <strong>ADMIN</strong> account to access the Problem Management Dashboard.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors"
          >
            <span>Sign in as Admin</span>
          </Link>
        </div>
      </div>
    )
  }

  const publishedCount = problems.filter((p) => p.isPublished).length
  const draftCount = problems.length - publishedCount

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 text-xs font-semibold mb-2 border border-brand-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            Admin Control Center
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {viewTab === 'problems' ? 'Problem Management' : 'Contest Management'}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {viewTab === 'problems'
              ? 'Create, configure test cases, and manage algorithmic problems stored in the judge database.'
              : 'Create competitive programming contests, configure problem rosters, and manage schedules.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {viewTab === 'problems' ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm shadow-glow-brand transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Problem</span>
            </button>
          ) : (
            <button
              onClick={() => setIsContestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-sm shadow-glow-emerald transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Contest</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setViewTab('problems')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            viewTab === 'problems'
              ? 'bg-brand-600 text-white shadow-glow-brand'
              : 'bg-surface-200 text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Problems ({problems.length})</span>
        </button>

        <button
          onClick={() => setViewTab('contests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            viewTab === 'contests'
              ? 'bg-brand-600 text-white shadow-glow-brand'
              : 'bg-surface-200 text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Contests ({contests.length})</span>
        </button>
      </div>

      {/* Metrics Row */}
      {viewTab === 'problems' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface-200 border border-white/[0.08] flex flex-col">
            <span className="text-xs uppercase font-semibold text-zinc-400">Total Problems</span>
            <span className="text-3xl font-black text-white mt-1">{problems.length}</span>
          </div>
          <div className="p-5 rounded-2xl bg-surface-200 border border-emerald-500/20 flex flex-col">
            <span className="text-xs uppercase font-semibold text-emerald-400">Published</span>
            <span className="text-3xl font-black text-emerald-400 mt-1">{publishedCount}</span>
          </div>
          <div className="p-5 rounded-2xl bg-surface-200 border border-amber-500/20 flex flex-col">
            <span className="text-xs uppercase font-semibold text-amber-400">Drafts</span>
            <span className="text-3xl font-black text-amber-400 mt-1">{draftCount}</span>
          </div>
          <div className="p-5 rounded-2xl bg-surface-200 border border-brand-500/20 flex flex-col">
            <span className="text-xs uppercase font-semibold text-brand-400">Total Test Cases</span>
            <span className="text-3xl font-black text-brand-400 mt-1">
              {problems.reduce((acc, p) => acc + (p.totalTestCases || 0), 0)}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface-200 border border-white/[0.08] flex flex-col">
            <span className="text-xs uppercase font-semibold text-zinc-400">Total Contests</span>
            <span className="text-3xl font-black text-white mt-1">{contests.length}</span>
          </div>
          <div className="p-5 rounded-2xl bg-surface-200 border border-emerald-500/20 flex flex-col">
            <span className="text-xs uppercase font-semibold text-emerald-400">Live Now</span>
            <span className="text-3xl font-black text-emerald-400 mt-1">
              {contests.filter((c) => c.status === 'RUNNING').length}
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-surface-200 border border-cyan-500/20 flex flex-col">
            <span className="text-xs uppercase font-semibold text-cyan-400">Upcoming</span>
            <span className="text-3xl font-black text-cyan-400 mt-1">
              {contests.filter((c) => c.status === 'UPCOMING').length}
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-surface-200 border border-purple-500/20 flex flex-col">
            <span className="text-xs uppercase font-semibold text-purple-400">Completed</span>
            <span className="text-3xl font-black text-purple-400 mt-1">
              {contests.filter((c) => c.status === 'ENDED').length}
            </span>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content Table: Problems vs Contests */}
      {viewTab === 'problems' ? (
        <div className="rounded-2xl border border-white/[0.1] bg-surface-200/90 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">
            Database Problems ({problems.length})
          </h2>
          <button
            onClick={loadAdminData}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-surface-300/80 text-zinc-400 text-xs font-mono uppercase tracking-wider">
                <th className="py-4 px-6">Problem</th>
                <th className="py-4 px-6 w-32">Difficulty</th>
                <th className="py-4 px-6 w-32">Limits</th>
                <th className="py-4 px-6 w-32">Test Cases</th>
                <th className="py-4 px-6 w-32 text-center">Status</th>
                <th className="py-4 px-6 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading problems from database...</span>
                  </td>
                </tr>
              ) : problems.length > 0 ? (
                problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Title & Slug */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{problem.title}</span>
                      </div>
                      <div className="text-xs font-mono text-zinc-500 mt-0.5">/{problem.slug}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {problem.tags && problem.tags.map((t) => (
                          <span key={t.name} className="text-[10px] px-2 py-0.5 rounded bg-surface-400 text-zinc-400 border border-white/[0.06]">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        problem.difficulty === 'EASY'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : problem.difficulty === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>

                    {/* Limits */}
                    <td className="py-4 px-6 font-mono text-xs text-zinc-300">
                      <div>{problem.timeLimit} ms</div>
                      <div className="text-zinc-500">{problem.memoryLimit} MB</div>
                    </td>

                    {/* Test Cases Count */}
                    <td className="py-4 px-6 font-mono text-xs text-zinc-300">
                      <span className="px-2 py-1 rounded bg-surface-300 border border-white/[0.06]">
                        {problem.totalTestCases} cases
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleTogglePublish(problem.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          problem.isPublished
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600 hover:bg-zinc-700'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {problem.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/problems/${problem.slug}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300 transition-colors"
                          title="View Problem in Editor"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProblem(problem.id, problem.title)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          title="Delete Problem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No problems created yet. Click &quot;Create New Problem&quot; above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.1] bg-surface-200/90 overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">
              Contest Roster ({contests.length})
            </h2>
            <button
              onClick={loadAdminData}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300 transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-300/80 text-zinc-400 text-xs font-mono uppercase tracking-wider">
                  <th className="py-4 px-6">Contest</th>
                  <th className="py-4 px-6 w-32 text-center">Status</th>
                  <th className="py-4 px-6 w-52">Window</th>
                  <th className="py-4 px-6 w-28 text-center">Problems</th>
                  <th className="py-4 px-6 w-28 text-center">Participants</th>
                  <th className="py-4 px-6 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Loading contests from database...</span>
                    </td>
                  </tr>
                ) : contests.length > 0 ? (
                  contests.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{c.title}</span>
                        </div>
                        <div className="text-xs font-mono text-zinc-500 mt-0.5">/{c.slug}</div>
                        {c.description && (
                          <div className="text-xs text-zinc-400 line-clamp-1 mt-1">
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          c.status === 'RUNNING'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : c.status === 'UPCOMING'
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {c.status === 'RUNNING' ? '● Live' : c.status === 'UPCOMING' ? 'Upcoming' : 'Ended'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-zinc-400 space-y-1">
                        <div><strong className="text-zinc-300">Start:</strong> {new Date(c.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        <div><strong className="text-zinc-300">End:</strong> {new Date(c.endTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-zinc-300">
                        {c.problemCount ?? 0}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-zinc-300">
                        {c.participantCount ?? 0}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/contests/${c.slug}`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300 transition-colors"
                            title="View Contest Arena"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteContest(c.id, c.title)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Delete Contest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      No contests created yet. Click &quot;Create New Contest&quot; above to launch one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Problem Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 rounded-2xl bg-surface-200 border border-white/[0.1] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-brand-400" />
                  Create New Coding Problem
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Add full problem specifications and test cases to the judge database.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProblem} className="space-y-6 text-sm">
              
              {/* Row 1: Title & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300">PROBLEM TITLE *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Invert Binary Tree"
                    className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300">DIFFICULTY</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Time & Memory Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    TIME LIMIT (MS)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    required
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                    MEMORY LIMIT (MB)
                  </label>
                  <input
                    type="number"
                    min={16}
                    step={16}
                    required
                    value={formData.memoryLimit}
                    onChange={(e) => setFormData({ ...formData, memoryLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-zinc-300">DESCRIPTION (MARKDOWN SUPPORTED) *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain the problem statement clearly..."
                  className="w-full p-3 bg-surface-300 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Input & Output Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300">INPUT FORMAT</label>
                  <textarea
                    rows={2}
                    value={formData.inputFormat}
                    onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                    placeholder="e.g. First line contains integer n..."
                    className="w-full p-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300">OUTPUT FORMAT</label>
                  <textarea
                    rows={2}
                    value={formData.outputFormat}
                    onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                    placeholder="e.g. Print the answer on a single line..."
                    className="w-full p-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Constraints */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-zinc-300">CONSTRAINTS</label>
                <textarea
                  rows={2}
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  placeholder="e.g. 1 <= n <= 10^5&#10;-10^9 <= a[i] <= 10^9"
                  className="w-full p-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white text-xs font-mono placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-zinc-300">TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={formData.tagsInput}
                  onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                  placeholder="Arrays, Binary Search, Dynamic Programming"
                  className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Test Cases Builder */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                    Test Cases Evaluation Suite ({testCases.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addTestCase(true)}
                      className="px-2.5 py-1 rounded-lg bg-surface-300 text-xs text-brand-300 hover:text-white border border-white/[0.06]"
                    >
                      + Sample Case
                    </button>
                    <button
                      type="button"
                      onClick={() => addTestCase(false)}
                      className="px-2.5 py-1 rounded-lg bg-surface-300 text-xs text-zinc-300 hover:text-white border border-white/[0.06]"
                    >
                      + Hidden Case
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar p-1">
                  {testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-300 border border-white/[0.06] space-y-2 relative"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-zinc-300">
                          Case #{idx + 1} ({tc.isSample ? 'Sample' : 'Hidden Evaluation'})
                        </span>
                        {testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestCase(idx)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">STDIN:</span>
                          <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                            placeholder="Input..."
                            className="w-full p-2 bg-[#090D16] border border-white/[0.06] rounded-lg text-white font-mono text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">EXPECTED STDOUT:</span>
                          <textarea
                            rows={2}
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCase(idx, 'expectedOutput', e.target.value)}
                            placeholder="Expected Output..."
                            className="w-full p-2 bg-[#090D16] border border-white/[0.06] rounded-lg text-white font-mono text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish Checkbox & Action Buttons */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded bg-surface-300 border-white/[0.1] text-brand-500 focus:ring-brand-500"
                  />
                  <span>Publish immediately to problem directory</span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-300 hover:bg-surface-100 text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold shadow-glow-brand transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving Problem...' : 'Create Problem'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Contest Modal */}
      {isContestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-surface-200 border border-white/[0.1] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  Launch New Contest
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Schedule a competitive programming contest and configure problem roster.
                </p>
              </div>
              <button
                onClick={() => setIsContestModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateContest} className="space-y-6 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-zinc-300">CONTEST TITLE *</label>
                <input
                  type="text"
                  required
                  value={contestForm.title}
                  onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                  placeholder="e.g. CodeArena Weekly Cup #4"
                  className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-zinc-300">DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={contestForm.description}
                  onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
                  placeholder="Brief description or rules of the contest..."
                  className="w-full p-3 bg-surface-300 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    START TIME *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.startTime}
                    onChange={(e) => setContestForm({ ...contestForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    END TIME *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.endTime}
                    onChange={(e) => setContestForm({ ...contestForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-300 border border-white/[0.08] rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Problem Selection Suite */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase block">
                  Contest Problem Roster ({contestProblemsSelection.length} Selected)
                </label>

                {/* Add Problem dropdown */}
                <div className="flex gap-2">
                  <select
                    id="problemSelector"
                    className="flex-1 px-3 py-2 bg-surface-300 border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a problem to add...</option>
                    {problems
                      .filter((p) => !contestProblemsSelection.some((sel) => sel.problemId === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.difficulty})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('problemSelector') as HTMLSelectElement
                      if (sel && sel.value) {
                        setContestProblemsSelection((prev) => [
                          ...prev,
                          { problemId: sel.value, points: 100 },
                        ])
                        sel.value = ''
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-surface-300 hover:bg-surface-400 text-xs font-semibold text-emerald-400 border border-emerald-500/30"
                  >
                    + Add to Contest
                  </button>
                </div>

                {/* Selected Problems List */}
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {contestProblemsSelection.map((item, idx) => {
                    const prob = problems.find((p) => p.id === item.problemId)
                    return (
                      <div
                        key={item.problemId}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-300 border border-white/[0.06] text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-zinc-500">#{idx + 1}</span>
                          <div>
                            <span className="font-semibold text-white">{prob?.title || item.problemId}</span>
                            <span className="text-[10px] text-zinc-400 ml-2">({prob?.difficulty})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-zinc-400">Points:</span>
                            <input
                              type="number"
                              min={10}
                              step={10}
                              value={item.points}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 100
                                setContestProblemsSelection((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, points: val } : p))
                                )
                              }}
                              className="w-16 px-2 py-1 bg-[#090D16] border border-white/[0.08] rounded text-white font-mono text-xs text-center"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setContestProblemsSelection((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {contestProblemsSelection.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 text-xs">
                      No problems selected yet. Select a problem above to add it to the contest.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsContestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-300 hover:bg-surface-100 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-glow-emerald transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Launching Contest...' : 'Schedule Contest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
