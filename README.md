# ⚔️ CodeArena — Production Online Judge & Competitive Programming Platform

[![CI/CD Pipeline](https://github.com/Ayushkr-iitm/CodeArena/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayushkr-iitm/CodeArena/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/tests-51%20passing-brightgreen.svg)](https://github.com/Ayushkr-iitm/CodeArena)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14%20App%20Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

CodeArena is an enterprise-grade, full-stack Online Judge and Competitive Programming platform built end-to-end with **Next.js 14 App Router**, **Express TypeScript**, **Prisma ORM**, **Socket.IO WebSockets**, **BullMQ / In-Memory Worker Queues**, and a multi-language **Sandboxed Code Execution Engine** (C++, Python, Java).

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    Client["Client Browser (Next.js 14 Web)"] -->|HTTP / REST| API["Express API Gateway (Port 4000)"]
    Client <-->|WebSockets (Socket.IO)| WSHub["Real-Time Socket Hub"]
    
    API -->|Auth / CRUD| DB[(Database: SQLite / PostgreSQL)]
    API -->|Submit Job| QueueMgr["Queue Manager (BullMQ / In-Memory)"]
    
    QueueMgr --> WorkerPool["Worker Pool (Concurrency: 4)"]
    WorkerPool --> SecurityScan["Static Analysis Security Scanner"]
    SecurityScan --> DriverSelect{"Driver Selector"}
    
    DriverSelect -->|Docker Available| DockerSandbox["Docker Container Driver"]
    DriverSelect -->|Fallback| LocalProcess["Isolated Local Process Driver"]
    
    LocalProcess --> OutputChecker["Output Normalizer & Line-by-Line Checker"]
    OutputChecker --> VerdictCalc["Verdict Aggregator (AC, WA, TLE, RE, CE)"]
    
    VerdictCalc -->|Telemetry Stream| WSHub
    WSHub -->|Real-time Verdict & Leaderboard| Client
```

---

## ✨ Key Features & Capabilities

- **⚡ Isolated Execution Engine**:
  - Multi-language compilation & execution pipeline for **C++ (g++)**, **Python 3**, and **Java**.
  - Dual driver architecture: Docker container isolation with automatic fallback to ephemeral randomized process sandboxing.
  - Granular limits: Execution time limits (ms), memory caps (MB), and process timeouts.
- **🛡️ Sandbox Security Hardening**:
  - Proactive static analysis scanner intercepting dangerous syscalls (`system`, `fork`, `exec`), low-level network sockets (`socket`, `sys/socket.h`, `windows.h`), and process escape attempts.
  - Multi-tier API rate limiting with `express-rate-limit` protecting authentication, submission, and community endpoints.
- **🔄 Asynchronous Worker Queue**:
  - BullMQ with Redis persistence and automatic fallback to an in-memory priority FIFO queue.
  - Zero server blocking; submissions process concurrently in isolated worker slots.
- **📡 Real-Time WebSockets (Socket.IO)**:
  - Live execution telemetry streaming (`PENDING` -> `RUNNING` -> `ACCEPTED` / `WRONG_ANSWER`).
  - Real-time contest standings updates with ICPC scoring without page refreshes.
  - Live activity ticker showing platform-wide submissions in real time.
- **🏆 Timed Contest Engine & ICPC Scoring**:
  - Timed contests with start/end windows and participant registration.
  - Official ICPC penalty formula: `solvedMinutes + (attempts - 1) * 20` penalty minutes per rejected attempt before acceptance.
  - Automatic tie-breaking: problems solved first, lower penalty minutes second.
- **🌐 Community & Collaborative Learning**:
  - Threaded discussion boards with nested replies and upvoting/downvoting.
  - Community solution sharing with syntax-highlighted code and big-O time/space complexity tags.
  - Progressive hint reveals (💡 Hint 1, 2, 3) and curated official editorials.
- **💻 Monaco Code Editor Workbench**:
  - Full VS Code editing experience with dark theme, keyboard shortcuts, syntax highlighting, and boilerplate templates.
- **🧪 Comprehensive Test Suite (51/51 Passing)**:
  - Unit tests: Checker normalization, compiler diagnostics, queue lifecycle, ICPC scoring formulas, security scanner.
  - Integration tests: End-to-end auth flows, JWT sessions, community discussions, and voting logic.
  - E2E tests: Sandboxed execution pipeline across Python and C++.

---

## 📁 Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI/CD pipeline (Node 20, tests, build)
├── apps/
│   ├── api/                     # Backend Express server & judge engine
│   │   ├── prisma/              # Database schema, migrations, seed data
│   │   ├── src/
│   │   │   ├── app.ts           # Express app instance, security headers, rate limits
│   │   │   ├── judge/           # Sandbox drivers, compiler, runner, security scanner
│   │   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   │   ├── queue/           # BullMQ & In-Memory FIFO worker queue
│   │   │   ├── routes/          # Auth, problems, submissions, contests, community
│   │   │   └── socket/          # Socket.IO real-time event hub
│   │   └── tests/               # 51 unit, integration, and e2e test suites
│   └── web/                     # Next.js 14 App Router frontend
│       ├── public/              # Static assets
│       └── src/
│           ├── app/             # Problems, Contests, Leaderboard, Profile, Admin
│           ├── components/      # Monaco editor, discussions, solutions, stats
│           └── lib/             # API client, Socket.IO singleton
├── packages/
│   └── shared/                  # Monorepo shared types, interfaces, enums
├── Dockerfile.api               # Production multi-stage Docker build for backend
├── Dockerfile.web               # Production multi-stage Docker build for frontend
├── docker-compose.yml           # Full production stack (PostgreSQL, Redis, API, Web)
└── package.json                 # Monorepo root workspaces config
```

---

## 🚀 Quickstart Guide

### Option 1: Run Locally (Development Mode)

#### 1. Prerequisites
- **Node.js**: v18+ (tested on Node 20 & 24)
- **Compilers**: `g++` (for C++) and `python3` (for Python)

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Database Migration & Seeding
```bash
# Push Prisma schema to SQLite
npm run db:push

# Seed starter problems, contest, hints, and community discussions
npm run db:seed --workspace=apps/api
npm run --workspace=apps/api tsx prisma/seed-community.ts
```

#### 4. Run Automated Test Suite
```bash
npm test
```
*Executes all 51 Unit, Integration, and E2E test suites.*

#### 5. Launch Development Servers
```bash
# Terminal 1: Backend API (http://localhost:4000)
npm run dev:api

# Terminal 2: Frontend App (http://localhost:3000)
npm run dev:web
```

---

### Option 2: Run with Docker Compose (Production Mode)

Spin up the entire stack with a single command:

```bash
docker-compose up -d --build
```

Services initialized:
- **Web**: `http://localhost:3000`
- **API & WebSockets**: `http://localhost:4000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 🔑 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@codearena.com` | `admin123` |
| **Competitor** | `user@codearena.com` | `user123` |

---

## 🗺️ Roadmap & Milestones

- [x] **Step 1**: Monorepo Architecture & Project Scaffolding
- [x] **Step 2**: JWT Authentication & User Session Management
- [x] **Step 3**: Problem Management & Admin Creation Workbench
- [x] **Step 4**: Monaco Code Editor & Resizable Workspace
- [x] **Step 5**: Sandboxed Multi-Language Execution Engine
- [x] **Step 6**: Online Judge Pipeline & Output Normalization
- [x] **Step 7**: Redis + BullMQ Asynchronous Job Queue & Worker Pool
- [x] **Step 8**: Timed Contests & ICPC Standings Engine
- [x] **Step 9**: Socket.IO WebSockets & Real-Time Presence
- [x] **Step 10**: User Profiles, Rating Tiers & Global Leaderboard
- [x] **Step 11**: Community Discussions, Hint Reveals & Editorial Sharing
- [x] **Step 12**: Automated Testing Suite (Unit, Integration, E2E)
- [x] **Step 13**: Sandbox Security Scanner & Rate Limiting Hardening
- [x] **Step 14**: DevOps, Production Docker Compose & GitHub Actions CI/CD

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
