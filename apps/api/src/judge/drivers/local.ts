import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { ExecutionRequest, ExecutionResult, ISandboxDriver } from "../types";
import { compileSource } from "../compiler";
import { runProcess } from "../runner";
import { validateSubmissionSecurity } from "../security";

export class LocalProcessDriver implements ISandboxDriver {
  readonly name = "local_process";

  async isAvailable(): Promise<boolean> {
    return true; // Local host execution is always available as fallback
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const {
      language,
      code,
      stdin = "",
      timeLimitMs = 2000,
      memoryLimitMb = 256,
    } = request;

    // 0. Static security check
    const secCheck = validateSubmissionSecurity(language, code);
    if (!secCheck.isSafe) {
      return {
        verdict: "RUNTIME_ERROR",
        stdout: "",
        stderr: `[Security Violation] ${secCheck.reason}`,
        executionTimeMs: 0,
        memoryUsedKb: 0,
        exitCode: 1,
        error: secCheck.reason,
      };
    }

    // Create unique ephemeral directory for isolation
    const runId = crypto.randomUUID();
    const sandboxBase = path.join(os.tmpdir(), "codearena_sandbox");
    const tempDir = path.join(sandboxBase, runId);

    await fs.mkdir(tempDir, { recursive: true });

    try {
      // 1. Prepare source filename
      const fileNames: Record<string, string> = {
        CPP: "solution.cpp",
        PYTHON: "solution.py",
        JAVA: "Main.java",
      };

      const sourceFileName = fileNames[language] || "solution.txt";
      const sourcePath = path.join(tempDir, sourceFileName);

      // 2. Write source code to sandbox disk
      await fs.writeFile(sourcePath, code, "utf8");

      // 3. Compile or syntax-check
      let runCommand = "";
      let runArgs: string[] = [];

      if (language === "CPP") {
        const compileRes = await compileSource("CPP", sourcePath, tempDir);
        if (!compileRes.success) {
          return {
            verdict: "COMPILATION_ERROR",
            stdout: "",
            stderr: compileRes.error || "Compilation failed",
            executionTimeMs: compileRes.compilationTimeMs,
            memoryUsedKb: 0,
            exitCode: 1,
            compileOutput: compileRes.error,
          };
        }
        runCommand = compileRes.executablePath!;
        runArgs = [];
      } else if (language === "PYTHON") {
        const compileRes = await compileSource("PYTHON", sourcePath, tempDir);
        if (!compileRes.success) {
          return {
            verdict: "COMPILATION_ERROR",
            stdout: "",
            stderr: compileRes.error || "Python syntax error",
            executionTimeMs: compileRes.compilationTimeMs,
            memoryUsedKb: 0,
            exitCode: 1,
            compileOutput: compileRes.error,
          };
        }
        runCommand = "python";
        runArgs = [sourcePath];
      } else if (language === "JAVA") {
        const compileRes = await compileSource("JAVA", sourcePath, tempDir);
        if (!compileRes.success) {
          return {
            verdict: "COMPILATION_ERROR",
            stdout: "",
            stderr: compileRes.error || "Java compilation failed",
            executionTimeMs: compileRes.compilationTimeMs,
            memoryUsedKb: 0,
            exitCode: 1,
            compileOutput: compileRes.error,
          };
        }
        runCommand = "java";
        runArgs = ["-cp", tempDir, "Main"];
      }

      // 4. Execute with runner
      const runResult = await runProcess({
        command: runCommand,
        args: runArgs,
        cwd: tempDir,
        stdin,
        timeLimitMs,
        memoryLimitMb,
      });

      return runResult;
    } finally {
      // 5. Cleanup sandbox directory with retries (handles Windows file handle release delay)
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          break;
        } catch (err) {
          if (attempt === maxRetries) {
            // Silently ignore or log debug if OS takes longer to release handle
            break;
          }
          await new Promise((r) => setTimeout(r, 150));
        }
      }
    }
  }
}
