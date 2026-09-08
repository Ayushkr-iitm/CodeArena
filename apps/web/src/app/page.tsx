'use client'

import Link from 'next/link'
import { 
  Terminal, 
  Cpu, 
  Trophy, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Flame, 
  Code2, 
  Timer, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react'

export default function Home() {
  return (
    <div className="relative -mt-8 pb-20 overflow-hidden">
      
      {/* Background Ambient Glows & Dot Grid */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-96 right-10 w-[400px] h-[300px] bg-brand-accent/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 max-w-5xl mx-auto text-center px-4">
        
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-200/90 border border-white/[0.1] text-xs font-medium text-zinc-300 shadow-sm mb-8 hover:border-brand-500/40 transition-colors cursor-default">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-brand-300">CodeArena v1.0</span>
          <span className="text-zinc-500">•</span>
          <span>Next-gen sandboxed judge engine is live</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
          Where Engineers Master <br />
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-accent bg-clip-text text-transparent">
            Algorithms & Systems
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The competitive programming platform built for speed. Practice curated algorithmic problems, execute code inside microsecond isolated sandboxes, and climb real-time leaderboards.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/problems"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-base shadow-glow-brand hover:from-brand-500 hover:to-brand-400 transition-all group"
          >
            <Code2 className="w-5 h-5 text-brand-200 group-hover:rotate-12 transition-transform" />
            <span>Start Solving</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/problems/two-sum"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-surface-200/80 hover:bg-surface-100 border border-white/[0.1] hover:border-white/[0.2] text-zinc-200 font-medium text-base transition-all"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Daily Problem: Two Sum</span>
          </Link>
        </div>

        {/* Code Editor & Live Verdict Showcase Mockup */}
        <div className="mt-16 relative mx-auto max-w-4xl text-left">
          
          {/* Outer Window Container */}
          <div className="rounded-2xl border border-white/[0.12] bg-[#0A0E17] shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* Window Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111724] border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-zinc-400">solution.cpp — Two Sum</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                  C++ 20 (GCC 13.2)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-6 font-mono text-xs sm:text-sm text-zinc-300 leading-relaxed overflow-x-auto bg-[#0A0E17]">
              <div className="flex">
                <div className="select-none text-zinc-600 pr-6 text-right space-y-1">
                  <div>1</div>
                  <div>2</div>
                  <div>3</div>
                  <div>4</div>
                  <div>5</div>
                  <div>6</div>
                  <div>7</div>
                  <div>8</div>
                  <div>9</div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-purple-400">#include</span> <span className="text-emerald-300">&lt;unordered_map&gt;</span></div>
                  <div><span className="text-purple-400">#include</span> <span className="text-emerald-300">&lt;vector&gt;</span></div>
                  <div><span className="text-blue-400">using namespace</span> std;</div>
                  <div className="pt-2"><span className="text-blue-400">class</span> <span className="text-amber-300">Solution</span> &#123;</div>
                  <div>&nbsp;&nbsp;<span className="text-blue-400">public</span>:</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;vector&lt;<span className="text-blue-400">int</span>&gt; <span className="text-yellow-300">twoSum</span>(vector&lt;<span className="text-blue-400">int</span>&gt;&amp; <span className="text-zinc-300">nums</span>, <span className="text-blue-400">int</span> <span className="text-zinc-300">target</span>) &#123;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unordered_map&lt;<span className="text-blue-400">int</span>, <span className="text-blue-400">int</span>&gt; seen;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">for</span> (<span className="text-blue-400">int</span> i = <span className="text-amber-300">0</span>; i &lt; nums.size(); ++i) &#123;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">int</span> complement = target - nums[i];</div>
                </div>
              </div>
            </div>

            {/* Simulated Live Verdict Banner */}
            <div className="border-t border-white/[0.08] bg-[#0E1524] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-emerald-400 tracking-wide">ACCEPTED</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400 font-mono">Test Cases: 45 / 45 passed</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-4 mt-0.5">
                    <span>Runtime: <strong className="text-zinc-200 font-mono">14 ms</strong> <span className="text-emerald-400">(beats 98.4%)</span></span>
                    <span>Memory: <strong className="text-zinc-200 font-mono">10.8 MB</strong> <span className="text-emerald-400">(beats 94.1%)</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-surface-300 border border-white/[0.06] text-zinc-300">
                  ⚡ Sandbox: 0.04s
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Ticker */}
      <section className="mt-24 border-y border-white/[0.08] bg-[#0A0E17]/60 py-8 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">500+</div>
            <div className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">Curated Problems</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-400 font-mono">&lt; 30ms</div>
            <div className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">Isolated Sandbox Execution</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">100%</div>
            <div className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">Type-Safe Architecture</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">Real-Time</div>
            <div className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">Live Contest Leaderboard</div>
          </div>
        </div>
      </section>

      {/* Core Features Bento Grid */}
      <section className="mt-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 font-mono">
            Platform Capabilities
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
            Engineered for Competitive Programmers
          </p>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
            Every layer of CodeArena is built for precision, high throughput, and zero-compromise security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="group p-8 rounded-2xl bg-surface-200/50 border border-white/[0.08] hover:border-brand-500/40 transition-all hover:shadow-glow-brand flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Isolated Sandboxing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Code executes in isolated micro-environments with strict cgroup resource limits on CPU time, memory ceilings, and disabled network access.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-brand-300">
              <span>Docker & Linux Namespaces</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group p-8 rounded-2xl bg-surface-200/50 border border-white/[0.08] hover:border-brand-500/40 transition-all hover:shadow-glow-brand flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-brand-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Real-Time Contests</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Participate in weekly timed contests with live WebSocket-powered standings, automatic Elo rating adjustments, and penalty calculations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-brand-accent">
              <span>WebSockets & Elo Algorithm</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group p-8 rounded-2xl bg-surface-200/50 border border-white/[0.08] hover:border-brand-500/40 transition-all hover:shadow-glow-brand flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Language Support</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                First-class compilers for C++ (GCC), Python 3, and Java with full stdin/stdout support, sample testcase runners, and custom checker options.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>C++20 • Python 3.12 • Java 21</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action footer */}
      <section className="mt-24 max-w-4xl mx-auto px-4 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-surface-200/80 to-surface-300/80 border border-white/[0.1] shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-500/20 blur-[60px] rounded-full pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to test your algorithms?
          </h3>
          <p className="text-zinc-400 text-sm sm:text-base mt-3 max-w-lg mx-auto">
            Create an account or start solving right away. Free forever for developers.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-surface-400 font-bold hover:bg-zinc-200 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/problems"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-zinc-200 font-semibold hover:bg-white/[0.1] transition-colors"
            >
              Browse Problems
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
