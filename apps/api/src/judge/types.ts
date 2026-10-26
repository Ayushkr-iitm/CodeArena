export type JudgeLanguage = "CPP" | "PYTHON" | "JAVA";

export type JudgeVerdict =
  | "PENDING"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "INTERNAL_ERROR";

export interface ExecutionRequest {
  language: JudgeLanguage;
  code: string;
  stdin?: string;
  timeLimitMs?: number; // default: 2000 ms
  memoryLimitMb?: number; // default: 256 MB
}

export interface ExecutionResult {
  verdict: JudgeVerdict;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  exitCode: number | null;
  compileOutput?: string;
  error?: string;
}

export interface CompilerResult {
  success: boolean;
  executablePath?: string;
  error?: string;
  compilationTimeMs: number;
}

export interface ISandboxDriver {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
