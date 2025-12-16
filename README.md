# ASTRALIS - Code Mind Map Generator

> **A**bstract **S**yntax **T**ree **R**endering **A**nd **L**ogic **I**nterpretation **S**ystem

A full-stack web application that helps developers understand code through AI-generated semantic flowcharts with multi-agent verification.

## ✨ Features

- 🧠 **Semantic Flowchart Generation** - Creates logical execution flow diagrams from source code
- 🔍 **Multi-Agent Verification System** - Dual LLM pass for hallucination-free output
- 🎯 **Deterministic Code Anchors** - Regex-based pre-scan ensures API calls, Effects, and Guards are never skipped
- 📊 **Intelligent Gap Filling** - Auto-detects and labels missing code sections
- 🔐 **User Authentication** - JWT-based login/register
- 💾 **Analysis Caching** - Save and revisit previous analyses

## 🚀 Intelligence Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Code Anchor Pre-Scan (Deterministic)                             │
│    └─ Finds: fetch(), useEffect, if (x) return ...                  │
├─────────────────────────────────────────────────────────────────────┤
│ 2. LLM Generator (Agent 1)                                          │
│    └─ Produces initial JSON flowchart with mandatory anchors        │
├─────────────────────────────────────────────────────────────────────┤
│ 3. Gap Validator (Mathematical)                                     │
│    └─ Fills missing line ranges with intelligent labels             │
├─────────────────────────────────────────────────────────────────────┤
│ 4. LLM Verifier (Agent 2 - Chain-of-Thought)                        │
│    └─ Audits flowchart against source code, fixes errors            │
└─────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, TypeScript, React Flow |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **AI** | OpenRouter API (Gemini 3 Pro) |
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
LLM_MODEL="google/gemini-3-pro-preview"
```

## 📄 License

MIT
