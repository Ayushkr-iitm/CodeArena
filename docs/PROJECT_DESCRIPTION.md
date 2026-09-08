# 📜 CodeArena — Complete Project Description & Architecture Document

---

## 1. Executive Summary

**CodeArena** is a production-grade, distributed **Online Judge & Competitive Programming Platform** inspired by LeetCode, Codeforces, and AtCoder.

The platform enables software engineers, students, and competitive programmers to:
1. **Practice & Solve Algorithmic Challenges**: Browse a curated directory of problems spanning Data Structures & Algorithms (Arrays, Graphs, Dynamic Programming, Trees, etc.).
2. **Execute Untrusted Code Safely**: Write code in C++, Python, or Java and execute it inside low-latency, secure, isolated Linux sandboxes.
3. **Receive Automated Instant Verdicts**: Compare standard output against hidden and sample test cases with standard verdicts (`ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `RUNTIME_ERROR`, `COMPILATION_ERROR`).
4. **Compete in Live Contests**: Participate in timed contests with real-time scoreboards, penalty tracking, and Elo rating updates.
5. **Analyze Progression**: Track unique problems solved, acceptance rates, difficulty distribution, and performance percentiles.

---

## 2. High-Level System Architecture

```
                                  [ USER BROWSER ]
                                         │
                                         ▼
                      ┌────────────────────────────────────┐
                      │      Next.js 14 Web Frontend       │
                      │  (Monaco Editor, Tailwind, React)  │
                      └──────────────────┬─────────────────┘
                                         │  HTTP / WebSockets
                                         ▼
                      ┌────────────────────────────────────┐
                      │       Express.js REST API          │
                      │  (Auth, Problems, Submissions)     │
                      └─────────┬───────────────────┬──────┘
                                │                   │
                     Database   │                   │  Enqueue Submission
                    Operations  │                   │
                                ▼                   ▼
                   ┌───────────────────┐     ┌──────────────┐
                   │ SQLite / Postgres │     │  Redis Queue │
                   │   (Prisma ORM)    │     │   (BullMQ)   │
                   └───────────────────┘     └──────┬───────┘
                                                    │
                                  ┌─────────────────┼─────────────────┐
                                  ▼                 ▼                 ▼
                             ┌─────────┐       ┌─────────┐       ┌─────────┐
                             │ Worker  │       │ Worker  │       │ Worker  │
                             └────┬────┘       └────┬────┘       └────┬────┘
                                  │                 │                 │
                                  ▼                 ▼                 ▼
                             ┌─────────┐       ┌─────────┐       ┌─────────┐
                             │ Sandbox │       │ Sandbox │       │ Sandbox │
                             │(Docker) │       │(Docker) │       │(Docker) │
                             └─────────┘       └─────────┘       └─────────┘
```

---

## 3. Detailed Component Breakdown

### 3.1 Frontend Web Application (`apps/web`)
- **Framework**: Next.js 14 with App Router, React 18, TypeScript, and Tailwind CSS.
- **Code Workspace**: Embedded **Monaco Editor** (the engine powering VS Code) with syntax highlighting, autocomplete, indentation guides, theme switcher, and language starters.
- **Problem Workbench**: Split-pane interface featuring:
  - Left pane: Markdown problem description, copyable examples, constraint badges, and editorial notes.
  - Right pane: Code editor with language selector (C++, Python, Java) and reset controls.
  - Bottom drawer: Sample testcase console and live test result output.
- **State Management & Auth**: React Context API for global session persistence (`AuthContext`), Bearer token auto-attachment, and route guards.
- **Theme**: High-contrast, dark-mode developer UI with deep midnight surfaces (`#080C14`), electric indigo brand accents, and distinct status indicators.

### 3.2 Backend API Server (`apps/api`)
- **Runtime**: Node.js with Express.js written in strict TypeScript.
- **Data Access**: Prisma ORM with type-safe queries, relational foreign keys, and migration support.
- **Security Middleware**:
  - `helmet`: HTTP headers protection.
  - `cors`: Strict origin validation.
  - `bcryptjs`: 10-round salted password hashing.
  - `jsonwebtoken`: Dual-token authentication (15-minute Access Tokens + 7-day Refresh Tokens).
  - `zod`: Request payload schema validation and sanitization.
- **Core Modules**:
  - `auth`: Registration, login, token refreshing, profile authentication.
  - `problems`: Querying with pagination, full-text search, difficulty filters, and admin CRUD.
  - `submissions`: Ingesting submissions, validating ownership, and fetching historical results.
  - `users`: Computing difficulty-wise solved counts, acceptance percentages, and rating leaderboards.

### 3.3 The Sandboxed Judge Engine (`apps/judge`)
The most critical system in an online judge is the execution engine. Running arbitrary user-submitted code on a server is dangerous without strict isolation:
- **Sandbox Architecture**:
  - Code execution occurs within isolated ephemeral Docker containers or Linux namespaces.
  - **Network Isolation**: Networking disabled (`--network none`) to prevent submissions from accessing the internet or internal services.
  - **Resource Cgroups**:
    - **CPU Quota**: Strict timeout enforcement via OS signals (`SIGALRM`, `SIGKILL`).
    - **Memory Ceiling**: Hard limit (e.g. 256MB) preventing heap exhaustion.
    - **Process Limit (`pids-limit`)**: Fork bomb prevention (e.g. max 32 processes).
    - **File Size Limit**: Limits on output volume to prevent disk exhaustion.
- **Compilation & Execution Lifecycle**:
  1. *C++*: Source (`solution.cpp`) compiled with `g++ -O3 -std=c++20`. If compilation fails $\rightarrow$ `COMPILATION_ERROR` with compiler logs returned.
  2. *Python*: Interpreted with `python3 -u solution.py`.
  3. *Java*: Compiled with `javac Main.java` and executed with `java -Xmx256M Main`.
- **Output Comparator (Checker)**:
  - Strict line-by-line whitespace-trimmed comparison between actual stdout and expected testcase outputs.
  - Detects floating-point precision tolerances where required.

### 3.4 Asynchronous Queue & Distributed Workers
- **Message Broker**: Redis + BullMQ.
- **Why an asynchronous queue?**
  - If 5,000 users submit code simultaneously during a contest, running them synchronously on the API server would cause HTTP timeouts and exhaust CPU threads.
  - The API immediately responds with `HTTP 201 Created` and a `PENDING` submission ID.
  - Submissions enter the BullMQ Redis queue with configurable priority (contest submissions get higher priority than practice submissions).
  - A pool of independent judge worker nodes pull jobs, spin up sandboxes, run test cases, update the database with verdicts, and emit WebSocket events.

### 3.5 Real-Time Contest System & Leaderboards
- **Protocols**: WebSockets (via Socket.IO) integrated into the API layer.
- **Contest Engine**:
  - Scheduled contest start and end times.
  - Freeze scoreboard period (e.g. last 15 minutes of a contest hidden from participants to prevent tactical sniping).
  - ICPC-style scoring: Score based on problems solved + time penalty for failed attempts before acceptance.
  - Elo / Glicko Rating Algorithm: Automatic calculation of rating changes based on performance relative to expected seed.

---

## 4. Database Schema & Data Models

The database models are maintained in [`schema.prisma`](file:///c:/Users/AYUSH%20SRIVASTAVA/Documents/Online%20Judge/apps/api/prisma/schema.prisma):

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Problem     │       │     TestCase    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │◄──────┤ id (PK)         │
│ email           │       │ slug (unique)   │       │ problemId (FK)  │
│ username        │       │ title           │       │ input           │
│ passwordHash    │       │ description     │       │ expectedOutput  │
│ role            │       │ difficulty      │       │ isSample        │
│ rating          │       │ timeLimit       │       │ order           │
└────────┬────────┘       │ memoryLimit     │       └─────────────────┘
         │                │ isPublished     │
         │                └────────┬────────┘
         │                         │
         │                         │
         │   ┌─────────────────────┤
         ▼   ▼                     ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Submission    │       │   ProblemTag    │       │       Tag       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ problemId (FK)  │──────►│ id (PK)         │
│ userId (FK)     │       │ tagId (FK)      │       │ name (unique)   │
│ problemId (FK)  │       └─────────────────┘       │ slug (unique)   │
│ language        │                                 └─────────────────┘
│ code            │
│ verdict         │
│ runtime         │
│ memory          │
│ testCasesPassed │
│ totalTestCases  │
└─────────────────┘
```

Additional models:
- **`Contest`**: Holds contest metadata, start/end windows, and problem associations.
- **`ContestParticipant`**: Tracks registered users, solved scores, and penalty totals.
- **`Comment`**: Supports nested discussions, upvotes, and problem solution sharing.

---

## 5. Security & Threat Modeling

| Threat Vector | Potential Impact | Platform Mitigation |
| :--- | :--- | :--- |
| **Malicious Code / Fork Bomb** | Server crash due to process starvation (`:(){ :\|:& };:`) | Docker `pids-limit=32` + strict OS thread limits. |
| **Infinite Loops** | 100% CPU core pinning | Hard execution watchdog timer sending `SIGKILL` after time limit. |
| **Memory Exhaustion** | Out-of-memory crash of host machine | Linux cgroup `memory=256m` with swap disabled. |
| **Filesystem Traversal** | Reading secrets, `.env`, or server files | Container filesystem mounted as read-only; ephemeral `/tmp` with strict quota. |
| **Network Abuse / DDoS** | Opening reverse shells, scanning local network | Docker container network completely disabled (`--network none`). |
| **API Abuse / Brute Force** | Password guessing, submission flooding | Express rate limiters, token expiration, payload size limits (max 10MB). |

---

## 6. End-to-End Submission Lifecycle

```
1. User writes code in Monaco Editor on /problems/[slug]
2. User clicks "Submit"
   ↓
3. Frontend validates auth token and sends POST /api/submissions
   ↓
4. Express API creates Submission in DB with status "PENDING"
   ↓
5. API enqueues job into BullMQ (Redis)
   ↓
6. Available Judge Worker dequeues submission
   ↓
7. Worker updates DB verdict to "RUNNING" and broadcasts status
   ↓
8. Worker compiles code inside sandbox (if compiled language)
   - If compile fails → Status set to "COMPILATION_ERROR", error logged, exits
   ↓
9. Worker loops through all TestCases:
   - Feeds input via stdin
   - Captures stdout and stderr
   - Monitors CPU time and memory usage
   - Compares actual stdout against expectedOutput
   - If time exceeded → "TIME_LIMIT_EXCEEDED"
   - If memory exceeded → "MEMORY_LIMIT_EXCEEDED"
   - If crash / non-zero exit → "RUNTIME_ERROR"
   - If output mismatch → "WRONG_ANSWER"
   ↓
10. If all test cases pass → Verdict marked "ACCEPTED"
   ↓
11. Worker updates database with final runtime, memory, and passed count
   ↓
12. WebSocket pushes final verdict to frontend; UI displays green checkmark banner
```

---

## 7. Milestone Roadmap

```
[ PHASE 1: Scaffolding & Design ] ✅ COMPLETE
  ├── Monorepo setup (npm workspaces)
  ├── Express + Prisma API with SQLite
  ├── Seed data (5 problems, 2 users, 17 tags)
  └── Next.js 14 frontend with modern dark IDE theme

[ PHASE 2: Auth & Session Management ] 🔄 IN PROGRESS
  ├── Global AuthContext
  ├── Connect forms to JWT endpoints
  ├── Dynamic Navbar (avatar, rating, logout)
  └── Protected routes & authorization middleware

[ PHASE 3: Dynamic Problem Management ]
  ├── Fetching live problems from database
  └── Admin dashboard for creating/editing problems & test cases

[ PHASE 4: Monaco Code Editor ]
  ├── VS Code Monaco integration
  └── Multi-language autocomplete, themes, and template management

[ PHASE 5: Sandboxed Execution Engine ]
  ├── Docker container execution runner
  ├── Process isolation, cgroups, memory & time limiters
  └── Output checker and verdict evaluator

[ PHASE 6: Redis & BullMQ Job Queue ]
  ├── Asynchronous submission processing
  └── Multi-worker scaling

[ PHASE 7: Live Contests & Real-Time WebSockets ]
  ├── Timed contest engine
  ├── Live leaderboard updates via WebSockets
  └── Elo rating calculations

[ PHASE 8: Production Deployment & DevOps ]
  ├── Docker Compose production stack
  ├── PostgreSQL migration
  └── Nginx reverse proxy & CI/CD pipeline
```
