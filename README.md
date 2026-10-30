# LMS vNext

The next-generation 42Students LMS, rebuilt as a GCP-native TypeScript modular monolith.

## How development works now

**Closure-first is mandatory for every coding chat, direct to `main`.** Read `AGENTS.md` and `docs/tracker.json.execution.closureFirstProtocol` before taking work. Keep ten exclusive lanes, their claims and engineering acceptance intact. The old six-chat system, archived work queues and historical checkbox counts are not live progress.

- **One execution plan and live tracker:** [docs/tracker.json](docs/tracker.json) (`execution`, `tasks`, `phaseGates`) — five stages and ten parallel lanes
- **Only live tracker:** [docs/tracker.json](docs/tracker.json) — DONE/NOT DONE only
- **Current global phase:** DATABASE; API/UI/RELEASE require independent phase gates
- **Mandatory next-closure selection:** `npm run progress -- --closure-next` (or `--closure-next --lane=L03`); then `npm run progress -- --check` to validate the tracker.
- **Progress and exclusive lanes:** `npm run progress`, `npm run progress -- --lanes`, `npm run progress -- --lane=L03`. Accepted task counts come only from `done:true` with executed evidence.
- **Continuation instructions:** `docs/tracker.json.execution.startupProcedure` and `.coordination`

**Mandatory closure loop:** choose one OPEN task, identify its precise missing gate and perform the smallest lane-owned change. For functional database/runtime tasks, execute registered-PostgreSQL/producer/consumer/security acceptance on a disposable target. For tasks explicitly scoped to a source/staging/disposition *deliverable*, executed pinned source checks may close only that bounded stage; the separate named migration/runtime tasks remain OPEN. Immediately set `done:true` with executed exact-SHA evidence only for the task's original fulfilled scope, freeze it and select another. **After two useful passes with no closure, hand off the verified blocker and switch to an independent OPEN task.** Source-stage evidence never certifies deployed SQL, tenant safety or an integrated parent domain. Queued/cancelled CI and unrelated green runs never count as executed acceptance. The tracker, not a chat's prose, determines N/81.

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

The legacy-source feature skeleton is substantial, but database completion is determined by the strict binary tracker—not historical checklists or counts of drafted SQL. Consult `npm run progress` for current acceptance counts; historical authored-code statistics do not certify engineering acceptance.

The immediate execution goal is **registered, cleanly replayable, acceptance-tested database integration**, beginning with upstream original-core requirements. No new production/API/UI phase readiness is implied by a preview or isolated staging test.

## Local database

The repeatable PostgreSQL workflow is documented in `docs/database-workflow.md`. The intended local path is a single Docker Compose Postgres service plus deterministic migrate/reset/seed commands.

## GCP development environment

The account-independent deployment decisions and provisioning order are documented in `docs/gcp-development.md`. The repository supports local/proxy `DATABASE_URL` connections and Cloud Run Cloud SQL Unix-socket connections without embedding service-account credentials.

## Continuation documents

For a new development session, read in this order:

1. `AGENTS.md`
2. `docs/tracker.json` — plan, lanes, task acceptance, phase milestones
3. `npm run progress -- --closure-next --lane=LNN` (or without a lane to inspect all open candidates)
4. the selected OPEN task's domain code, migration state, required gates and executed test evidence
5. `docs/tracker.json.execution.coordination` for the live claim/handoff rules

`docs/planning/vnext-master-plan.md` and `docs/planning/vnext-execution-checklist.md` are **historical implementation references, not live progress trackers**. When they conflict, `AGENTS.md`, the closure-first strategy and `docs/tracker.json` control.
