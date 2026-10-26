'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Play, 
  Send, 
  RotateCcw, 
  Timer, 
  FileText, 
  BookOpen, 
  History, 
  Copy, 
  Check, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Award,
  Settings2,
  Type,
  SunMoon,
  Zap,
  MessageSquare,
  Code2
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { subscribeToSubmission } from '@/lib/socket'
import CodeEditor, { SupportedLanguage } from '@/components/CodeEditor'
import ProblemEditorial from '@/components/ProblemEditorial'
import ProblemSolutions from '@/components/ProblemSolutions'
import ProblemDiscussion from '@/components/ProblemDiscussion'

interface ProblemDetail {
  id: string
  title: string
  slug: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  description: string
  timeLimit: number
  memoryLimit: number
  inputFormat: string
  outputFormat: string
  constraints: string
  sampleInput: string
  sampleOutput: string
  tags: { id: string; name: string; slug: string }[]
  sampleTestCases: { id: string; input: string; expectedOutput: string; order: number }[]
  submissionCount: number
}

// Starter Code Templates
const codeTemplates: Record<SupportedLanguage, string> = {
  CPP: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input and print solution
    
    return 0;
}`,
  PYTHON: `# Read input from standard input (sys.stdin)
import sys

def solve():
    # Your solution here
    pass

if __name__ == '__main__':
    solve()`,
  JAVA: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
        
    }
}`
}

export default function ProblemDetailPage({ params }: { params: { slug: string } }) {
  const { isAuthenticated, user } = useAuth()
  const [problem, setProblem] = useState<ProblemDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'description' | 'editorial' | 'solutions' | 'discussion' | 'submissions'
  >('description')
  
  // Editor Config & State
  const [language, setLanguage] = useState<SupportedLanguage>('CPP')
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light' | 'hc-black'>('vs-dark')
  const [editorFontSize, setEditorFontSize] = useState<number>(14)
  const [userCode, setUserCode] = useState(codeTemplates.CPP)
  
  // Testcase & Verdict State
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase')
  const [isRunning, setIsRunning] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: string
    runtime: string
    memory: string
    output: string
    error?: string
    isSuccess?: boolean
    ratingBonus?: number
  } | null>(null)

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  const loadSubmissions = useCallback(async () => {
    if (!isAuthenticated) return
    setLoadingSubmissions(true)
    try {
      const data = await api.getProblemSubmissions(params.slug)
      setSubmissions(data || [])
    } catch (err) {
      console.error('Failed to load submissions:', err)
    } finally {
      setLoadingSubmissions(false)
    }
  }, [isAuthenticated, params.slug])

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions()
    }
  }, [activeTab, loadSubmissions])

  // Draft key generator
  const getDraftKey = useCallback((lang: SupportedLanguage) => {
    return `codearena_draft_${params.slug}_${lang}`
  }, [params.slug])

  // Load problem details from Backend DB
  const loadProblem = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getProblem(params.slug)
      setProblem(data)
    } catch (err: any) {
      console.error('Failed to load problem:', err)
      setError(err.message || 'Problem not found in database')
    } finally {
      setIsLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    loadProblem()
  }, [loadProblem])

  // Hydrate code from localStorage draft or template
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draftKey = getDraftKey(language)
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        setUserCode(savedDraft)
      } else {
        setUserCode(codeTemplates[language])
      }
    }
  }, [language, getDraftKey])

  // Handle user typing and auto-save draft
  const handleCodeChange = (newCode: string) => {
    setUserCode(newCode)
    if (typeof window !== 'undefined') {
      const draftKey = getDraftKey(language)
      localStorage.setItem(draftKey, newCode)
    }
  }

  // Reset code draft
  const handleResetCode = () => {
    if (confirm('Reset your code back to the default starter template?')) {
      const draftKey = getDraftKey(language)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(draftKey)
      }
      setUserCode(codeTemplates[language])
    }
  }

  // Practice Timer
  useEffect(() => {
    let interval: any
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Real code run against sample testcase in sandbox
  const handleRunCode = async () => {
    if (!problem) return
    setIsRunning(true)
    setConsoleTab('result')
    try {
      const currentInput = sampleCases[activeTestCase]?.input || problem.sampleInput || ''
      const currentExpected = sampleCases[activeTestCase]?.expectedOutput || problem.sampleOutput || ''
      const res = await api.runCode({
        language,
        code: userCode,
        stdin: currentInput,
        problemId: problem.id,
        expectedOutput: currentExpected,
      })
      const data = res?.data || res
      const isAccepted = data.verdict === 'ACCEPTED'
      setTestResult({
        status: isAccepted
          ? 'Accepted (Sample Evaluation Passed)'
          : data.verdict === 'WRONG_ANSWER'
          ? 'Wrong Answer (Output Mismatch)'
          : data.verdict === 'TIME_LIMIT_EXCEEDED'
          ? 'Time Limit Exceeded'
          : data.verdict === 'COMPILATION_ERROR'
          ? 'Compilation Error'
          : 'Runtime Error',
        runtime: `${data.executionTimeMs} ms`,
        memory: `${(data.memoryUsedKb / 1024).toFixed(1)} MB`,
        output: data.stdout || '(No standard output)',
        error: data.compileOutput || data.diffSummary || data.stderr || undefined,
        isSuccess: isAccepted,
      })
    } catch (err: any) {
      setTestResult({
        status: 'Execution Error',
        runtime: '0 ms',
        memory: '0 MB',
        output: '',
        error: err.message || 'Execution error in sandbox engine',
        isSuccess: false,
      })
    } finally {
      setIsRunning(false)
    }
  }

  // Submit code to backend Online Judge via asynchronous worker queue
  const handleSubmitCode = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to submit your solution to the online judge!')
      return
    }

    if (!problem) return

    setIsRunning(true)
    setConsoleTab('result')
    setTestResult({
      status: 'Queued in Worker Pool...',
      runtime: '--',
      memory: '--',
      output: 'Job enqueued. Waiting for judge worker slot...',
      isSuccess: false,
    })

    try {
      const res = await api.submitCode(problem.id, userCode, language)
      const data = res?.data || res
      const submissionId = data.submissionId || data.id

      if (!submissionId) {
        throw new Error('No submission ID returned from queue')
      }

      // 1. Instant Real-Time WebSocket Channel
      let isCompleted = false
      const unsubscribeSocket = subscribeToSubmission(submissionId, (update: any) => {
        if (isCompleted) return

        if (update.verdict === 'RUNNING') {
          setTestResult((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'Evaluating in Sandbox (Live Socket)...',
                  output: 'Worker executing test cases in isolated sandbox...',
                }
              : null
          )
        } else if (update.verdict && update.verdict !== 'PENDING') {
          isCompleted = true
          clearInterval(pollInterval)
          unsubscribeSocket()
          setIsRunning(false)

          const isAccepted = update.verdict === 'ACCEPTED'
          const statusText = isAccepted
            ? `Accepted (${update.testCasesPassed}/${update.totalTestCases} Test Cases Passed)`
            : `${update.verdict.replace(/_/g, ' ')} (${update.testCasesPassed}/${update.totalTestCases} Passed)`

          setTestResult({
            status: statusText,
            runtime: `${update.runtime ?? 0} ms`,
            memory: `${((update.memory ?? 0) / 1024).toFixed(1)} MB`,
            output: isAccepted
              ? 'All evaluation test cases passed successfully.'
              : update.errorMessage || 'One or more test cases failed.',
            error: isAccepted ? undefined : update.errorMessage,
            isSuccess: isAccepted,
          })

          loadSubmissions()
        }
      })

      // 2. Fallback Polling (in case WebSocket connection dropped)
      const maxAttempts = 40
      let attempts = 0

      const pollInterval = setInterval(async () => {
        if (isCompleted) {
          clearInterval(pollInterval)
          return
        }

        attempts++
        try {
          const statusRes = await api.getSubmissionStatus(submissionId)
          const sub = statusRes?.data || statusRes

          if (sub.verdict === 'RUNNING' && !isCompleted) {
            setTestResult((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'Evaluating in Sandbox...',
                    output: `Worker executing test cases in isolated sandbox...`,
                  }
                : null
            )
          }

          if (
            sub.isFinished ||
            (sub.verdict !== 'PENDING' && sub.verdict !== 'RUNNING') ||
            attempts >= maxAttempts
          ) {
            isCompleted = true
            clearInterval(pollInterval)
            unsubscribeSocket()
            setIsRunning(false)

            const isAccepted = sub.verdict === 'ACCEPTED'
            const statusText = isAccepted
              ? `Accepted (${sub.testCasesPassed}/${sub.totalTestCases} Test Cases Passed)`
              : `${sub.verdict.replace(/_/g, ' ')} (${sub.testCasesPassed}/${sub.totalTestCases} Passed)`

            setTestResult({
              status: statusText,
              runtime: `${sub.runtime ?? 0} ms`,
              memory: `${((sub.memory ?? 0) / 1024).toFixed(1)} MB`,
              output: isAccepted
                ? 'All evaluation test cases passed successfully.'
                : sub.errorMessage || 'One or more test cases failed.',
              error: isAccepted ? undefined : sub.errorMessage,
              isSuccess: isAccepted,
            })

            loadSubmissions()
          }
        } catch (pollErr: any) {
          if (!isCompleted) {
            clearInterval(pollInterval)
            unsubscribeSocket()
            setIsRunning(false)
            console.error('Polling error:', pollErr)
          }
        }
      }, 500)
    } catch (err: any) {
      setIsRunning(false)
      setTestResult({
        status: 'Submission Failed',
        runtime: '0 ms',
        memory: '0 MB',
        output: '',
        error: err.message || 'Judge evaluation failed',
        isSuccess: false,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 font-mono text-sm">Loading problem details from database...</p>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-2xl bg-surface-200 border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Problem Not Found</h2>
        <p className="text-zinc-400 text-sm">
          {error || `The requested problem "${params.slug}" does not exist in the database.`}
        </p>
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Problem Directory</span>
        </Link>
      </div>
    )
  }

  const sampleCases = problem.sampleTestCases && problem.sampleTestCases.length > 0 
    ? problem.sampleTestCases 
    : [{ id: 'sample-1', input: problem.sampleInput || '', expectedOutput: problem.sampleOutput || '', order: 1 }]

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] -mt-4 pb-2">
      
      {/* Top Workstation Header Bar */}
      <div className="flex items-center justify-between py-2 px-2 border-b border-white/[0.08] mb-2 text-xs">
        
        {/* Left: Back Link & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/problems"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-surface-300 border border-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <div className="h-4 w-[1px] bg-white/[0.08] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">{problem.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              problem.difficulty === 'EASY' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : problem.difficulty === 'MEDIUM' 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Right: Timer, Submissions count, Tools */}
        <div className="flex items-center gap-2">
          {/* Practice Timer */}
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-300 border border-white/[0.06] text-zinc-300 font-mono hover:border-white/[0.12] transition-colors"
            title={timerRunning ? 'Pause Timer' : 'Resume Timer'}
          >
            <Timer className={`w-3.5 h-3.5 ${timerRunning ? 'text-brand-400' : 'text-zinc-500'}`} />
            <span>{formatTimer(timerSeconds)}</span>
          </button>

          {/* Submissions Badge */}
          <span className="hidden md:inline font-mono text-[11px] text-zinc-400 px-2 py-1 rounded bg-surface-300 border border-white/[0.06]">
            {problem.submissionCount} submissions
          </span>
        </div>
      </div>

      {/* Main Split Workbench (Left: Problem Context | Right: Monaco Code Editor & Console) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* Left Pane (Description, Editorial, Submissions) - 5 Cols */}
        <div className="lg:col-span-5 flex flex-col rounded-xl bg-surface-200/90 border border-white/[0.08] overflow-hidden">
          
          {/* Left Tab Bar */}
          <div className="flex items-center gap-1 p-1 bg-[#0A0E17] border-b border-white/[0.08]">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'description'
                  ? 'bg-surface-200 text-white shadow-sm border border-white/[0.06]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>Description</span>
            </button>
            <button
              onClick={() => setActiveTab('editorial')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'editorial'
                  ? 'bg-surface-200 text-white shadow-sm border border-white/[0.06]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Editorial</span>
            </button>
            <button
              onClick={() => setActiveTab('solutions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'solutions'
                  ? 'bg-surface-200 text-white shadow-sm border border-white/[0.06]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Solutions</span>
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'discussion'
                  ? 'bg-surface-200 text-white shadow-sm border border-white/[0.06]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Discussion</span>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'submissions'
                  ? 'bg-surface-200 text-white shadow-sm border border-white/[0.06]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Submissions</span>
            </button>
          </div>

          {/* Left Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            {activeTab === 'description' && (
              <>
                {/* Title & Metadata */}
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {problem.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-xs font-mono text-zinc-400">
                    <span>Time Limit: <strong className="text-zinc-200">{problem.timeLimit} ms</strong></span>
                    <span>Memory Limit: <strong className="text-zinc-200">{problem.memoryLimit} MB</strong></span>
                  </div>
                </div>

                {/* Problem Description */}
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line text-[14px]">
                  {problem.description}
                </div>

                {/* Input Format */}
                {problem.inputFormat && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Input Format
                    </h3>
                    <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed bg-[#090D16] p-3 rounded-lg border border-white/[0.06]">
                      {problem.inputFormat}
                    </p>
                  </div>
                )}

                {/* Output Format */}
                {problem.outputFormat && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Output Format
                    </h3>
                    <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed bg-[#090D16] p-3 rounded-lg border border-white/[0.06]">
                      {problem.outputFormat}
                    </p>
                  </div>
                )}

                {/* Sample Test Cases */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Sample Examples
                  </h3>
                  {sampleCases.map((tc, idx) => (
                    <div
                      key={tc.id || idx}
                      className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-zinc-400 font-mono">
                        <span className="font-semibold text-zinc-200">Sample {idx + 1}:</span>
                        <button
                          onClick={() => handleCopy(tc.input, idx)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                      <div className="font-mono space-y-1 text-zinc-300">
                        <div><strong className="text-zinc-500">Input:</strong><pre className="mt-1 p-2 rounded bg-black/40 text-zinc-200">{tc.input}</pre></div>
                        <div><strong className="text-zinc-500">Expected Output:</strong><pre className="mt-1 p-2 rounded bg-black/40 text-emerald-300">{tc.expectedOutput}</pre></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {problem.constraints && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Constraints
                    </h3>
                    <div className="bg-[#090D16] p-3 rounded-xl border border-white/[0.06] text-xs font-mono text-zinc-300 whitespace-pre-line leading-relaxed">
                      {problem.constraints}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {problem.tags && problem.tags.length > 0 && (
                  <div className="pt-4 border-t border-white/[0.06]">
                    <span className="text-xs font-mono text-zinc-500 block mb-2">Algorithm Tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {problem.tags.map((tag) => (
                        <span
                          key={tag.name}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-surface-300 border border-white/[0.06] text-zinc-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'editorial' && (
              <ProblemEditorial problemId={problem.id} problemTitle={problem.title} />
            )}

            {activeTab === 'solutions' && (
              <ProblemSolutions problemId={problem.id} problemTitle={problem.title} />
            )}

            {activeTab === 'discussion' && (
              <ProblemDiscussion problemId={problem.id} />
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-4">
                {!isAuthenticated ? (
                  <div className="text-center py-16 text-zinc-500 space-y-2">
                    <History className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-sm font-semibold text-zinc-300">Sign in to track progress</p>
                    <p className="text-xs">
                      Log in to your CodeArena account to view your live execution history and performance telemetry.
                    </p>
                    <Link
                      href="/login"
                      className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : loadingSubmissions ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono text-zinc-400">Loading submission records...</span>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 space-y-2">
                    <History className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-sm font-semibold text-zinc-300">No submissions yet</p>
                    <p className="text-xs">Write your solution in the editor and click &quot;Submit Solution&quot; to test your code against the judge.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-2">
                      <span>Recent Submissions ({submissions.length})</span>
                      <button
                        onClick={loadSubmissions}
                        className="hover:text-white transition-colors"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="space-y-2">
                      {submissions.map((sub) => {
                        const isAcc = sub.verdict === 'ACCEPTED'
                        return (
                          <div
                            key={sub.id}
                            className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
                              isAcc
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-rose-500/5 border-rose-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-bold flex items-center gap-1.5 ${
                                  isAcc ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isAcc ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                {sub.verdict.replace(/_/g, ' ')}
                              </span>
                              <span className="text-zinc-500 text-[11px]">
                                {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400">
                              <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-medium">
                                {sub.language}
                              </span>
                              <span>Passed: {sub.testCasesPassed}/{sub.totalTestCases}</span>
                              {sub.runtime !== null && <span>Runtime: {sub.runtime} ms</span>}
                              {sub.memory !== null && <span>Memory: {(sub.memory / 1024).toFixed(1)} MB</span>}
                            </div>

                            {sub.errorMessage && !isAcc && (
                              <div className="mt-2 text-[10px] text-rose-300 bg-black/40 p-1.5 rounded truncate">
                                {sub.errorMessage}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane (Monaco Code Editor & Execution Console) - 7 Cols */}
        <div className="lg:col-span-7 flex flex-col rounded-xl bg-[#0A0E17] border border-white/[0.08] overflow-hidden">
          
          {/* Monaco Editor Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#101622] border-b border-white/[0.08]">
            
            {/* Left Controls: Language Selector */}
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="bg-surface-300 border border-white/[0.08] text-white text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="CPP">C++ (GCC 13.2)</option>
                <option value="PYTHON">Python 3.12</option>
                <option value="JAVA">Java 21</option>
              </select>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                VS Code Engine Active
              </span>
            </div>

            {/* Right Controls: Theme, Font Size, Reset */}
            <div className="flex items-center gap-2">
              {/* Font Size Selector */}
              <div className="flex items-center gap-1 bg-surface-300 border border-white/[0.06] rounded-lg px-2 py-1 text-xs text-zinc-300">
                <Type className="w-3 h-3 text-zinc-400" />
                <select
                  value={editorFontSize}
                  onChange={(e) => setEditorFontSize(Number(e.target.value))}
                  className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
                >
                  <option value={12} className="bg-surface-300">12px</option>
                  <option value={14} className="bg-surface-300">14px</option>
                  <option value={16} className="bg-surface-300">16px</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-1 bg-surface-300 border border-white/[0.06] rounded-lg px-2 py-1 text-xs text-zinc-300">
                <SunMoon className="w-3 h-3 text-zinc-400" />
                <select
                  value={editorTheme}
                  onChange={(e) => setEditorTheme(e.target.value as any)}
                  className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
                >
                  <option value="vs-dark" className="bg-surface-300">Dark</option>
                  <option value="hc-black" className="bg-surface-300">High Contrast</option>
                  <option value="light" className="bg-surface-300">Light</option>
                </select>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetCode}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.04] transition-colors"
                title="Reset to starter template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[300px] relative bg-[#0D1117] overflow-hidden">
            <CodeEditor
              language={language}
              value={userCode}
              onChange={handleCodeChange}
              fontSize={editorFontSize}
              theme={editorTheme}
              onRun={handleRunCode}
            />
          </div>

          {/* Bottom Execution Console Drawer */}
          <div className="border-t border-white/[0.08] bg-[#0E1524] flex flex-col">
            
            {/* Console Tabs */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#121A2B] border-b border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleTab('testcase')}
                  className={`px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                    consoleTab === 'testcase' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Test Cases ({sampleCases.length})
                </button>
                <button
                  onClick={() => setConsoleTab('result')}
                  className={`px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                    consoleTab === 'result' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Verdict & Output
                </button>
              </div>

              {testResult && (
                <div className={`flex items-center gap-1.5 font-mono text-[11px] ${
                  testResult.isSuccess ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    testResult.isSuccess ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                  <span className="truncate max-w-[200px]">{testResult.status}</span>
                </div>
              )}
            </div>

            {/* Console Drawer Body */}
            <div className="p-4 max-h-52 overflow-y-auto font-mono text-xs text-zinc-300">
              {consoleTab === 'testcase' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {sampleCases.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTestCase(i)}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          activeTestCase === i
                            ? 'bg-surface-100 text-white font-semibold'
                            : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Sample {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0A0E17] border border-white/[0.06] space-y-1">
                    <div className="text-zinc-400 text-[11px]">Input:</div>
                    <pre className="text-zinc-200 whitespace-pre-wrap">{sampleCases[activeTestCase]?.input}</pre>
                  </div>
                </div>
              )}

              {consoleTab === 'result' && (
                <div>
                  {isRunning ? (
                    <div className="flex items-center gap-2.5 text-brand-300 py-3">
                      <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      <span>Executing in sandbox environment...</span>
                    </div>
                  ) : testResult ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          {testResult.isSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span className={`font-bold text-sm ${testResult.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {testResult.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span>Runtime: <strong className="text-zinc-200">{testResult.runtime}</strong></span>
                          <span>Memory: <strong className="text-zinc-200">{testResult.memory}</strong></span>
                        </div>
                      </div>

                      {testResult.error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block">
                            Diagnostics & Feedback:
                          </span>
                          <pre className="text-xs whitespace-pre-wrap font-mono">{testResult.error}</pre>
                        </div>
                      )}

                      {testResult.output && (
                        <div className="p-2.5 rounded-lg bg-[#080B12] border border-white/[0.06] space-y-1">
                          <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">Standard Output:</span>
                          <pre className="text-zinc-200 whitespace-pre-wrap font-mono">{testResult.output}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-500 py-2">
                      Click &quot;Run&quot; or press <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-zinc-300">Ctrl+Enter</kbd> to test with sample inputs, or &quot;Submit&quot; to evaluate against the complete test suite.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="px-4 py-3 bg-[#0A0E17] border-t border-white/[0.08] flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-mono hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300">Ctrl + Enter</kbd> to Run
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-300 hover:bg-surface-100 text-zinc-200 font-semibold text-xs border border-white/[0.08] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Run Sample</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs shadow-glow-emerald transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Solution</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
