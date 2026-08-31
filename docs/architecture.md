# ClubOps AI — Architecture

## Overview

ClubOps AI is built as a **monorepo** with three main layers:

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│  ┌─────────────────┐      ┌──────────────────────┐  │
│  │  Web (Next.js)  │      │  Mobile (Expo/RN)   │  │
│  │  TypeScript     │      │  TypeScript          │  │
│  │  Tailwind CSS   │      │  React Native        │  │
│  └────────┬────────┘      └──────────┬───────────┘  │
└───────────┼──────────────────────────┼──────────────┘
            │                          │
            └──────────┬───────────────┘
                       │ HTTP / REST API
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Backend (Express)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Routes   │ │Middleware│ │ AI Engine            │ │
│  │ Clubs    │ │ Auth     │ │ Meeting Processor    │ │
│  │ Events   │ │ RBAC     │ │ Risk Detector        │ │
│  │ Tasks    │ │          │ │ AI Agent             │ │
│  │ Meetings │ │          │ │ RAG Service          │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Firebase   │ │ Cloud      │ │ Firebase   │
│ Auth       │ │ Firestore  │ │ Storage    │
└────────────┘ └────────────┘ └────────────┘
```

## Multi-Tenancy & Security

Every document in Firestore contains a `clubId` field. The security model enforces:

```
User Token → Firebase Auth UID
         ↓
Club Membership Check (clubMembers collection)
         ↓
clubId access verified
         ↓
Resource accessed
```

Firestore security rules prevent cross-club data access. Backend middleware also verifies club membership on every API call.

## AI Architecture

```
User Input (web/mobile)
         ↓
    AI Agent
         ↓
Intent Detection → Tool Selection → Validation
         ↓                              ↓
   Gemini/OpenAI                  Permission Check
         ↓                              ↓
   Structured Output              Execute Tool
         ↓                              ↓
   Human Review? (Y/N)            Firestore Update
         ↓                              ↓
   Approve / Edit / Reject        Activity Log
```

### AI Components

1. **Meeting Processor**: Extracts action items from meeting notes/transcripts
2. **Risk Detector**: Analyzes tasks, events, and volunteer data for operational risks
3. **AI Agent**: Natural language → tool calling with permission validation
4. **RAG Service**: Document upload → chunking → embeddings → vector search

## Data Flow

```
Club Data + Meetings + Documents
         ↓
    AI UNDERSTANDS
         ↓
Identifies Tasks & Risks
         ↓
    HUMAN REVIEWS
         ↓
 AI / Application Performs Actions
         ↓
   Dashboard Updates (Real-time)
         ↓
   Web + Android Synchronized
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Mobile | React Native, Expo, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | Cloud Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| AI | Gemini / OpenAI (abstracted via provider pattern) |
| AI Provider Interface | `AIProvider` with `generateCompletion`, `generateStructured`, `generateEmbedding` |
| RAG | Custom chunking + embedding + cosine similarity search |
| Validation | Zod schemas |
| Icons | Lucide (web), emoji (cross-platform) |