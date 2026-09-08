'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Code2, Trophy, BarChart3, Menu, X, Sparkles, Search, UserCheck } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { name: 'Problems', href: '/problems', icon: Code2 },
    { name: 'Contests', href: '/contests', icon: Trophy, badge: 'Live' },
    { name: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#080C14]/85 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-[1px] shadow-glow-brand transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-brand-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  CodeArena
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
                    v1.0
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 font-mono -mt-1 hidden sm:inline">
                  Online Judge
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'text-white bg-white/[0.08] border border-white/[0.06] shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-zinc-400'}`} />
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30 animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick Search & User Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Input Trigger */}
            <Link
              href="/problems"
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-200/80 border border-white/[0.08] text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/[0.16] transition-all w-48 group"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand-400 transition-colors" />
              <span>Search problems...</span>
              <kbd className="ml-auto font-mono text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] text-zinc-400">
                ⌘K
              </kbd>
            </Link>

            {/* Online Coders Status */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-mono text-zinc-300">2,480</span> online
            </div>

            <div className="h-4 w-[1px] bg-white/[0.08]" />

            {/* Auth Buttons */}
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="relative group overflow-hidden rounded-lg p-[1px] font-medium text-sm text-white"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-500 group-hover:opacity-90 transition-opacity" />
              <span className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-[7px] bg-surface-400 font-semibold group-hover:bg-opacity-80 transition-all">
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                Get Started
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0B0F19] px-4 pt-3 pb-5 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-zinc-300 hover:text-white hover:bg-white/[0.05]"
                >
                  <Icon className="w-5 h-5 text-brand-400" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 rounded-lg text-sm font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06]"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 shadow-glow-brand"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
