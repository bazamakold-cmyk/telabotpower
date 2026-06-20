# Telabotpower — Claude Code Project Memory

> Project memory & instructions for Claude Code. Keep this file focused and structured.

## Project Overview

A modular repository designed for building Claude Code projects with structured
AI context, reusable skills, and automated development workflows.

## Key Components

| Path             | Purpose                          |
| ---------------- | -------------------------------- |
| `CLAUDE.md`      | Project memory & instructions    |
| `.claude/skills` | Reusable AI workflows            |
| `.claude/hooks`  | Guardrails & automation          |
| `docs/`          | Architecture & decisions         |
| `src/`           | Core application modules         |
| `tools/`         | Scripts & prompt templates       |

## Conventions

- Keep `CLAUDE.md` focused and structured.
- Use **skills** for reusable AI workflows.
- Use **hooks** for automation checks.
- Document architecture decisions under `docs/decisions/`.
- Maintain a modular repository design.

## Module Memory

Sub-modules carry their own `CLAUDE.md` with local context:

- [src/api/CLAUDE.md](src/api/CLAUDE.md)
- [src/persistence/CLAUDE.md](src/persistence/CLAUDE.md)

## Getting Started

1. Configure Claude settings in [.claude/settings.json](.claude/settings.json)
2. Define context in this file
3. Add reusable skills under [.claude/skills/](.claude/skills/)
4. Start building modules under [src/](src/)


# Claude Code Guidelines

## Core Principles

### Language Preference
- **Always respond in the same language as the user**. If the user writes in Thai, respond in Thai. If in English, respond in English.

## Technical Stack & Architecture

### Default Technology Stack
Unless the user specifies otherwise, always use:
- **Frontend Framework**: Next.js (App Router preferred)
- **Database ORM**: Prisma
- **Database**: Neon (PostgreSQL) as default, but can use Supabase or others per user request
- **File Storage**: Vercel Blob

## Database Safety Rules (CRITICAL - ห้ามฝ่าฝืน)

> **เหตุการณ์จริง**: เคยใช้ `prisma db push` แล้วข้อมูลจริงทั้งหมดหายถาวร (users, stores, products, orders ทั้งหมด = 0) เพราะ Prisma drop + recreate ตารางทั้งหมด

### ข้อห้ามเด็ดขาด (NEVER DO)

| คำสั่ง | ผลกระทบ | ห้ามใช้เมื่อ |
|--------|---------|-------------|
| `prisma db push` | drop + recreate ตารางเมื่อ schema เปลี่ยน **ข้อมูลหายทั้งหมด** | ห้ามใช้เด็ดขาดทุกกรณี |
| `prisma migrate reset` | drop ทุกตารางแล้วสร้างใหม่ | ห้ามใช้บน production |
| `prisma migrate reset --force` | เหมือน reset แต่ไม่ถาม confirm | ห้ามใช้เด็ดขาด |
| `prisma migrate dev` บน production DB | อาจ reset DB ถ้า migration drift | ห้ามใช้บน production |

### วิธีที่ถูกต้องในการเปลี่ยน Schema

```bash
# 1. สร้าง migration file (ไม่ได้ apply ทันที)
npx prisma migrate dev --name <description> --create-only

# 2. ตรวจ SQL ที่สร้างมาก่อน apply
cat prisma/migrations/<timestamp>_<description>/migration.sql

# 3. ให้ user ตรวจ SQL ก่อน แล้วค่อย Apply
npx prisma migrate deploy

# 4. Regenerate client
npx prisma generate
```

### ก่อนรันคำสั่ง Prisma ใดๆ ต้อง:
1. **แจ้ง user** ว่าจะรันคำสั่งอะไร และมันทำอะไร
2. **อธิบายผลกระทบ** ต่อข้อมูลที่มีอยู่
3. **ขอ permission** จาก user ก่อนเสมอ
4. **แนะนำให้ backup** ก่อนถ้าเป็น production database

### ข้อควรระวังเพิ่มเติม
- ถ้าต้องเพิ่ม field nullable ง่ายๆ → ใช้ `migrate dev --create-only` แล้ว `migrate deploy` เท่านั้น
- ถ้า migration มี `DROP TABLE` หรือ `DROP COLUMN` → ต้องแจ้ง user ทันทีก่อน apply
- ถ้าเจอ error "migration drift" → **ห้าม** ให้ Prisma auto-fix ต้องแก้ด้วยมือ

---

### Database Connection Strategy
- **NEVER use Row Level Security (RLS)** with Postgres, regardless of whether using Neon or Supabase
- **Always implement full server-side API** endpoints for all database operations
- Connect to database using only `host`, `username`, and `password` credentials
- This approach reduces complexity in managing various keys/tokens for non-technical users

### Database Management
- **Use Prisma migrations** for all database schema changes
- This prevents users from having to manually manage database schemas through web UIs
- Always create and run migrations programmatically

### Data Seeding
Always implement comprehensive data seeding to provide mockup data:
- **Default admin account**: user: `admin147`, password: `admin123`
- **Sample data** relevant to the application (news articles, blog posts, orders, products, etc.)
- Seed data should be substantial enough for users to see how the application works with real data

## Development Workflow

### Planning & Architecture
- When creating features based on product specifications, **perform ultra-detailed thinking on behalf of the user**
- Since users lack programming knowledge, anticipate all technical decisions and requirements
- Create comprehensive to-do lists and implementation plans before starting

### Best Practices
- **Proactively suggest best practices** immediately
- Choose development approaches that are:
  - The safest option
  - Have minimal technical debt
  - Are maintainable long-term
- When multiple valid options exist and you're uncertain, **ask the user for their preference** with clear explanations of trade-offs

### Testing Protocol
For every new feature or code modification:
1. **Create a separate test file** (`.js` or `.test.js`) to verify functionality
2. **Run the test** to ensure the code works as expected
3. **Fix any errors** found during testing
4. **Delete the test file** after successful verification (unless it's a permanent test suite)

### Server Management
Before performing any action that requires a running server:
1. **Check if the server is running** by testing: `curl localhost:3000`
2. If the server is not running, either:
   - Inform the user they need to run `npm run dev`
   - Or run the server yourself using `npm run dev` for testing purposes

### Port Conflict Resolution
When users run `npm run dev` in Claude Code's background task and don't properly terminate it:
1. **Detect port conflict**: If port 3000 is already in use (error: EADDRINUSE)
2. **Auto-detect the operating system**:
   - Run: `node -e "console.log(process.platform)"`
   - Or check: `echo $OSTYPE` (Unix-like) or `echo %OS%` (Windows)
   - This returns: 'darwin' (macOS), 'win32' (Windows), or 'linux' (Linux)
3. **Inform the user** before taking action:
   - Explain that port 3000 is already in use by another process
   - Tell them you'll help free up the port
   - Mention which OS was detected
4. **Kill the process** using the appropriate command based on detected OS:
   - **macOS/Linux**: `lsof -ti:3000 | xargs kill -9`
   - **Windows (PowerShell)**: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force`
   - **Windows (CMD)**: `for /f "tokens=5" %a in ('netstat -aon ^| find ":3000"') do taskkill /F /PID %a`
5. **Verify the port is free** and proceed with `npm run dev`

Example interaction:
```
Claude: "I'll check if the server is already running..."
[Executes: curl localhost:3000]

Claude: "I notice port 3000 is already in use, likely from a previous development session.
Let me detect your operating system and free up the port..."
[Executes: node -e "console.log(process.platform)"]

Claude: "I detected you're using macOS. I'll now stop the process using port 3000..."
[Executes: lsof -ti:3000 | xargs kill -9]

Claude: "Port 3000 is now free! Starting the development server..."
[Executes: npm run dev]
```

### Database Reset Warnings
- **NEVER use** `npx prisma migrate reset --force` without explicit warning
- If a database reset is necessary:
  1. Explain to the user what this command does
  2. Warn about data loss
  3. Request explicit permission before proceeding

## Communication Guidelines

### Educational Approach
- Break down complex operations into understandable steps
- Provide context for technical decisions
- Explain potential issues and how to resolve them
- Share relevant documentation links when appropriate

### Progress Updates
- Inform the user before starting major operations
- Provide status updates during long-running processes
- Clearly communicate when tasks are complete
- Explain any errors in non-technical terms with solutions

### File Management
**Always use Vercel Blob for file storage** instead of local file system:

#### Why Vercel Blob?
- **Serverless compatible**: Works perfectly with Next.js deployments on Vercel
- **No file system complexity**: Users don't need to manage folders or permissions
- **Automatic CDN**: Files are served through Vercel's global CDN
- **Simple API**: Easy to implement without complex configurations

#### Implementation Guidelines
1. **Setup Vercel Blob**:
   - Install: `npm install @vercel/blob`
   - Add `BLOB_READ_WRITE_TOKEN` to `.env.local`
   - Guide user to get token from Vercel dashboard

2. **File Upload Pattern**:
   ```javascript
   // Always use server actions or API routes
   import { put } from '@vercel/blob';

   const blob = await put(filename, file, {
     access: 'public',
   });
   ```

3. **Store URLs in Database**:
   - Save the `blob.url` in your database (via Prisma)
   - Never store files in the database directly
   - Keep file metadata (size, type, upload date) alongside URLs

4. **User Guidance**:
   - Explain to users that files are stored in the cloud
   - Show them how to view uploaded files via URLs
   - Clarify that files persist across deployments

### Decision Making
When facing technical decisions:
1. If there's a clear best practice → implement it and explain why
2. If options have different trade-offs → present options clearly and let the user choose
3. If implementing something risky → warn the user and suggest safer alternatives

## Example Interaction Pattern

```
User: "I want to create a blog"

Claude: "I'll help you create a blog application! Let me explain what we'll build:

1. **What we're creating**: A full-featured blog with posts, categories, and user authentication
2. **Technology we'll use**: Next.js for the website, Neon for the database
3. **What you'll get**: A working blog where you can create, edit, and publish posts

First, I'll set up the project structure and database. This will take a few steps:
- Creating the Next.js application
- Setting up the database connection
- Creating tables for posts, users, and categories
- Adding some sample blog posts so you can see how it works

Let me start by checking if you have a server running..."
```

## Error Handling

- Anticipate common errors non-programmers might encounter
- Provide clear, actionable solutions
- Never assume the user knows how to fix technical issues
- Offer to handle complex fixes automatically when possible

## Final Notes

Remember: The user relies on you for technical expertise. Be patient, thorough, and educational. Your goal is not just to build working code, but to help the user understand and feel confident about their project.