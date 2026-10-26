import { JudgeLanguage } from "./types";

export interface SecurityCheckResult {
  isSafe: boolean;
  reason?: string;
}

/**
 * Static Analysis Security Scanner for Competitive Programming submissions.
 * Blocks dangerous OS primitives, network sockets, process forking,
 * and privilege tampering in sandbox fallback environments.
 */
export function validateSubmissionSecurity(
  language: JudgeLanguage,
  code: string
): SecurityCheckResult {
  const normalized = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ""); // strip C++/Java comments

  switch (language) {
    case "PYTHON": {
      // Strip Python single line comments
      const cleanPython = code.replace(/#.*$/gm, "");

      // 1. Block prohibited system and network modules
      const prohibitedModules = [
        "os",
        "subprocess",
        "socket",
        "pty",
        "ctypes",
        "shutil",
        "multiprocessing",
        "urllib",
        "requests",
        "http.client",
      ];

      for (const mod of prohibitedModules) {
        const importRegex = new RegExp(`\\b(import\\s+${mod}|from\\s+${mod}\\s+import)\\b`, "i");
        if (importRegex.test(cleanPython)) {
          return {
            isSafe: false,
            reason: `Importing restricted module '${mod}' is forbidden in sandbox environment.`,
          };
        }

        // Dynamic __import__ detection
        const dynamicImport = new RegExp(`__import__\\s*\\(\\s*['"]${mod}['"]`, "i");
        if (dynamicImport.test(cleanPython)) {
          return {
            isSafe: false,
            reason: `Dynamic import of '${mod}' is forbidden in sandbox environment.`,
          };
        }
      }

      // 2. Block direct eval/exec code injection
      if (/\b(eval|exec)\s*\(/i.test(cleanPython)) {
        return {
          isSafe: false,
          reason: "Dynamic code execution (eval/exec) is restricted in competitive programming.",
        };
      }

      return { isSafe: true };
    }

    case "CPP": {
      // 1. Prohibited headers
      const prohibitedHeaders = [
        "windows.h",
        "winsock2.h",
        "sys/socket.h",
        "arpa/inet.h",
        "netdb.h",
        "unistd.h",
        "signal.h",
      ];

      for (const header of prohibitedHeaders) {
        const headerRegex = new RegExp(`#\\s*include\\s*[<"]${header}[>"]`, "i");
        if (headerRegex.test(normalized)) {
          return {
            isSafe: false,
            reason: `Including header <${header}> is forbidden for security isolation.`,
          };
        }
      }

      // 2. Prohibited system execution functions
      const dangerousFunctions = ["system", "fork", "popen", "execve", "execl", "kill"];
      for (const fn of dangerousFunctions) {
        const fnRegex = new RegExp(`\\b${fn}\\s*\\(`, "i");
        if (fnRegex.test(normalized)) {
          return {
            isSafe: false,
            reason: `Calling system function '${fn}()' is prohibited in sandbox environment.`,
          };
        }
      }

      return { isSafe: true };
    }

    case "JAVA": {
      // 1. Prohibited classes and APIs
      if (/\b(ProcessBuilder|Runtime\.getRuntime)\b/.test(normalized)) {
        return {
          isSafe: false,
          reason: "Spawning child processes via ProcessBuilder/Runtime is restricted.",
        };
      }

      if (/import\s+java\.net\b/.test(normalized)) {
        return {
          isSafe: false,
          reason: "Network socket connections are prohibited in sandbox environment.",
        };
      }

      return { isSafe: true };
    }

    default:
      return { isSafe: true };
  }
}
