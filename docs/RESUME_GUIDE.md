# 📄 Resume & Interview Guide — CodeArena Online Judge

This guide provides resume-ready bullet points, technical summaries, and interview talking points formatted to meet top-tier tech industry standards (Google XYZ formula: *Accomplished [X] as measured by [Y], by doing [Z]*).

---

## 1. Resume Entry Formats

### 🌟 Option A: Full-Stack Engineer Focus (Recommended)

**CodeArena — Distributed Online Judge & Competitive Programming Platform**  
*TypeScript, Next.js 14, React, Node.js, Express, PostgreSQL, Prisma, Redis, Docker, WebSockets* | [GitHub Link](https://github.com/Ayushkr-iitm/Online-Judge)
- Architected a full-stack competitive programming platform supporting **1,000+ concurrent submissions** across C++, Python, and Java with automated sub-second verdict evaluations.
- Engineered a secure code execution sandbox utilizing **Docker containers and Linux cgroups**, strictly enforcing 256MB memory caps, 2s CPU limits, and disabling network access to prevent fork bombs and malicious syscalls.
- Built an asynchronous task pipeline using **Redis & BullMQ** to decouple submission ingestion from execution, scaling worker pools horizontally and achieving zero request drops under burst loads.
- Implemented an interactive problem workbench integrating the **Monaco Code Editor**, real-time testcase execution drawers, and live contest standings powered by **WebSockets (Socket.IO)**.
- Designed a normalized relational database schema via **Prisma ORM & PostgreSQL**, optimizing query latency for problem directory filtering, submission histories, and Elo rating updates.

---

### ⚡ Option B: Backend & Distributed Systems Focus

**CodeArena — Distributed Sandboxed Code Execution & Judge Engine**  
*Node.js, Express, TypeScript, Docker, Linux cgroups, Redis, BullMQ, PostgreSQL, Prisma* | [GitHub Link](https://github.com/Ayushkr-iitm/Online-Judge)
- Developed a distributed judge engine capable of asynchronously compiling and executing untrusted code with microsecond precision, returning standardized verdicts (`AC`, `WA`, `TLE`, `MLE`, `RE`, `CE`).
- Hardened server security by implementing containerized sandboxing using **Docker, ephemeral read-only filesystems, and Linux process/memory limits (`pids-limit=32`)**, eliminating risks of resource exhaustion and sandbox escapes.
- Implemented a resilient producer-consumer queue with **Redis and BullMQ**, managing job priorities, automatic retries, and concurrent worker threads to sustain high throughput during timed contest bursts.
- Formulated an **Elo-based rating engine and ICPC-style scoring algorithm** calculating dynamic penalty scores and broadcasting real-time leaderboard updates over **WebSockets**.
- Secured REST endpoints with **JWT dual-token authentication (access + refresh tokens)**, bcrypt password hashing, and role-based access control (RBAC).

---

### 🎯 Option C: Compact 3-Bullet Version (For Dense 1-Page Resumes)

**CodeArena — Online Judge Platform** | *Next.js 14, TypeScript, Express, PostgreSQL, Redis, Docker*
- Engineered an end-to-end competitive programming platform supporting multi-language code execution (C++, Python, Java) with automated test case evaluation.
- Built a secure execution sandbox using **Docker and Linux cgroups** with strict CPU/memory limits, isolating untrusted user code and preventing fork bomb attacks.
- Designed an asynchronous submission pipeline leveraging **Redis and BullMQ**, enabling distributed workers to process thousands of queued jobs with live WebSocket updates.

---

## 2. Technical Skills to Tag in Your Resume Skills Section

- **Languages**: TypeScript, JavaScript, SQL, C++, Python, HTML5, CSS3
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Monaco Editor
- **Backend & APIs**: Node.js, Express.js, RESTful APIs, WebSockets (Socket.IO)
- **Databases & ORM**: PostgreSQL, SQLite, Prisma ORM, Database Modeling & Normalization
- **Systems & DevOps**: Docker, Linux (Processes, Signals, cgroups), Redis, BullMQ, Git, Monorepos

---

## 3. Interview Preparation: How to Explain This Project

When an interviewer asks: *"Tell me about the most technically challenging project you've built"*, use the following narrative:

### The Elevator Pitch (30 seconds)
> *"I built CodeArena, a distributed online judge platform inspired by LeetCode and Codeforces. It allows users to write code in an embedded Monaco editor, submit it, and receive automated verdicts in real time. The biggest technical challenge was safely executing arbitrary, untrusted user code while maintaining high system throughput during peak contest traffic."*

---

### Deep Dive Topics (What Interviewers Will Ask)

#### Q1: "How did you ensure security when running arbitrary user code?"
**Key Talking Points:**
- Untrusted code presents serious security vectors: fork bombs, infinite loops, memory leaks, filesystem tampering, and reverse shells.
- To counter this, I implemented multi-layer sandboxing:
  1. **Container Isolation**: Each submission runs in an isolated ephemeral Docker container with `--network none` to prevent socket communication.
  2. **cgroups Limits**: Linux cgroups enforce a strict memory ceiling (e.g. 256MB) and PID limits (`pids-limit=32`) to mitigate fork bombs.
  3. **Watchdog Timers**: A host watchdog timer monitors execution time and issues `SIGKILL` if a program exceeds the time limit (yielding `TIME_LIMIT_EXCEEDED`).
  4. **Filesystem**: The container root filesystem is mounted read-only, with only a temporary in-memory directory for compilation artifacts.

#### Q2: "Why did you use Redis and BullMQ instead of evaluating submissions directly in the HTTP request?"
**Key Talking Points:**
- Evaluating submissions synchronously inside the HTTP handler is an anti-pattern: compilation and running test cases take seconds, which would block server threads and trigger HTTP connection timeouts.
- During a contest where hundreds of users submit simultaneously, synchronous execution leads to server crashes.
- By decoupling ingestion from execution using **BullMQ on Redis**, the API acknowledges requests in under 20ms with a `PENDING` submission ID.
- Worker nodes independently pull jobs from the queue based on server capacity, ensuring smooth load leveling and zero dropped submissions.

#### Q3: "How does the Output Checker work?"
**Key Talking Points:**
- The checker evaluates stdout against expected output line-by-line.
- It strips trailing carriage returns (`\r`) and excess whitespace so submissions aren't unfairly penalized for Windows/Linux newline discrepancies.
- For floating-point problems, it uses an absolute/relative precision epsilon check (e.g., $|A - B| < 10^{-6}$).

#### Q4: "How does the real-time leaderboard scale?"
**Key Talking Points:**
- During live contests, polling the database for rankings every few seconds overwhelms the database.
- Instead, I implemented an event-driven architecture with **WebSockets**: when a judge worker marks a submission `ACCEPTED`, it publishes an event. The leaderboard service updates in-memory contest standings and broadcasts delta updates to connected participants over WebSocket rooms.
