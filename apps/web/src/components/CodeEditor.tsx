'use client'

import React, { useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

export type SupportedLanguage = 'CPP' | 'PYTHON' | 'JAVA'

export interface CodeEditorProps {
  language: SupportedLanguage
  value: string
  onChange: (value: string) => void
  fontSize?: number
  theme?: 'vs-dark' | 'light' | 'hc-black'
  onRun?: () => void
  readOnly?: boolean
}

// Map platform language to Monaco language identifier
const monacoLanguageMap: Record<SupportedLanguage, string> = {
  CPP: 'cpp',
  PYTHON: 'python',
  JAVA: 'java',
}

export default function CodeEditor({
  language,
  value,
  onChange,
  fontSize = 14,
  theme = 'vs-dark',
  onRun,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Add Ctrl+Enter / Cmd+Enter shortcut to trigger code execution
    if (onRun) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun()
      })
    }
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0D1117]">
      <Editor
        height="100%"
        width="100%"
        language={monacoLanguageMap[language]}
        theme={theme}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex flex-col items-center justify-center h-full bg-[#0D1117] space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-400">Loading VS Code Engine...</span>
          </div>
        }
        options={{
          readOnly,
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          formatOnPaste: true,
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
      />
    </div>
  )
}
