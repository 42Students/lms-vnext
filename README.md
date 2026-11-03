# LMS vNext

The next-generation 42Students LMS, rebuilt as a GCP-native TypeScript modular monolith.

## How development works now

**Closure-first is mandatory for every coding chat, direct to `main`.**

**Current legacy parity objective (owner update, 2026-11-03):** [100% required UI-surface and functional-capability parity, NOT pixel copying](docs/planning/legacy-capability-parity-standard.md). Old screenshots are discovery evidence; preserve better vNext UX. Use legacy FE/BE code to catch every missing action/modal/state and verify end-to-end outcomes. Existing DB/API/security/browser/family gates remain mandatory.
 Read `AGENTS.md` and `docs/tracker.json.execution.closureFirstProtocol` before taking work. No exclusive worker lanes or claims are active; preserve evidence-based engineering acceptance. The old six-chat system, archived work queues and historical checkbox counts are not live progress.

- **One execution plan and live tracker:** [docs/tracker.json](docs/tracker.json) (`execution`, `tasks`, `phaseGates`) — five stages, open task selection and informational domain groups
- **Only live tracker:** [docs/tracker.json](docs/tracker.json) — DONE/NOT DONE only
- **Current global phase:** read `docs/tracker.json.currentPhase` (moving, not hard-coded in README); all independent phase gates remain required
- **Mandatory next-closure selection:** `npm run progress -- --closure-next` (all OPEN tasks, no worker assignment); then `npm run progress -- --check` to validate the tracker.
- **Progress and domain visibility:** `npm run progress`, `npm run progress -- --domains`, `npm run progress -- --roadmap`. Accepted task counts come only from `done:true` with executed evidence.
- **Continuation instructions:** `docs/tracker.json.execution.startupProcedure` and `.coordination`

**Mandatory closure loop:** choose one OPEN task, identify its precise missing gate and perform the smallest safe, coherent change. For functional database/runtime tasks, execute registered-PostgreSQL/producer/consumer/security acceptance on a disposable target. For tasks explicitly scoped to a source/staging/disposition *deliverable*, executed pinned source checks may close only that bounded stage; the separate named migration/runtime tasks remain OPEN. Immediately set `done:true` with executed exact-SHA evidence only for the task's original fulfilled scope, freeze it and select another. **After two useful passes with no closure, hand off the verified blocker and switch to an independent OPEN task.** Source-stage evidence never certifies deployed SQL, tenant safety or an integrated parent domain. Queued/cancelled CI and unrelated green runs never count as executed acceptance. The tracker, not a chat's prose, determines N/81.

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

The current execution focus is the first **unaccepted closure gate in `docs/tracker.json`**. The owner-approved UI direction is **complete every required old-LMS control, modal, state, role permission and real user job**, while keeping improved vNext UI/UX; no pixel-clone gate applies. Prior DB/API work still needs its exact-SHA acceptance proof and cannot be waived to declare UI or release green. Re-check the live phase and counters instead of treating this README as a status snapshot.

## Local database

The repeatable PostgreSQL workflow is documented in `docs/database-workflow.md`. The intended local path is a single Docker Compose Postgres service plus deterministic migrate/reset/seed commands.

## GCP development environment

The account-independent deployment decisions and provisioning order are documented in `docs/gcp-development.md`. The repository supports local/proxy `DATABASE_URL` connections and Cloud Run Cloud SQL Unix-socket connections without embedding service-account credentials.

## Continuation documents

For a new development session, read in this order:

1. `AGENTS.md`
2. `docs/tracker.json` — plan, domain groups, task acceptance, phase milestones
3. `npm run progress -- --closure-next` (every OPEN task is eligible)
4. the selected OPEN task's domain code, migration state, required gates and executed test evidence
5. `docs/tracker.json.execution.coordination` for current concurrency and fresh-main conflict-safety rules

`docs/planning/vnext-master-plan.md` and `docs/planning/vnext-execution-checklist.md` are **historical implementation references, not live progress trackers**. When they conflict, `AGENTS.md`, the closure-first strategy and `docs/tracker.json` control.
