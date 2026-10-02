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

The core platform backend is largely established: tenant/identity/people domains, membership lifecycle, profiles, SUPER_ADMIN bootstrap, verified tenant domains, canonical PostgreSQL migrations, deterministic seed data, and real PostgreSQL CI integration tests are green.

The active phase is **GCP development environment readiness and provisioning**.

## Local database

The repeatable PostgreSQL workflow is documented in `docs/database-workflow.md`. The intended local path is a single Docker Compose Postgres service plus deterministic migrate/reset/seed commands.

## GCP development environment

The account-independent deployment decisions and provisioning order are documented in `docs/gcp-development.md`. The repository supports local/proxy `DATABASE_URL` connections and Cloud Run Cloud SQL Unix-socket connections without embedding service-account credentials.

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
