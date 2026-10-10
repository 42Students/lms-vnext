# LMS vNext

The next-generation 42Students LMS, rebuilt as a GCP-native TypeScript modular monolith.

## Six-chat development system

Use **"Continue chat 1 work"** through **"Continue chat 6 work"** to resume six interchangeable workers in the **same active project-wide phase**. Ask **"Chat 2 stats"** or **"All chat stats"** for live sourced progress. The [shared-phase operating system](docs/coordination/six-chat-operating-system.md) is authoritative; [Project instructions](docs/coordination/chatgpt-project-instructions.md) make short prompts work in new conversations.

All six work on **DATABASE across DB00–DB10**, then move together to **API parity**, then **UI parity**, then **RELEASE** only after global proof. Workers take temporary tasks from the [shared queue](docs/coordination/work-queue.json); a worker finishing a task claims the next unowned task in that same phase. [Global phase state](docs/coordination/phase-state.json) holds certification gates. [Chat checkpoints](docs/coordination/lanes) and GitHub issues #21–#26 persist handoffs.

`node scripts/six-chat-status.mjs`, `--lane 4`, and `--json` report **offline committed snapshots**, not live CI. For live stats refresh GitHub issues, checks, oracle SHAs, and repo HEAD.

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

The original core platform and major domain implementations are substantially authored, but **full database/API parity and current CI/runtime verification are still open**. The six-chat operating system coordinates source-backed backend-first closure. Historical checklist checkmarks and authored tests are not proof of current release readiness; consult the lane files, GitHub issues and current CI.

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
