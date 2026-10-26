import { exec, spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { CompilerResult, JudgeLanguage } from "./types";

const COMPILE_TIMEOUT_MS = 10000; // 10s compile time limit

/**
 * Compiles source code for compiled languages (C++, Java) or checks syntax for Python.
 */
export async function compileSource(
  language: JudgeLanguage,
  sourcePath: string,
  outputDir: string
): Promise<CompilerResult> {
  const startTime = Date.now();

  switch (language) {
    case "CPP": {
      const isWindows = process.platform === "win32";
      const exeName = isWindows ? "solution.exe" : "solution";
      const outputPath = path.join(outputDir, exeName);

      return new Promise<CompilerResult>((resolve) => {
        // Compile with g++ using C++14/C++17 standard and -O2 optimization
        const cmd = `g++ -O2 -std=c++14 "${sourcePath}" -o "${outputPath}"`;
        const processRef = exec(
          cmd,
          { timeout: COMPILE_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
          (error, stdout, stderr) => {
            const compilationTimeMs = Date.now() - startTime;
            if (error) {
              resolve({
                success: false,
                error: stderr || stdout || error.message,
                compilationTimeMs,
              });
            } else {
              resolve({
                success: true,
                executablePath: outputPath,
                compilationTimeMs,
              });
            }
          }
        );
      });
    }

    case "JAVA": {
      return new Promise<CompilerResult>((resolve) => {
        const cmd = `javac "${sourcePath}"`;
        exec(cmd, { timeout: COMPILE_TIMEOUT_MS }, (error, stdout, stderr) => {
          const compilationTimeMs = Date.now() - startTime;
          if (error) {
            const msg = (stderr || stdout || error.message).includes("not recognized")
              ? "Java compiler (javac) is not installed on this host runner. Please install Java JDK or use Python / C++."
              : stderr || stdout || error.message;

            resolve({
              success: false,
              error: msg,
              compilationTimeMs,
            });
          } else {
            resolve({
              success: true,
              executablePath: path.join(outputDir, "Main.class"),
              compilationTimeMs,
            });
          }
        });
      });
    }

    case "PYTHON": {
      // Python is interpreted, but we can perform an upfront syntax validation
      return new Promise<CompilerResult>((resolve) => {
        const cmd = `python -m py_compile "${sourcePath}"`;
        exec(cmd, { timeout: COMPILE_TIMEOUT_MS }, (error, stdout, stderr) => {
          const compilationTimeMs = Date.now() - startTime;
          if (error) {
            resolve({
              success: false,
              error: stderr || stdout || "Python syntax error",
              compilationTimeMs,
            });
          } else {
            resolve({
              success: true,
              executablePath: sourcePath,
              compilationTimeMs,
            });
          }
        });
      });
    }

    default:
      return {
        success: false,
        error: `Unsupported language: ${language}`,
        compilationTimeMs: 0,
      };
  }
}
