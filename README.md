# LMS vNext

> **Database execution updated 2026-10-29:** [Domain Closure Protocol](docs/planning/database-domain-closure-protocol-2026-10-29.md) is the authoritative DB execution method. Run `npm run progress -- --domains` for the live package breakdown; `docs/tracker.json` is still the only acceptance tracker. Earlier DB scheduling descriptions below are superseded, not completion evidence.


The next-generation 42Students LMS, rebuilt as a GCP-native TypeScript modular monolith.

## How development works now

**Closure-first, direct to `main`.** The old six-chat system is retired; do not use lane files, issue #21–#26 assignments or historical work queues as live progress.

- **Execution strategy:** [Closure-first delivery](docs/planning/closure-first-delivery-strategy.md)
- **Only live tracker:** [docs/tracker.json](docs/tracker.json) — DONE/NOT DONE only
- **Current global phase:** DATABASE; API/UI/RELEASE require independent phase gates
- **Visible progress command:** `npm run progress` (read-only; original core eleven and total DONE/NOT DONE)
- **Continuation instructions:** [ChatGPT project instructions](docs/coordination/chatgpt-project-instructions.md)

Each engineering batch should integrate or repair a concrete runnable capability, run its acceptance tests on a disposable database, commit one cohesive change on fresh `main` and report exact evidence. Draft migrations and partially green CI jobs are **not** completed tasks.

## Core stack

- Next.js + TypeScript
- React
- Tailwind CSS
- shadcn/ui conventions
- Zod
- Drizzle ORM
- PostgreSQL on Google Cloud SQL
- First-party phone/email one-time-code sign-in (Exotel SMS, ZeptoMail email)
- Cloudflare R2 private object storage
- Google Kubernetes Engine (dev) / Cloud Run workflow

## Architecture principle

One repository, one application, one language, one relational database.

Business logic lives in domain modules rather than React components. Infrastructure is added only when a real production requirement needs it.

## Current status

The legacy-source feature skeleton is substantial, but database completion is determined by the strict binary tracker—not historical checklists or counts of drafted SQL. At the strategy adoption snapshot (2026-10-13): **6/81 DATABASE tasks DONE; 4/11 original core tasks DONE**. Consult `npm run progress` for the current repository snapshot; these numbers are **not** an estimate of authored-code coverage.

The immediate execution goal is **registered, cleanly replayable, acceptance-tested database integration**, beginning with upstream original-core requirements. No new production/API/UI phase readiness is implied by a preview or isolated staging test.

## Local database

The repeatable PostgreSQL workflow is documented in `docs/database-workflow.md`. The intended local path is a single Docker Compose Postgres service plus deterministic migrate/reset/seed commands.

## GCP development environment

The account-independent deployment decisions and provisioning order are documented in `docs/gcp-development.md`. The repository supports local/proxy `DATABASE_URL` connections and Cloud Run Cloud SQL Unix-socket connections without embedding service-account credentials.

## Continuation documents

For a new development session, read in this order:

1. `AGENTS.md`
2. `docs/planning/closure-first-delivery-strategy.md`
3. `docs/tracker.json`
4. the specific domain's active code, migration state and executed test evidence
5. `docs/coordination/chatgpt-project-instructions.md` for the exact single-tracker operating rules

`docs/planning/vnext-master-plan.md` and `docs/planning/vnext-execution-checklist.md` are **historical implementation references, not live progress trackers**. When they conflict, `AGENTS.md`, the closure-first strategy and `docs/tracker.json` control.
