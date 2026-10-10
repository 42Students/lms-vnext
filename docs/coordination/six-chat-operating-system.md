# LMS vNext — Six-chat operating system (v1)

**Canonical repository:** `42Students/lms-vnext` · **shared branch:** `main` · **source of truth:** committed code, per-lane checkpoints, six GitHub issues, and domain/parity ledgers.
**Effective:** 2026-10-10 IST. **Current phase:** DATABASE + API parity FIRST; defer broad UI polish/clone closure until domain producer→consumer contracts are proven.

This document is the **entry point** for a new ChatGPT conversation, even if the previous conversation is inaccessible. Existing scope and single-writer rules in [six-chat-closure-plan.md](../planning/six-chat-closure-plan.md) remain binding. This operating system changes execution *order*, not ownership. No chat or issue automatically starts another chat.

## 1. Short commands (case-insensitive)

- **`continue chat 1 work`** through **`continue chat 6 work`**: assume that exact fixed lane; read fresh GitHub state and its issue/ledger; resume the highest-priority unblocked **database/API** item; implement, test if runnable, commit safely and checkpoint. Do not ask which lane or replan from zero.
- **`chat 1 stats`** through **`chat 6 stats`**: report the chosen lane's fresh committed work, outstanding scope, evidence, blockers and next item. Read the lane record, its issue/comments, latest `main`, and the relevant source ledgers; **do not make code changes** unless separately requested.
- **`all chat stats`**, **`six chat stats`**, **`overall vnext stats`**: aggregate the six lane records and issue activity and the latest global parity/database scripts. Identify dated/stale snapshots and never average incompatible percentages.
- **`what is chat N doing?`**: show owner, scope, last evidenced checkpoint, blockers and next work.
- **`handoff chat N`**: update just that lane's checkpoint and issue with enough exact links/SHAs to resume in a fresh conversation.
- **`continue chat N and close everything`**: work through as much of the lane's actual owned backlog as current session/tools allow, checkpoint honestly; do not claim continuing after the conversation ends.

A brand-new conversation can use these short commands **when it has this operating system in its ChatGPT Project instructions or first reads this repository document**. Without that context, the user can add: `in 42Students/lms-vnext, follow docs/coordination/six-chat-operating-system.md`.

## 2. Fixed lanes — do not dynamically reassign

| Chat | Lane / Issue | DB ownership | API and non-UI scope |
|---|---|---|---|
| **1** | W01 / [#21](https://github.com/42Students/lms-vnext/issues/21) | DB00–DB04 + sole registered migration-journal/schema-barrel integrator | Shared platform identity, tenancy, academics, group/electives, profile verification, authorization, CI/PG/GCP |
| **2** | W02 / [#22](https://github.com/42Students/lms-vnext/issues/22) | DB05–DB06 | Courses, content, assignments, quizzes, grading, attendance and Learner/Faculty delivery |
| **3** | W03 / [#23](https://github.com/42Students/lms-vnext/issues/23) | DB07 | Project templates, teams, sprints, tasks, workspace, Mentor workflows, reviews, deliveries |
| **4** | W04 / [#24](https://github.com/42Students/lms-vnext/issues/24) | DB08 | Placement eligibility, cohorts/batches, applications, screening, rounds, interviews, offers, outcomes |
| **5** | W05 / [#25](https://github.com/42Students/lms-vnext/issues/25) | DB09 | Recruiter/TPO relationship, leads/CRM, invites, HR non-Drive workflows, reports/settings |
| **6** | W06 / [#26](https://github.com/42Students/lms-vnext/issues/26) | DB10 | Shared notification/audit/outbound/scheduled operations, Admin backend, tenant setup and shared/public workflows |

**Boundary:** W04 owns Drive/applicant/offer semantics; W05 owns CRM and recruiter invitation lifecycle; W06 owns notification/outbound transport; W01 owns core identity and all numbered Drizzle migration registration. Cross-domain dependencies are posted to the owner issue and consumed through explicit contracts. Existing UI remains preserved, not deleted.

## 3. Mandatory resume algorithm — every new chat

1. Identify lane from the command **before** writing code. State the lane and issue. A new chat replaces an old conversation; it does **not** create a seventh lane.
2. Read current `main` SHA, `AGENTS.md`, **this file**, [six-chat-closure-plan.md](../planning/six-chat-closure-plan.md), `docs/coordination/lanes/chat-NN.json`, its issue **including recent comments**, and lane-specific source/backend/page ledgers. Check open PRs and recent merged commits. Verify fresh `lms/prod-2026` and `lms2-fe/prod-2026` SHAs.
3. Reconcile stale checkpoints against real commits; use current code, not chat recollections, as truth. If a checkpoint points to an unmerged branch, say so and inspect its PR. **Never overwrite peers' newer `main`.**
4. Take the next unblocked owned **DB-first/API-first** task: active legacy persisted fields/relationships → vNext mapping/retirement → staged schema+invariants → W01 migration+empty-PG replay → service/API/user-job equivalence → tenant/role/concurrency tests → UI consumption later. Work vertically within the domain; avoid blind physical 1:1 legacy-table duplication.
5. Implement code and focused regressions. Validate `npm ci`, lint, typecheck, unit, build, disposable PostgreSQL, API integration, and browser tests as applicable. Mark `NOT_EXECUTED` or `BLOCKED` where unavailable. Do not mark a test passing because it was authored.
6. Commit a cohesive batch to **current** `main` without force push; or use a narrow PR and **verify its merge**. Re-fetch HEAD/target file SHA for surgical concurrent updates. Only W01 touches `drizzle/**`, `src/db/schema/index.ts`, root package/CI/shared core. W02–W06 stage their own SQL for W01.
7. Update **only** `docs/coordination/lanes/chat-NN.json` and the owned issue comment with a factual checkpoint: exact SHAs, changes, source counts, verified fields, mapped APIs, tests executed/pass/fail/blocked, blockers, cross-lane handoffs and one precise next action. Update domain/UI trackers where the evidence actually changed.
8. Re-read newest `main`, ensure the checkpoint exists there, and report to the user. If the chat becomes too long, the next chat can resume from the issue + checkpoint without the conversation.

## 4. Durable status data

Each chat **alone** updates its corresponding file:

`docs/coordination/lanes/chat-01.json` ... `chat-06.json`.

`node scripts/six-chat-status.mjs` gives an offline summary from those committed files and current detailed page specs; use `--json`, `--lane 4`, or both. This script **does not access GitHub** or execute tests. For a live status answer, fetch the latest issue, commit/PR and checks in addition to the script. Do not use JSON snapshot data as real-time CI evidence.

Per-lane status stores: stage, last checkpoint, exact source SHAs, legacy candidate tables/fields, formally verified semantic fields, mapped and **passing** API tests (nullable when not yet measured), quality gates, blocker list, and handoffs. **Null means not measured**, not zero. `fieldSemanticsVerified: 0` can coexist with substantial authored code.

**On a `chat N stats` request, always state:**

- lane, issue, latest `main` SHA and status-checkpoint freshness;
- candidate tables/fields, dispositioned/verified fields (if measured), remaining known blocking items;
- required/mapped/API-tested operations (or **not enumerated yet**);
- authored vs executed vs passing tests separately;
- last merged commits/PRs; current blockers and top next item;
- **no invented overall completion percentage**. Percentages require an explicit complete denominator, validation definition and fresh evidence.
- For all-six stats, show one row per chat, then global database+page parity, CI and release-gate truth.

## 5. Stage gates

1. `DB_DISCOVERY`: enumerate active historical tables/fields, relationships and state machines; classify retired/backup fields explicitly.
2. `DB_IMPLEMENTATION`: implement normalized persisted structures and constraints; owner writes staged SQL, W01 registers and tests migrations.
3. `API_IMPLEMENTATION`: enumerate legacy service operations/endpoints **plus UI-only user jobs**, implement current vNext contracts with auth/tenancy/business semantics.
4. `BACKEND_CERTIFICATION`: replay migrations; prove transactional/negative/race/contract and cross-role integration; close only with execution evidence.
5. `UI_CLONE_PARITY`: legacy page/section/action/modal/state/browser parity after its backend producer is certified.
6. `RELEASE_VERIFICATION`: global source freeze, zero unresolved required parity, full tests, live cloud/auth/storage and launch gates.

Stages can overlap for unblocked slices, but **do not expand UI scope to conceal missing DB/API contracts**. An existing UI route does not prove backend parity. A stage may be `IN_PROGRESS` with blockers; do not silently promote it.

## 6. Collision and safety protocol

- Shared branch `main`, **non-force** changes only; one user-job owner per lane.
- Per-chat JSON is single-writer. Another lane may read it but must request changes through the corresponding issue.
- Shared account parity rows are changed surgically against current SHA; never replace the entire matrix with a stale copy.
- No branch/issue/comment implies a worker is running. ChatGPT conversations do not automatically wake each other or run after they end. A user opens a new chat to resume.
- Do not report deployment, test success, email sent, migration promoted, or checklist completion without evidence.
- Do not count legacy backup tables as active requirements or invent feature-coverage percentages.
- When conflicts or absent access prevent a GitHub write, say exactly what is uncommitted, and provide an actionable handoff rather than claiming persistence.

## 7. ChatGPT Project setup and names

Recommended: create one **ChatGPT Project** called **LMS vNext — Six Chats** and put the text of [chatgpt-project-instructions.md](chatgpt-project-instructions.md) into the Project instructions. Move the six existing chats there if available, or start new chats inside the Project. Project instructions give a fresh conversation the routing context without requiring a long prompt.

Suggested chat titles:
- `LMS vNext | Chat 1 | Platform & Database`
- `LMS vNext | Chat 2 | Courses & Assessments`
- `LMS vNext | Chat 3 | Projects & Mentor`
- `LMS vNext | Chat 4 | Placements`
- `LMS vNext | Chat 5 | TPO & HR CRM`
- `LMS vNext | Chat 6 | Admin & Shared Ops`

A GitHub commit **cannot rename ChatGPT conversation titles**, and no connected conversation-title editing action is available in this workflow. Rename a chat in ChatGPT's sidebar manually where supported; do not claim this happens automatically.

## 8. Acceptance checks for this coordination layer

- Six lane records exist with unique chat numbers, issues and domain ownership.
- `node scripts/six-chat-status.mjs` validates them and outputs all six; `--lane N` resolves exactly one.
- A fresh chat reading this document can resume a lane and checkpoint it without seeing the previous conversation.
- A status query produces source-backed counts and clearly distinguishes **not measured** from **verified zero**.
- No migration ownership conflicts or fake test-pass claims.
