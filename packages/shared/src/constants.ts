// ============================================
// APPLICATION CONSTANTS
// ============================================

export const APP_NAME = "CodeArena";
export const APP_DESCRIPTION = "Competitive Programming Platform";

// ============================================
// LANGUAGE CONFIGURATION
// ============================================

export const LANGUAGE_CONFIG = {
  CPP: {
    name: "C++",
    extension: ".cpp",
    monacoId: "cpp",
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}
`,
  },
  PYTHON: {
    name: "Python",
    extension: ".py",
    monacoId: "python",
    template: `# Your code here

`,
  },
  JAVA: {
    name: "Java",
    extension: ".java",
    monacoId: "java",
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
        
    }
}
`,
  },
} as const;

// ============================================
// JUDGE DEFAULTS
// ============================================

export const DEFAULT_TIME_LIMIT = 2000; // 2 seconds in ms
export const DEFAULT_MEMORY_LIMIT = 256; // 256 MB

// ============================================
// PAGINATION
// ============================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================
// DIFFICULTY COLORS (for UI)
// ============================================

export const DIFFICULTY_COLORS = {
  EASY: { text: "text-green-500", bg: "bg-green-100" },
  MEDIUM: { text: "text-yellow-500", bg: "bg-yellow-100" },
  HARD: { text: "text-red-500", bg: "bg-red-100" },
} as const;

// ============================================
// VERDICT COLORS (for UI)
// ============================================

export const VERDICT_CONFIG = {
  PENDING: { label: "Pending", color: "text-gray-500" },
  RUNNING: { label: "Running", color: "text-blue-500" },
  ACCEPTED: { label: "Accepted", color: "text-green-500" },
  WRONG_ANSWER: { label: "Wrong Answer", color: "text-red-500" },
  TIME_LIMIT_EXCEEDED: { label: "Time Limit Exceeded", color: "text-orange-500" },
  MEMORY_LIMIT_EXCEEDED: { label: "Memory Limit Exceeded", color: "text-purple-500" },
  RUNTIME_ERROR: { label: "Runtime Error", color: "text-yellow-600" },
  COMPILATION_ERROR: { label: "Compilation Error", color: "text-red-600" },
} as const;
