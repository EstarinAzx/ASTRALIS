# ASTRALIS - Code Mind Map Generator

> **A**bstract **S**yntax **T**ree **R**endering **A**nd **L**ogic **I**nterpretation **S**ystem

A full-stack web application that helps developers understand code through AI-generated multi-layer visualizations.

## Features

- 📂 **Project Tree Browser** - Drag & drop folders, view file structure
- 🤖 **LLM-Powered Analysis** - Generates 6-layer "Code Mind Maps"
- 📊 **Rich Visualizations** - Mermaid diagrams, logic tables, code snippets
- 🔐 **User Authentication** - JWT-based login/register
- 💾 **Analysis Caching** - Save and revisit previous analyses

## ASTRALIS Layers

| Layer | Name | Description |
|-------|------|-------------|
| 0 | Imports | Dependencies table |
| 1 | Summary | What & Why + complexity score |
| 2 | Journey | Plain English execution flow |
| 3 | Diagram | Mermaid.js visualization |
| 4 | Logic Table | Sectioned step-by-step breakdown |
| 5 | Code Map | Snippets with line numbers |

## Tech Stack

**Frontend:** React 19, Vite, TailwindCSS v4, TypeScript  
**Backend:** Node.js, Express 5, Prisma, PostgreSQL  
**Auth:** JWT, bcrypt

## Getting Started

```bash
# Backend
cd backend
cp .env.example .env  # Configure DATABASE_URL and JWT_SECRET
npm install
npm run db:push
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## License

MIT
