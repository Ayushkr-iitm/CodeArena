import { exec, spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { ExecutionRequest, ExecutionResult, ISandboxDriver } from "../types";

export class DockerDriver implements ISandboxDriver {
  readonly name = "docker_container";

  async isAvailable(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      exec("docker info", { timeout: 3000 }, (err) => {
        resolve(!err);
      });
    });
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const isAvail = await this.isAvailable();
    if (!isAvail) {
      throw new Error("Docker daemon is not running or accessible on the host system.");
    }

    const {
      language,
      code,
      stdin = "",
      timeLimitMs = 2000,
      memoryLimitMb = 256,
    } = request;

    const runId = crypto.randomUUID();
    const sandboxBase = path.join(os.tmpdir(), "codearena_docker_sandbox");
    const tempDir = path.join(sandboxBase, runId);

    await fs.mkdir(tempDir, { recursive: true });

    try {
      const fileNames: Record<string, string> = {
        CPP: "solution.cpp",
        PYTHON: "solution.py",
        JAVA: "Main.java",
      };

      const dockerImages: Record<string, string> = {
        CPP: "gcc:13-alpine",
        PYTHON: "python:3.12-alpine",
        JAVA: "eclipse-temurin:21-alpine",
      };

      const sourceFileName = fileNames[language] || "solution.txt";
      const sourcePath = path.join(tempDir, sourceFileName);
      await fs.writeFile(sourcePath, code, "utf8");

      const image = dockerImages[language];

      // Docker run command with strict security sandboxing flags:
      // --network none : No network access (prevents port scans, socket abuse, data exfiltration)
      // --memory <limit>m : Hard RAM cap
      // --cpus 1.0 : Single core cap
      // --pids-limit 64 : Fork bomb prevention
      // -v <tempDir>:/sandbox:ro : Mount user code as read-only
      let containerCmd = "";
      if (language === "CPP") {
        containerCmd = `g++ -O2 -std=c++14 /sandbox/${sourceFileName} -o /tmp/solution && /tmp/solution`;
      } else if (language === "PYTHON") {
        containerCmd = `python /sandbox/${sourceFileName}`;
      } else if (language === "JAVA") {
        containerCmd = `javac -d /tmp /sandbox/${sourceFileName} && java -cp /tmp Main`;
      }

      const dockerArgs = [
        "run",
        "--rm",
        "-i",
        "--network", "none",
        "--memory", `${memoryLimitMb}m`,
        "--cpus", "1.0",
        "--pids-limit", "64",
        "-v", `${tempDir}:/sandbox:ro`,
        image,
        "sh", "-c", containerCmd,
      ];

      const startHr = process.hrtime.bigint();

      return new Promise<ExecutionResult>((resolve) => {
        let stdout = "";
        let stderr = "";
        let timedOut = false;

        const child = spawn("docker", dockerArgs, {
          stdio: ["pipe", "pipe", "pipe"],
          windowsHide: true,
        });

        const timer = setTimeout(() => {
          timedOut = true;
          try {
            child.kill("SIGKILL");
          } catch {}
          resolve({
            verdict: "TIME_LIMIT_EXCEEDED",
            stdout,
            stderr: "Time Limit Exceeded in container sandbox",
            executionTimeMs: timeLimitMs,
            memoryUsedKb: memoryLimitMb * 1024,
            exitCode: null,
          });
        }, timeLimitMs + 1500); // 1.5s margin for container spawn

        if (child.stdin) {
          try {
            child.stdin.write(stdin);
            child.stdin.end();
          } catch {}
        }

        child.stdout?.on("data", (d) => { stdout += d.toString("utf8"); });
        child.stderr?.on("data", (d) => { stderr += d.toString("utf8"); });

        child.on("close", (code) => {
          clearTimeout(timer);
          if (timedOut) return;

          const endHr = process.hrtime.bigint();
          const elapsedMs = Math.round(Number(endHr - startHr) / 1_000_000);

          resolve({
            verdict: code === 0 ? "ACCEPTED" : "RUNTIME_ERROR",
            stdout,
            stderr,
            executionTimeMs: elapsedMs,
            memoryUsedKb: Math.floor(memoryLimitMb * 256),
            exitCode: code,
          });
        });
      });
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
