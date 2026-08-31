# ClubOps AI

> **AI-powered operating system for college clubs that turns meetings, documents, and conversations into actionable work, detects operational risks, and helps teams execute tasks across web and Android from one centralized workspace.**

## Selected Problem Statement

**PS 3 — ClubOps AI**

## Problem Description

College clubs operate through scattered WhatsApp messages, spreadsheets, documents, meeting notes, and personal task lists. There is no centralized system to manage club operations, track tasks, identify risks, or coordinate volunteers. Important information gets lost, deadlines are missed, and club efficiency suffers.

## Proposed Solution

ClubOps AI provides a centralized AI-powered platform that:

- Centralizes clubs, members, events, tasks, volunteers, meetings, and documents
- Uses AI to understand meeting notes and extract actionable tasks
- Detects operational risks before they become problems
- Provides an AI action agent that can safely perform application operations
- Offers a RAG knowledge base for club-specific information
- Synchronizes across web dashboard and Android mobile app in real-time

## Key Features

- **Multi-Club Architecture**: Support for multiple independent clubs with complete data isolation
- **Role-Based Access Control**: Owner, Admin, Event Head, Member, Volunteer roles
- **Event Management**: Full event lifecycle management
- **Task Management**: Create, assign, track, and manage tasks with priorities and dependencies
- **Volunteer Management**: Track skills, workload, and availability
- **Meeting Management**: Create meetings, add notes, upload transcripts
- **Document Management**: Upload and manage club documents
- **Risk Management**: AI-powered risk detection and recommendations
- **Announcements**: Create and manage club announcements
- **Activity Logging**: Complete audit trail of all operations

## AI Features

- **Meeting Analysis**: AI extracts action items, owners, deadlines, and priorities from meeting notes/transcripts
- **Human Review Workflow**: AI suggestions are reviewed, edited, and approved by humans before execution
- **Risk Detection**: AI analyzes events, tasks, deadlines, and workloads to identify operational risks
- **AI Action Agent**: Natural language commands that safely execute application operations
- **RAG Knowledge Base**: Upload documents, AI retrieves relevant information to answer questions
- **Volunteer Matching**: AI matches volunteers to tasks based on skills and workload
- **Announcement Generator**: Generate announcements with AI assistance
- **Daily Operations Brief**: AI-powered dashboard summary of urgent items

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Web Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Mobile App | React Native, Expo, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | Cloud Firestore (Firebase) |
| Authentication | Firebase Authentication |
| Storage | Firebase Storage |
| AI Provider | Gemini / OpenAI (abstracted) |
| RAG | Vector embeddings on document chunks |
| Realtime | Firestore realtime listeners |
| Validation | Zod |
| Icons | Lucide |
| Charts | Recharts |

## Architecture

```
Web (Next.js) ──┐
                 ├── Backend (Express) ──┐
Mobile (Expo) ──┘                       │
                                          ├── Firebase Auth
                                          ├── Cloud Firestore
                                          ├── Firebase Storage
                                          ├── AI Provider (Gemini/OpenAI)
                                          └── RAG (Vector DB)
```

## Multi-Tenant Security

All data is scoped by `clubId`. Firestore security rules and backend middleware enforce that users can only access data belonging to clubs they are members of. Cross-club data access is strictly prohibited.

## Installation

### Prerequisites

- Node.js 18+
- npm 9+
- Firebase project
- Gemini or OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/clubops-ai.git
   cd clubops-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your Firebase project and AI provider in `.env`

### Running Web Application

```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000)

### Running Backend

```bash
npm run dev:backend
```

Backend runs on [http://localhost:3001](http://localhost:3001)

### Running Android Application

```bash
npm run dev:mobile
```

Scan the QR code with Expo Go app.

## Environment Variables

See `.env.example` for all required environment variables.

## Demo Credentials

*Demo accounts will be created during deployment.*

## Screenshots

*Screenshots to be added after UI development.*

## Demo Scenario

1. Login as club owner
2. Open Code Vidhya Club
3. Open Hack Day event
4. Show dashboard with metrics
5. Upload/paste meeting transcript
6. Click "Analyze Meeting"
7. AI extracts action items
8. Human approves tasks
9. Tasks appear in task dashboard
10. Risk detector identifies issues
11. Open AI Assistant for natural language commands
12. AI creates tasks, assigns volunteers
13. Android app shows new tasks in real-time
14. Mark task complete on Android
15. Web dashboard updates automatically

## Team Members

- *Add team members here*

---

*Built for Code Vidya Hack Day*