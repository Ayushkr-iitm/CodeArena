'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Eye, EyeOff, Lightbulb, ChevronDown, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

interface ProblemEditorialProps {
  problemId: string
  problemTitle: string
}

export default function ProblemEditorial({ problemId, problemTitle }: ProblemEditorialProps) {
  const [editorialData, setEditorialData] = useState<{ editorial: string; hints: string[] }>({
    editorial: '',
    hints: [],
  })
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEditorial() {
      setIsLoading(true)
      try {
        const res = await api.getEditorial(problemId)
        const data = res?.data || res
        setEditorialData(data || { editorial: '', hints: [] })
      } catch (err) {
        console.error('Failed to load editorial:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadEditorial()
  }, [problemId])

  const toggleHint = (index: number) => {
    setRevealedHints((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-2">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading official editorial...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-xs text-zinc-300">
      
      {/* Progressive Hints Section */}
      {editorialData.hints && editorialData.hints.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
            <Lightbulb className="w-4 h-4" />
            <span>Progressive Hints ({editorialData.hints.length})</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Reveal hints one by one to nudge yourself in the right direction without spoiling the solution.
          </p>

          <div className="space-y-2">
            {editorialData.hints.map((hint, idx) => {
              const isRevealed = !!revealedHints[idx]
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-surface-300/70 border border-white/[0.06] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleHint(idx)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-mono font-semibold text-zinc-300 flex items-center gap-2">
                      <span className="text-amber-400">💡 Hint {idx + 1}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                      {isRevealed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Show Hint</span>
                        </>
                      )}
                    </span>
                  </button>

                  {isRevealed && (
                    <div className="px-3.5 pb-3 text-xs font-sans text-zinc-300 border-t border-white/[0.04] pt-2.5 bg-black/20 leading-relaxed animate-in fade-in">
                      {hint}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Official Editorial Content */}
      <div className="space-y-3 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-brand-400 font-mono font-bold uppercase tracking-wider text-[11px]">
          <BookOpen className="w-4 h-4" />
          <span>Official Editorial: {problemTitle}</span>
        </div>

        {editorialData.editorial ? (
          <div className="p-4 rounded-xl bg-[#090D18] border border-white/[0.06] space-y-4 text-xs font-sans leading-relaxed text-zinc-300 whitespace-pre-wrap">
            {editorialData.editorial}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface-300/50 border border-white/[0.06] text-center text-zinc-500 py-8">
            Official editorial is being prepared by the problem authors. Check out the <strong>Solutions</strong> tab for community approaches!
          </div>
        )}
      </div>
    </div>
  )
}
