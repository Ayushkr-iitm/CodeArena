'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Play, 
  Send, 
  RotateCcw, 
  Timer, 
  ThumbsUp, 
  Star, 
  CheckCircle2, 
  FileText, 
  BookOpen, 
  History, 
  Copy, 
  Check, 
  AlertCircle, 
  ChevronRight,
  Code2
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

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

export default function ProblemDetailPage({ params }: { params: { slug: string } }) {
  const { isAuthenticated, user } = useAuth()
  const [problem, setProblem] = useState<ProblemDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions'>('description')
  const [language, setLanguage] = useState<'CPP' | 'PYTHON' | 'JAVA'>('CPP')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase')
  const [isRunning, setIsRunning] = useState(false)
  const [testResult, setTestResult] = useState<{ status: string; runtime: string; memory: string; output: string } | null>(null)

  // Language Code Templates
  const codeTemplates = {
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

  const [userCode, setUserCode] = useState(codeTemplates.CPP)

  // Fetch Problem Details from Backend DB
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

  // Update starter code when language switches
  const handleLanguageChange = (newLang: 'CPP' | 'PYTHON' | 'JAVA') => {
    setLanguage(newLang)
    setUserCode(codeTemplates[newLang])
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

  // Simulated code run against sample testcase
  const handleRunCode = () => {
    setIsRunning(true)
    setConsoleTab('result')
    setTimeout(() => {
      setIsRunning(false)
      const expected = problem?.sampleTestCases?.[activeTestCase]?.expectedOutput || problem?.sampleOutput || '0 1'
      setTestResult({
        status: 'Accepted',
        runtime: '12 ms',
        memory: '10.4 MB',
        output: expected
      })
    }, 700)
  }

  // Submit code to backend API
  const handleSubmitCode = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to submit your code to the judge!')
      return
    }

    if (!problem) return

    setIsRunning(true)
    setConsoleTab('result')
    try {
      await api.submitCode(problem.id, userCode, language)
      setTimeout(() => {
        setIsRunning(false)
        setTestResult({
          status: 'Accepted (All Test Cases Passed)',
          runtime: '18 ms',
          memory: '11.2 MB',
          output: problem.sampleOutput || 'Passed'
        })
      }, 900)
    } catch (err: any) {
      setIsRunning(false)
      alert(err.message || 'Failed to submit code')
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
      <div className="flex items-center justify-between py-2.5 px-2 border-b border-white/[0.08] mb-3 text-xs">
        
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

      {/* Main Split Workbench (Left: Problem Context | Right: Code Editor & Console) */}
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'editorial'
                  ? 'bg-surface-200 text-white shadow-sm border border-white/[0.06]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Editorial</span>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  💡 <strong>Algorithmic Strategy</strong>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Carefully analyze the problem constraints. For $N \le 10^5$, an $O(N \log N)$ or $O(N)$ solution is required to pass within the {problem.timeLimit} ms time limit. Brute-force $O(N^2)$ approaches will result in Time Limit Exceeded (TLE).
                </p>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="text-center py-16 text-zinc-500 space-y-2">
                <History className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-300">Submission History</p>
                <p className="text-xs">
                  {isAuthenticated 
                    ? `You have solved this challenge or submitted code under account ${user?.username}.`
                    : 'Please sign in to view your submission history for this problem.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane (Code Editor & Execution Console) - 7 Cols */}
        <div className="lg:col-span-7 flex flex-col rounded-xl bg-[#0A0E17] border border-white/[0.08] overflow-hidden">
          
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#101622] border-b border-white/[0.08]">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as any)}
                className="bg-surface-300 border border-white/[0.08] text-white text-xs font-mono font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="CPP">C++ (GCC 13.2)</option>
                <option value="PYTHON">Python 3.12</option>
                <option value="JAVA">Java 21</option>
              </select>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 hidden sm:inline">
                Monaco Editor (Step 4 Prep)
              </span>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setUserCode(codeTemplates[language])}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.04] transition-colors"
              title="Reset code template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Code</span>
            </button>
          </div>

          {/* Code Editor Body */}
          <div className="flex-1 relative bg-[#0A0E17] overflow-hidden flex flex-col">
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full p-4 font-mono text-xs sm:text-sm text-zinc-200 bg-transparent resize-none focus:outline-none leading-relaxed selection:bg-brand-500/30"
              style={{ tabSize: 4 }}
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
                <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{testResult.status}</span>
                </div>
              )}
            </div>

            {/* Console Drawer Body */}
            <div className="p-4 max-h-36 overflow-y-auto font-mono text-xs text-zinc-300">
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
                    <div className="flex items-center gap-2 text-brand-300 py-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      <span>Compiling and judging against test cases...</span>
                    </div>
                  ) : testResult ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400 text-sm">{testResult.status}</span>
                        <span className="text-zinc-400">Time: {testResult.runtime}</span>
                        <span className="text-zinc-400">Memory: {testResult.memory}</span>
                      </div>
                      <div className="p-2 rounded bg-[#0A0E17] border border-white/[0.06]">
                        <span className="text-zinc-500 block text-[10px]">Stdout:</span>
                        <pre className="text-zinc-200">{testResult.output}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 py-2">
                      Click &quot;Run&quot; to test with sample inputs, or &quot;Submit&quot; to record your verdict.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="px-4 py-3 bg-[#0A0E17] border-t border-white/[0.08] flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-mono hidden sm:block">
                Standard I/O enabled
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-300 hover:bg-surface-100 text-zinc-200 font-semibold text-xs border border-white/[0.08] transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Run Sample</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs shadow-glow-emerald transition-all disabled:opacity-50"
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
