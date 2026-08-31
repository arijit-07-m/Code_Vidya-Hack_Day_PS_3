# ClubOps AI

> **AI-powered operating system for college clubs that turns meetings, documents, and conversations into actionable work, detects operational risks, and helps teams execute tasks across web and Android from one centralized workspace.**

## Selected Problem Statement

**PS 3 — ClubOps AI**

## Problem Description

College clubs operate through scattered WhatsApp messages, spreadsheets, documents, meeting notes, and personal task lists. There is no centralized system to manage club operations, track tasks, identify risks, or coordinate volunteers. Important information gets lost, deadlines are missed, and club efficiency suffers.

## Proposed Solution

ClubOps AI provides a centralized AI-powered platform that centralizes clubs, members, events, tasks, volunteers, meetings, and documents; uses AI to understand meeting notes and extract actionable tasks; detects operational risks; provides an AI action agent; offers a RAG knowledge base; and synchronizes across web and Android in real-time.

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Web Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Mobile App | React Native, Expo, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | Cloud Firestore (Firebase) |
| Authentication | Firebase Authentication |
| Storage | Firebase Storage |
| AI Provider | Gemini / OpenAI (abstracted) |
| RAG | Vector embeddings on document chunks |
| Validation | Zod |

## Installation

```bash
git clone https://github.com/arijit-07-m/Code_Vidya-Hack_Day_PS_3.git
cd Code_Vidya-Hack_Day_PS_3
cd apps/web && npm install
cd ../../backend && npm install
```

Copy `.env.example` to `.env` and configure Firebase + AI keys.

### Run Web
```bash
cd apps/web && npm run dev
```

### Run Backend
```bash
cd backend && npm run dev
```

### Run Mobile
```bash
cd apps/mobile && npm run start
```

## Features

- Multi-club architecture with data isolation
- Role-based access (Owner, Admin, Event Head, Member, Volunteer)
- Club, Event, Task, Meeting, Volunteer management
- AI meeting analysis with human review
- AI risk detection with explanations
- AI action agent (natural language → safe actions)
- RAG knowledge base
- Realtime sync across web + Android

## Demo

See `docs/demo.md` for a complete walkthrough.

---

*Built for Code Vidya Hack Day*