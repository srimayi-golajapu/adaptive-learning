# Adaptive Career Learning System

A personal, adaptive career-learning web application built with **Next.js (App Router)**, **Tailwind CSS**, and **Prisma ORM (SQLite)**.

Unlike static roadmaps, this engine constantly evaluates the learner's true mastery, dependencies, and memory retention to determine the absolute highest-value next action to reach their career goals.

## Core Features

- **Dynamic Skill Graph:** Maps domains (DSA, Python, SQL, System Design) into granular, hierarchical skills with strict prerequisite resolution.
- **Priority Recommendation Engine:** Calculates the next best action (`LEARN`, `PRACTICE`, `REPAIR_PREREQUISITE`, `REVISE`) based on mastery level, prerequisite blockers, and career relevance.
- **Spaced-Repetition Retention:** Implements an Ebbinghaus-style forgetting curve that penalizes retention scores over time, automatically triggering revision recommendations before critical skills are forgotten.
- **Failure Classification:** Analyzes incorrect practice attempts to diagnose the gap (`CONCEPT_GAP`, `IMPLEMENTATION_GAP`, etc.) and appropriately adjusts conceptual vs. practical mastery scores.
- **Placement Readiness Dashboard:** Aggregates underlying skill mastery to output a blended "Job Readiness" score, while flagging critical weaknesses blocking career targets.
- **PWA-Ready:** Fully installable as a Progressive Web App on desktop and mobile devices.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Database Setup
The project uses SQLite for an easy, zero-config local database. Apply the Prisma schema:
```bash
npx prisma db push
```

### 3. Seed the Database
Initialize the core curriculum (Domains, Skills, Prerequisites) and sample resources:
```bash
# Seed the core curriculum and learner state
npx prisma db seed

# Import external resources
npm run import-resources
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

## Deployment Architecture

This application is designed for easy deployment to platforms like **Vercel**. 

Because it currently relies on a local SQLite file (`dev.db`), deploying to serverless environments (where the filesystem is ephemeral) requires either:
1. Migrating to a serverless Postgres/MySQL database (e.g., Supabase, Vercel Postgres). You can do this by changing the `provider` in `prisma/schema.prisma` from `"sqlite"` to `"postgresql"` and updating your `DATABASE_URL` environment variable.
2. Using Turso (LibSQL), which provides a serverless SQLite edge database.

### Environment Variables
Create a `.env` file in the root directory for production deployments:
```env
# Example
DATABASE_URL="file:./dev.db"
```

## Documentation
- `src/lib/recommendation/priority-engine.ts` - Core Next Best Action logic.
- `src/lib/retention/engine.ts` - Spaced repetition and retention decay logic.
- `src/lib/placement/readiness.ts` - Aggregate job readiness logic.
