# LMS vNext

The next-generation 42Students LMS, rebuilt as a GCP-native TypeScript modular monolith.

## Core stack

- Next.js + TypeScript
- React
- Tailwind CSS
- shadcn/ui conventions
- Zod
- Drizzle ORM
- PostgreSQL on Google Cloud SQL
- Google Cloud Identity Platform
- Google Cloud Storage
- Google Cloud Run

## Architecture principle

One repository, one application, one language, one relational database.

Business logic lives in domain modules rather than React components. Infrastructure is added only when a real production requirement needs it.

## Current status

The platform foundation, core tenant schema, authorization foundation, Identity Platform server-session architecture, Organizations, Colleges, and Departments backend paths are implemented and green in CI.

The immediate next phase is **People + Membership Management**.

## Continuation documents

A new ChatGPT session should read these before making changes:

1. `AGENTS.md`
2. `docs/handoff/2026-10-02-vnext-handoff.md`
3. `docs/planning/vnext-master-plan.md`
4. `docs/planning/vnext-execution-checklist.md`
5. `docs/core-platform-migration-map.md`
6. `docs/architecture.md`
7. `docs/migration-strategy.md`

The checklist is the operational source of truth for what is done and what should be implemented next.
