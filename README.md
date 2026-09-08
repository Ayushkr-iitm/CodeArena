# ⚔️ CodeArena — Online Judge & Competitive Programming Platform

A modern, production-grade online judge and competitive programming platform built with Next.js 14, Express, TypeScript, Prisma ORM, and sandboxed code execution.

---

## 🏗️ Architecture & Tech Stack

- **Monorepo**: npm workspaces
- **Frontend (`apps/web`)**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend (`apps/api`)**: Node.js, Express, TypeScript, Prisma ORM, JWT Auth, Bcrypt, Zod
- **Shared (`packages/shared`)**: Shared TypeScript interfaces, types, and judge constants
- **Database**: SQLite for zero-config local development (seamlessly swappable to PostgreSQL)

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── api/             # Express REST API backend
│   │   ├── prisma/      # Database schema and seed script
│   │   └── src/         # Routes, middleware, controllers
│   └── web/             # Next.js 14 frontend
│       └── src/         # App router pages, components, lib
├── packages/
│   └── shared/          # Shared types, enums, constants
└── package.json         # Workspaces root
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 24)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 3. Setup Database
```bash
# Push Prisma schema to SQLite
npm run db:push

# Seed starter problems and test users
npm run --workspace=apps/api db:seed
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend API (http://localhost:4000)
npm run dev:api

# Terminal 2: Frontend App (http://localhost:3000)
npm run dev:web
```

---

## 📋 Default Credentials (from Seed)

- **Admin**: `admin@codearena.com` / `admin123`
- **User**: `user@codearena.com` / `user123`

---

## 🗺️ Roadmap

- [x] **Step 1**: Project Scaffolding, Monorepo Setup, Express API, Seeded DB, and Next.js Frontend
- [ ] **Step 2**: Authentication System & Global State Management
- [ ] **Step 3**: Problem Management & Admin Dashboard
- [ ] **Step 4**: Monaco Code Editor Integration
- [ ] **Step 5**: Sandboxed Code Execution Engine
- [ ] **Step 6**: Online Judge & Multi-verdict Evaluation
- [ ] **Step 7**: Redis + BullMQ Asynchronous Submission Queue
- [ ] **Step 8**: Timed Contests & Standings
- [ ] **Step 9**: WebSockets Real-Time Leaderboard
- [ ] **Step 10**: User Profiles, Elo Rating & Performance Heatmaps
- [ ] **Step 11**: Community Discussions & Editorial Sharing
- [ ] **Step 12**: Unit, Integration & E2E Testing
- [ ] **Step 13**: Security & Sandbox Hardening
- [ ] **Step 14**: Docker Compose & Cloud Deployment
