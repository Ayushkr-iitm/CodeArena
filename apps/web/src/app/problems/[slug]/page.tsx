'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Play, 
  Send, 
  RotateCcw, 
  Timer, 
  ThumbsUp, 
  Star, 
  Share2, 
  Maximize2, 
  CheckCircle2, 
  FileText, 
  BookOpen, 
  History, 
  MessageSquare,
  Copy,
  Check,
  Terminal,
  Settings2,
  Sparkles
} from 'lucide-react'

export default function ProblemDetailPage({ params }: { params: { slug: string } }) {
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions' | 'discussions'>('description')
  const [language, setLanguage] = useState<'cpp' | 'python' | 'java'>('cpp')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase')
  const [isRunning, setIsRunning] = useState(false)
  const [testResult, setTestResult] = useState<{ status: string; runtime: string; memory: string; output: string } | null>(null)

  // Starter code templates
  const codeTemplates = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
    java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`
  }

  const [userCode, setUserCode] = useState(codeTemplates.cpp)

  useEffect(() => {
    setUserCode(codeTemplates[language])
  }, [language])

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

  // Mock problem data
  const problem = {
    id: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    acceptance: '52.8%',
    timeLimit: '2000 ms',
    memoryLimit: '256 MB',
    likes: 4820,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'nums[0] + nums[0] would be using the same element, so we use index 0 and 1.'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    tags: ['Arrays', 'Hash Table', 'Two Pointers']
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleRunCode = () => {
    setIsRunning(true)
    setConsoleTab('result')
    setTimeout(() => {
      setIsRunning(false)
      setTestResult({
        status: 'Accepted',
        runtime: '14 ms',
        memory: '10.8 MB',
        output: '[0, 1]'
      })
    }, 600)
  }

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
            <span className="hidden sm:inline">All Problems</span>
          </Link>

          <div className="h-4 w-[1px] bg-white/[0.08] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-400 font-medium">#{problem.id}.</span>
            <span className="font-bold text-sm text-white">{problem.title}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Right: Timer, Likes, Tools */}
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

          {/* Like Button */}
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-300 border border-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{problem.likes}</span>
          </button>

          {/* Star Button */}
          <button className="p-1.5 rounded-lg bg-surface-300 border border-white/[0.06] text-zinc-400 hover:text-amber-400 transition-colors">
            <Star className="w-3.5 h-3.5" />
          </button>
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
                    {problem.id}. {problem.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-xs font-mono text-zinc-400">
                    <span>Time Limit: <strong className="text-zinc-200">{problem.timeLimit}</strong></span>
                    <span>Memory: <strong className="text-zinc-200">{problem.memoryLimit}</strong></span>
                    <span>Acceptance: <strong className="text-zinc-200">{problem.acceptance}</strong></span>
                  </div>
                </div>

                {/* Body Text */}
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line text-[13.5px]">
                  {problem.description}
                </div>

                {/* Examples */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Examples
                  </h3>
                  {problem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-zinc-400 font-mono">
                        <span className="font-semibold text-zinc-200">Example {idx + 1}:</span>
                        <button
                          onClick={() => handleCopy(ex.input, idx)}
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
                        <div><strong className="text-zinc-500">Input:</strong> {ex.input}</div>
                        <div><strong className="text-zinc-500">Output:</strong> {ex.output}</div>
                        {ex.explanation && (
                          <div className="text-zinc-400 pt-1 border-t border-white/[0.04]">
                            <strong className="text-zinc-500">Explanation:</strong> {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Constraints
                  </h3>
                  <ul className="space-y-1.5 font-mono text-xs text-zinc-300">
                    {problem.constraints.map((c, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-brand-400" />
                        <code className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-brand-300">
                          {c}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Topics & Tags */}
                <div className="pt-4 border-t border-white/[0.06]">
                  <span className="text-xs font-mono text-zinc-500 block mb-2">Related Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-surface-300 border border-white/[0.06] text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'editorial' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  💡 <strong>Optimal Approach: Hash Map O(N)</strong>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  A brute force approach checks every pair of numbers with nested loops in O(N²) time. By utilizing a hash table to store already seen elements and their indices, we can locate the complement in O(1) time per element.
                </p>
                <div className="font-mono text-xs text-zinc-300 space-y-1">
                  <div><strong>Time Complexity:</strong> O(N)</div>
                  <div><strong>Space Complexity:</strong> O(N)</div>
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="text-center py-16 text-zinc-500 space-y-2">
                <History className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-300">No Submissions Yet</p>
                <p className="text-xs">Submit your solution using the editor on the right to see your verdict history.</p>
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
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-surface-300 border border-white/[0.08] text-white text-xs font-mono font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="cpp">C++ (GCC 13.2)</option>
                <option value="python">Python 3.12</option>
                <option value="java">Java 21</option>
              </select>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 hidden sm:inline">
                Monaco IDE Mode
              </span>
            </div>

            {/* Editor Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setUserCode(codeTemplates[language])}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.04] transition-colors"
                title="Reset to starter template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
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
                  Test Cases
                </button>
                <button
                  onClick={() => setConsoleTab('result')}
                  className={`px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                    consoleTab === 'result' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Test Result
                </button>
              </div>

              {testResult && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{testResult.status} ({testResult.runtime})</span>
                </div>
              )}
            </div>

            {/* Console Drawer Body */}
            <div className="p-4 max-h-36 overflow-y-auto font-mono text-xs text-zinc-300">
              {consoleTab === 'testcase' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {problem.examples.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTestCase(i)}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          activeTestCase === i
                            ? 'bg-surface-100 text-white font-semibold'
                            : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Case {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0A0E17] border border-white/[0.06] space-y-1">
                    <div className="text-zinc-400 text-[11px]">Input:</div>
                    <div className="text-zinc-200">{problem.examples[activeTestCase].input}</div>
                  </div>
                </div>
              )}

              {consoleTab === 'result' && (
                <div>
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-brand-300 py-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      <span>Compiling and executing in sandbox...</span>
                    </div>
                  ) : testResult ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400 text-sm">{testResult.status}</span>
                        <span className="text-zinc-400">Runtime: {testResult.runtime}</span>
                        <span className="text-zinc-400">Memory: {testResult.memory}</span>
                      </div>
                      <div className="p-2 rounded bg-[#0A0E17] border border-white/[0.06]">
                        <span className="text-zinc-500 block text-[10px]">Output:</span>
                        <span className="text-zinc-200">{testResult.output}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 py-2">
                      Press "Run" to test with sample inputs, or "Submit" for full evaluation.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Buttons Bar */}
            <div className="px-4 py-3 bg-[#0A0E17] border-t border-white/[0.08] flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-mono hidden sm:block">
                Ctrl + Enter to Run
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-300 hover:bg-surface-100 text-zinc-200 font-semibold text-xs border border-white/[0.08] transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Run</span>
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs shadow-glow-emerald transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
