# ClubOps AI
> **AI-powered operating system for college clubs** that turns meetings, documents, and conversations into actionable work, detects operational risks, and helps teams execute tasks across web and Android from one centralized workspace.

## Problem Statement

**PS 3 — ClubOps AI** | Code Vidya Hack Day

College clubs operate through scattered WhatsApp messages, spreadsheets, documents, meeting notes, and personal task lists. ClubOps AI provides a centralized multi-club workspace with AI-powered meeting analysis, risk detection, natural language assistant, RAG knowledge base, and real-time cross-platform synchronization.

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Web | Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts |
| Mobile | React Native, Expo, TypeScript |
| Backend | Express, Node.js, TypeScript |
| Database | Cloud Firestore (Firebase) |
| Auth | Firebase Authentication |
| AI | Gemini / OpenAI (abstracted) |
| RAG | Custom embedding + cosine similarity |
| Validation | Zod |

## Features

- **Multi-Tenant Clubs**: Complete data isolation between clubs, auto-OWNER on creation, ownership transfer with TRANSFER confirmation
- **Custom Roles & Permissions**: 40+ granular permissions across 12 categories, custom role creation with checkbox UI
- **Event Management**: Create, track progress, status badges
- **Task Management**: 6 filters, priority levels, AI creation
- **AI Meeting Analysis**: Paste transcript → extracts action items + risks → human approval → database
- **AI Risk Detection**: Analyzes workload, deadlines, dependencies
- **AI Assistant**: Natural language commands → real Firestore actions with confirmation
- **RAG Knowledge Base**: Upload documents, AI answers with context
- **Analytics**: Recharts charts, completion progress, status breakdown
- **Cross-Platform**: Web + Android with real-time Firestore sync
- **Activity Logging**: All operations recorded with timestamps

## Quick Start

```bash
git clone https://github.com/arijit-07-m/Code_Vidya-Hack_Day_PS_3.git
cd Code_Vidya-Hack_Day_PS_3
cd apps/web && npm install
cd ../../backend && npm install
```

Copy .env.example to .env and configure Firebase + AI keys.

**Run Web**: `cd apps/web && npm run dev` (http://localhost:3000)
**Run Backend**: `cd backend && npm run dev` (http://localhost:3001)
**Demo Seed**: Login → visit /seed → click "Create Demo Data"

## Pages

| Page | URL | Features |
|------|-----|----------|
| Login | /login | Email/password |
| Signup | /signup | Create account |
| Dashboard | /dashboard | KPIs, AI Brief, Events, Tasks, Risks, Activity, Workload |
| Events | /events | Create, status badges |
| Tasks | /tasks | Create, 6 filter modes, status updates |
| Members | /members | Invite, manage access, remove |
| Volunteers | /volunteers | Member listing |
| Meetings | /meetings | AI transcript analysis with human approval |
| Documents | /documents | Document listing |
| Risks | /risks | Severity badges, recommendations |
| Announcements | /announcements | Create and view |
| AI Assistant | /ai-assistant | Natural language → real actions |
| Analytics | /analytics | Recharts bar chart, completion % |
| Settings | /settings | Members, Roles & Permissions, Ownership Transfer |
| Create Club | /clubs/new | Auto-OWNER |
| Seed Data | /seed | One-click demo data |
| Knowledge | /knowledge | RAG knowledge base |

## Architecture

```
Club Data + Meetings + Documents + Events + Tasks + Volunteers
                            ↓
                       AI ENGINE
                            ↓
                 ┌──────────┴──────────┐
                 ↓                     ↓
             INSIGHTS               ACTIONS
                 ↓                     ↓
           Risks, Summary       Create/Update Tasks
           Suggestions, Alerts  Assign, Generate
                 │                     │
                 └─────────┬───────────┘
                           ↓
                    HUMAN APPROVAL
                           ↓
                      APPLICATION
                           ↓
                   FIRESTORE DATABASE
                           ↓
                   WEB + ANDROID UI
```

## Project Structure

```
apps/web/         # Next.js app (17 pages)
apps/mobile/      # React Native / Expo
backend/          # Express API (routes, AI, RAG)
packages/         # Shared types, validation, config
firebase/         # Rules, indexes
```

## Team

Built for **Code Vidya Hack Day PS 3**.

<p align="center">Built with ❤️ for Code Vidya Hack Day</p>
