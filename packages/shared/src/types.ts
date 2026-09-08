// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  rating: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

// ============================================
// PROBLEM TYPES
// ============================================

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  timeLimit: number; // in milliseconds
  memoryLimit: number; // in MB
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

// ============================================
// SUBMISSION TYPES
// ============================================

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  runtime?: number; // in milliseconds
  memory?: number; // in KB
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage?: string;
  createdAt: Date;
}

export enum Language {
  CPP = "CPP",
  PYTHON = "PYTHON",
  JAVA = "JAVA",
}

export enum Verdict {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  ACCEPTED = "ACCEPTED",
  WRONG_ANSWER = "WRONG_ANSWER",
  TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
  RUNTIME_ERROR = "RUNTIME_ERROR",
  COMPILATION_ERROR = "COMPILATION_ERROR",
}

// ============================================
// TEST CASE TYPES
// ============================================

export interface TestCase {
  id: string;
  problemId: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  order: number;
}

// ============================================
// CONTEST TYPES
// ============================================

export interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: ContestStatus;
  createdAt: Date;
}

export enum ContestStatus {
  UPCOMING = "UPCOMING",
  RUNNING = "RUNNING",
  ENDED = "ENDED",
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
