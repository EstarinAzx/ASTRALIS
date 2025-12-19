# ASTRALIS - Code Mind Map Generator

> **A**bstract **S**yntax **T**ree **R**endering **A**nd **L**ogic **I**nterpretation **S**ystem

A full-stack web application that helps developers understand code through AI-enhanced semantic flowcharts with pattern-based parsing and drill-down visualization.

## ✨ Features

- 🧠 **Semantic Flowchart Generation** - Creates logical execution flow diagrams from source code
- 🔍 **Parser-First Architecture** - Reliable regex patterns generate baseline flowchart, LLM enhances narratives
- 🎯 **Drill-Down Sub-Flowcharts** - Double-click any function to see its internal logic
- 📊 **Decision Branching** - Proper YES/NO paths for guard clauses and if/else statements
- 🔐 **User Authentication** - JWT-based login/register
- 💾 **Analysis Caching** - Save and revisit previous analyses
- 🎨 **Interactive Inspector** - Click nodes to see highlighted source code

## 🚀 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. PATTERN PARSER (Deterministic - Primary)                         │
│    └─ Regex patterns detect: useState, useEffect, fetch, try/catch, │
│       if/return guards, async functions, useParams, navigate, etc.  │
├─────────────────────────────────────────────────────────────────────┤
│ 2. SUB-NODE PARSER (For Drill-Down)                                 │
│    └─ Parses internal logic of multi-line functions                 │
│    └─ Creates children nodes with proper edge connections           │
├─────────────────────────────────────────────────────────────────────┤
│ 3. LLM ENHANCER (Optional)                                          │
│    └─ Enriches narratives and logic tables                          │
│    └─ Falls back to parser-only if LLM fails                        │
├─────────────────────────────────────────────────────────────────────┤
│ 4. LLM VERIFIER (Optional)                                          │
│    └─ Audits flowchart accuracy against source code                 │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎨 Node Color Coding

All nodes use a unified rounded card design, differentiated by color and icon:

| Color | Usage | Examples |
|-------|-------|----------|
| 🔵 Blue | Imports, constants, setup | `import`, `const router` |
| 🟢 Green | State, hooks, success | `useState`, `useNavigate` |
| 🟠 Orange | Decisions, conditions | `if/else`, `switch`, guards |
| 🟣 Purple | Async, side effects | `fetch`, `await`, `useEffect` |
| 🔴 Red | Errors, exits | `catch`, `throw`, `return` |
| 🔷 Cyan | Rendering, output | `return <JSX>`, logging |

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, TypeScript, React Flow |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **AI** | OpenRouter API (configurable model) |
| **Auth** | JWT, bcrypt |

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase)
- OpenRouter API Key

### Installation

```bash
# Backend
cd backend
cp .env.example .env  # Configure LLM_API_KEY, DATABASE_URL, JWT_SECRET
npm install
npm run db:push
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
# Backend (.env)
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret"
LLM_API_KEY="sk-or-v1-..."
LLM_MODEL="nvidia/nemotron-3-nano-30b-a3b:free"  # Or any OpenRouter model
```

## 🔧 Pattern Coverage

The parser recognizes these code patterns:

- **Imports** - Grouped import statements
- **Interfaces/Types** - TypeScript type definitions
- **Express Routes** - `router.get()`, `router.post()`, etc.
- **Async Functions** - Arrow and regular async functions
- **React Hooks** - `useState`, `useEffect`, `useParams`, `useNavigate`, etc.
- **Guard Clauses** - `if (x) return ...;`
- **If/Else Blocks** - Multi-line conditionals with branches
- **Try/Catch** - Error handling blocks
- **API Calls** - `await fetch()`, Prisma queries
- **Method Calls** - `e.preventDefault()`, `obj.method()`
- **JSX Returns** - Component render output

## 📸 Screenshots

*Coming soon*

## 📄 License

MIT
