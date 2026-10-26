'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Send,
  User,
  AlertCircle,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface CommentItem {
  id: string
  content: string
  upvotes: number
  downvotes: number
  createdAt: string
  user: {
    id: string
    username: string
    displayName?: string
    rating: number
    avatarUrl?: string
  }
  replies?: CommentItem[]
}

interface ProblemDiscussionProps {
  problemId: string
}

export default function ProblemDiscussion({ problemId }: ProblemDiscussionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<CommentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadComments = async () => {
    try {
      const res = await api.getComments(problemId)
      const data = (res as any)?.data || res
      setComments(data || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    loadComments()
  }, [problemId])

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Please sign in to join the discussion!')
      return
    }
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await api.postComment(problemId, newComment.trim())
      setNewComment('')
      loadComments()
    } catch (err: any) {
      alert(err.message || 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePostReply = async (parentId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to reply!')
      return
    }
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      await api.postComment(problemId, replyContent.trim(), parentId)
      setReplyContent('')
      setReplyingTo(null)
      loadComments()
    } catch (err: any) {
      alert(err.message || 'Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (commentId: string, type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) {
      alert('Please sign in to vote!')
      return
    }
    try {
      await api.voteComment(commentId, type)
      loadComments()
    } catch (err: any) {
      console.error('Failed to vote:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-2">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading discussions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-xs text-zinc-300">
      
      {/* Discussion Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand-400 font-mono font-bold uppercase tracking-wider text-[11px]">
          <MessageSquare className="w-4 h-4" />
          <span>Community Discussion ({comments.length})</span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">Be respectful & helpful</span>
      </div>

      {/* New Comment Box */}
      <form onSubmit={handlePostComment} className="p-3.5 rounded-xl bg-surface-300/60 border border-white/[0.06] space-y-3">
        <textarea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated ? "Ask a question, share an observation, or discuss edge cases..." : "Please sign in to participate in the discussion"}
          disabled={!isAuthenticated || isSubmitting}
          className="w-full p-2.5 bg-[#090D18] border border-white/[0.08] rounded-lg text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-mono">Markdown supported</span>
          <button
            type="submit"
            disabled={!isAuthenticated || isSubmitting || !newComment.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-[#090D18] border border-white/[0.06] space-y-3"
            >
              {/* Author & Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center font-bold text-[10px] text-white">
                    {comment.user.displayName ? comment.user.displayName.charAt(0).toUpperCase() : comment.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-white text-xs mr-1.5">
                      {comment.user.displayName || comment.user.username}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      @{comment.user.username}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-zinc-500">
                  {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Comment Content */}
              <p className="text-xs font-sans text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Action Bar (Upvote, Downvote, Reply) */}
              <div className="flex items-center gap-4 pt-1 text-[11px] font-mono text-zinc-400">
                <button
                  onClick={() => handleVote(comment.id, 'UPVOTE')}
                  className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{comment.upvotes}</span>
                </button>

                <button
                  onClick={() => handleVote(comment.id, 'DOWNVOTE')}
                  className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{comment.downvotes}</span>
                </button>

                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                    setReplyContent('')
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </div>

              {/* Inline Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-2 pl-4 border-l-2 border-brand-500/30 space-y-2">
                  <textarea
                    rows={2}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full p-2 bg-surface-300 border border-white/[0.08] rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="px-2.5 py-1 text-zinc-400 hover:text-white text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostReply(comment.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      className="px-3 py-1 rounded-lg bg-brand-600 text-white text-[11px] font-semibold hover:bg-brand-500 disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l border-white/[0.08] space-y-2.5">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-2.5 rounded-lg bg-surface-300/40 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-white">
                          {reply.user.displayName || reply.user.username}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(reply.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 rounded-xl bg-surface-300/30 border border-white/[0.04] text-zinc-500 space-y-1">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs font-semibold text-zinc-400">No discussions yet</p>
            <p className="text-[11px]">Be the first to share an observation or ask a question!</p>
          </div>
        )}
      </div>
    </div>
  )
}
