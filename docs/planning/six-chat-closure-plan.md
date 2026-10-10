# LMS vNext — Six-chat remaining-work closure plan

**Effective:** 2026-10-10 IST  
**Destination:** `42Students/lms-vnext@main` — never force-push  
**Legacy oracles:** `42Students/lms@prod-2026`, `42Students/lms2-fe@prod-2026`; record exact fresh SHAs per evidence batch  
**Coordination:** GitHub issues [W01 #21](https://github.com/42Students/lms-vnext/issues/21), [W02 #22](https://github.com/42Students/lms-vnext/issues/22), [W03 #23](https://github.com/42Students/lms-vnext/issues/23), [W04 #24](https://github.com/42Students/lms-vnext/issues/24), [W05 #25](https://github.com/42Students/lms-vnext/issues/25), [W06 #26](https://github.com/42Students/lms-vnext/issues/26).  
**Purpose:** six independent chats with clear, complete database/service/API/UI/test ownership and deliberate shared-file integration. This plan does not itself start or send messages to any other conversation.

## Source-of-truth caveat

As of the preceding 2026-10-10 audit, the high-level checklist counted 421 checked / 23 partial / 68 open of 512. The UI parity matrix marked only 10 of 323 surfaces DONE (149 partial, 128 missing, 16 verify, 8 blocked, 12 retired). Five database source-audit passes inventoried 199 historical table candidates and 2,829 source-derived fields, but **no global runtime semantic verification**. Drizzle had 41 registered migrations and a 90-table snapshot; test files are not passing-test evidence. Treat all counts as dated snapshots: refresh `main` and run status tools for current truth. This is **not** an 82%-complete LMS release claim.

## Six ownership lanes

| Lane and issue | Exclusive domain and account work | Completion focus | Must not implement independently |
| --- | --- | --- | --- |
| **W01 / Chat 1 (this chat)** [#21](https://github.com/42Students/lms-vnext/issues/21) | DB00 historical disposition, DB01 identity/tenancy, DB02 academic base, DB03 groups/electives, DB04 profiles/verification; central migration integrator; common authorization; CI/GCP setup | Finish 79 DB03 and 103 DB04 field semantic crosswalks; DB00/01/02 gap triage; DB03 joins/leaves/permissions; DB04 review/consent/privacy; full migration replay and central smoke/CI | Course, project, placement, CRM and admin-page UI logic |
| **W02 / Chat 2** [#22](https://github.com/42Students/lms-vnext/issues/22) | DB05 courses/content and DB06 assessments/attendance; Learner and Faculty course/learning/quiz/assignment/schedule/attendance/profile surface fidelity; assessment delivery within Admin | Lessons, video, course detail, quiz due/attempt/result, assignment submission, feedback, attendance, calendar, report and fine-grained states; producer→consumer tests | Learner Projects and Placements; admin master-data CRUD; shared migration journal |
| **W03 / Chat 3** [#23](https://github.com/42Students/lms-vnext/issues/23) | DB07 projects; Mentor account; project-specific Learner, College Admin and Super Admin pages | Templates→materialization→workspace, teams, tasks, sprints, resources, meetings, delivery, grading, activity, permissions, responsive/browser checks | Non-project pages and shared storage/IAM provisioning |
| **W04 / Chat 4** [#24](https://github.com/42Students/lms-vnext/issues/24) | DB08 placement policy/outcomes; Learner placements; TPO/HR Drives; College/Super Admin placement surfaces | Batch/class/learner eligibility inheritance, registration, job/drive publishing, applicants, rounds, shortlist, interviews, offers, joining, external outcomes and cross-account lifecycle | CRM leads/company/outreach/report presentation, notification outbox, shared journal |
| **W05 / Chat 5** [#25](https://github.com/42Students/lms-vnext/issues/25) | DB09 TPO and recruiter ops; non-drive TPO/HR surfaces; recruiter invites; companies, leads, CRM, settings, calendar, messages and reports | 31 source table candidates/279 fields, recruiter relationship and invite safety, policy visibility, lead board, TPO/HR reports and settings, browser parity | Core placement Drive/applicant/offer implementation, shared outbox/SMS, central authorization |
| **W06 / Chat 6** [#26](https://github.com/42Students/lms-vnext/issues/26) | DB10 shared ops; non-course-delivery, non-project, non-placement College Admin and Super Admin pages; shared/public/marketing; notifications, activity, bug tracker, audit and scheduled operations | Admin dashboard, departments/programs/semesters/batches/classes/electives UI and people CRUD, tenant setup/settings UI, announcements, tracker pages/overlays, shared notifications, audit logs, states/accessibility | DB03/04 schema and common auth, course/assessment delivery, project pages, placement pages, CRM |

### Hard boundary by *user job*, not simply role or directory

- A TPO **Drive detail Applicants/Rounds/Offers** is W04; TPO **Leads/Companies/Reports/Settings** is W05.
- College Admin/Super Admin **Projects** is W03; **Placements** is W04; **course delivery, lesson/quiz/assignment/attendance/report** is W02; **academics master CRUD, people and tenant controls** is W06; persisted **group/elective and verified-profile domain contracts** are W01.
- Learner **Projects** is W03; **Placements** is W04; all remaining Learner courses, quizzes, calendars, attendance and profile UI is W02. W01 owns the DB04 identity/private-document backend contract consumed by W02/W06.
- Mentor non-project redirect/retired aliases are handled by W03. HR recruiter invites and CRM messaging belong to W05; placement-event delivery data belongs to W04. W06 owns shared notifications/outbox, and feature owners call that public contract.
- W01 owns cloud Identity Platform, common tenant guard and reusable storage infrastructure. Feature owners own their feature's upload/download authorization, UI and workflow; do not duplicate infrastructure services.
- When a page combines two domains, designate a primary owner by its main user job and have the second owner provide a tested API contract. **Never** both edit the same feature implementation independently.

## Protected shared files: single-writer policy

1. **W01 only** writes `drizzle/*.sql`, `drizzle/meta/**`, `src/db/schema/index.ts`, shared database connection/authorization primitives, central workflows and root `package.json`/lockfile, CI pipeline and cloud provisioning configuration. Domain owners author their domain's separate schema files, standalone source-ledger entries, and **staged SQL drafts** in `scripts/sql/` or `docs/planning/sql/`. Ask W01 to allocate the next migration number, integrate/replay the full journal and schema barrel, then test against latest `main`. This trades some integration capacity for zero migration-number collisions.
2. Each domain owner exclusively edits its `src/modules/<domain>` and feature pages. If a helper is truly shared, W01 supplies platform-level helpers and W06 supplies shared-ops helpers; consume rather than fork them.
3. All chats may need the **single** `docs/planning/account-surface-parity.md` file, `docs/planning/legacy-ui-route-manifest.md`, and `docs/parity/*.md`. These are exceptions to directory claims: fetch the newest `main`, change **only personally owned table rows or sections**, preserve others' progress and use expected-SHA compare-and-swap. If the head moves, re-read and reapply surgical edits. Do not overwrite the file using an older working copy.
4. Domain-specific ledgers/test files belong to that lane. The global `docs/planning/database-parity-master.md`, global domain inventory and this six-chat plan are owned by W01; feature owners update their own domain ledger and raise a small explicit cross-domain request/issue rather than rewriting the master.
5. Do not resolve overlaps by silently changing public signatures. Post a handoff on the workstream issue that includes types, endpoint, affected consumer, exact commit SHA, and tests needed.

## Required order within EVERY lane

1. Check `main` HEAD, current CI, and the latest `lms/prod-2026` and `lms2-fe/prod-2026` SHAs; read `AGENTS.md`, `docs/planning/database-parity-master.md`, `docs/planning/clone-parity-protocol.md`, this plan, the lane's issue, and account/domain trackers.
2. Enumerate the legacy persisted fields, relationships, state transitions and *every* relevant page/tab/modal/action/state before marking a page ready. Preserve legacy user job; normalize schema safely where justified.
3. Implement **schema/domain invariants first** (tenant, actor, FK, concurrency, atomic transactions, privacy). Domain owners can stage isolated SQL and related module code while W01 controls registered migrations.
4. Implement services, APIs, transactions and explicit producer→consumer user journeys; don't build a polished UI on missing persistence.
5. Implement exact UI workflow and verify desktop/mobile behavior including navigation, states and permissions. Update source ledgers and detailed page checks **in the same coherent commit**.
6. Execute `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, relevant `npm run test:db` on disposable PostgreSQL, and `npm run test:e2e` / focused browser runs. When unavailable, record exact blocker and leave release gates OPEN; authored test files are not passing evidence.
7. Commit to latest `main` with expected-SHA / non-force push when feasible. If high-contention prevents it, prepare a narrow non-overlapping PR and **verify** its merge to `main` before claiming completion. No stale branch full-tree merges and no overwriting another chat's changes.
8. Rerun `npm run parity:status`, `npm run parity:pages`, `npm run parity:learner` (Learner work), `npm run db:parity:status`, and `npm run parity:clone-gate`; attach output or honestly mark unavailable. Formal DONE requires both behavior **and** evidence.

## Execution phases and handoffs

**Phase A — Database and contract gaps (all six chats immediately).**
W01 establishes disposable PostgreSQL/CI and DB00–04; W02–06 enumerate and implement their own DB05–10 source-backed field contracts and domain services in parallel. Feature owners may stage migrations; only W01 registers/replays them. Unblocking cross-workstream requests should be tiny and explicit.

**Phase B — End-to-end API workflow slices.**
Each lane proves one entire workflow across producer, persistence and consumer; test concurrency and wrong-tenant/wrong-role negative cases. Prefer working slices to fabricated checkbox totals.

**Phase C — Role/page clone parity.**
Close all `docs/parity/` page contracts, route sections, dialogs, mobile and browser behavior; freshness proofs record exact legacy SHA. Cross-domain pages are reconciled in the single owner lane listed above.

**Phase D — Shared release gate.**
W01 consolidates evidence, W06 tests cross-role/shared behavior, and every feature owner validates its own workflows. No release-ready claim until `npm run parity:status` and `npm run parity:pages` report zero unresolved rows, `npm run parity:clone-gate` says READY: YES, schema/semantic ledger is signed off, PostgreSQL and browser suites pass, and infra/storage/identity dependencies are actually ready. Greenfield means **no legacy user data migration**.

## Status reporting (do not fabricate percentages)

Each issue update should report:
- Current `main` SHA; exact legacy FE/BE SHAs used; current code commit or merged PR.
- For its domain: candidate tables/fields; proposed paths; reviewed; runtime-semantic-verified; approved retirements; remaining blockers.
- For its owned UI: DONE/PARTIAL/MISSING/VERIFY/BLOCKED counts, and **page-contract checked/open** counts.
- Tests: authored versus executed versus passing; runner/DB/browser availability separately.
- What closed in this batch, which precise user jobs are next, and requests to other owners.

**No chat can message the other five chats directly.** The user must start/paste the relevant lane brief in each; collaboration happens through `main`, per-lane issues and docs. A GitHub issue is not a running worker.

## Copy/paste chat starters

### Chat 1 (this conversation; W01)
```text
Continue LMS vNext as W01, the platform, DB00–04, shared migration and CI owner. Read docs/planning/six-chat-closure-plan.md and GitHub issue #21; fetch latest main and legacy prod-2026 SHAs. Own registered Drizzle migrations, schema barrel, DB03 group/elective and DB04 profile verification semantic closure, core tenant/identity auth, disposable PostgreSQL and CI. Work on main without force pushing; preserve parallel W02–W06 code. Implement and test source-backed invariants, register staged migrations from other lanes safely, publish real passing evidence; do not mark unrun tests verified. Continue first open W01 blocker and commit cohesive batches.
```

### Chat 2 (W02)
```text
Continue LMS vNext as W02, learning and assessment owner, GitHub issue #22. Read docs/planning/six-chat-closure-plan.md; inspect latest main, AGENTS.md, DB05/DB06 inventories, exact legacy FE/BE prod-2026, Learner and Faculty parity trackers. Complete DB05 courses/content and DB06 assessments/attendance, Learner/Faculty non-project/non-placement pages, every lesson/quiz/assignment/calendar/attendance tab/modal/state, and regression tests. Stage migration SQL for W01 rather than editing drizzle journal. Update owned parity rows, merge safe commits to main, report verified vs blocked tests and next open row.
```

### Chat 3 (W03)
```text
Continue LMS vNext as W03, Projects/Mentor owner, GitHub issue #23. Read docs/planning/six-chat-closure-plan.md and latest main and legacy prod-2026. Close DB07 project schema, permissions and state machines, mentor account and all project-specific learner/admin/super-admin pages: templates, workspaces, teams, sprints, tasks, resources, meetings, activity and delivery. Do deep source parity, role/tenant/concurrency tests and browser/mobile checks. Stage SQL for W01 and never touch others' features or migration journal. Update page/domain ledgers and commit verified batches to main.
```

### Chat 4 (W04)
```text
Continue LMS vNext as W04, Placement execution owner, GitHub issue #24. Read docs/planning/six-chat-closure-plan.md and current DB08 source ledger, latest main and legacy prod-2026. Finish batch/class/learner eligibility, registration, jobs/drives/applicants/rounds/interviews/offers/joining/external outcomes and their cross-role APIs/UI. Own Learner placements, TPO/HR Drive workflow, CA/SA placement pages. Do not modify TPO CRM, shared notifications or Drizzle journal. Produce full cross-role regression tests and stage migration drafts for W01; commit safely to main.
```

### Chat 5 (W05)
```text
Continue LMS vNext as W05, TPO/HR CRM owner, GitHub issue #25. Read docs/planning/six-chat-closure-plan.md and DB09 ledger and TPO/HR detailed parity files; fetch latest main and legacy prod-2026 SHAs. Implement recruiter/company/lead CRM, invites, policies, messages, calendar, settings, reporting and remaining non-drive TPO/HR UI. W04 owns Drive and application/offer lifecycles; W06 owns notification/outbox delivery; W01 owns migrations/core auth. Stage DB09 SQL, add tenancy/privacy/API/browser tests and commit safe batches to main. Keep source-only/blocked mappings unverified.
```

### Chat 6 (W06)
```text
Continue LMS vNext as W06, Admin and Shared Operations owner, GitHub issue #26. Read docs/planning/six-chat-closure-plan.md, DB10 tracker and CA/SA/shared parity specs; fetch latest main and legacy prod-2026. Finish College Admin/Super Admin non-project/non-placement/non-course-delivery surfaces (academic setup, dashboard, people, tenant setup/settings), DB10 notifications, activity, bug tracker, audit, scheduled jobs, and shared/public pages. Other domain owners handle specialized project, placement and course pages; W01 registers all Drizzle migrations. Test tenant isolation, UI states, modals, mobile, browser and cross-role jobs; update owned parity rows and commit safely to main.
```
