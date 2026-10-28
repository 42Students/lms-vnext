# LMS vNext — Final Execution & Database Domain Closure Protocol

**Owner-approved on 29 October 2026: the single authoritative vNext execution strategy.** Supersedes the earlier closure-first and locked-order instruction documents. Historical evidence remains in Git history. `docs/tracker.json` is the sole live task/phase authority; this file controls the workflow, not task acceptance.

## 1. North star and facts

**Finish required domain-backed functionality once, prove it once, mark each accepted task DONE, freeze it, and move to the next ready domain.** Do not maximize investigations, CI runs, authored tests, or documentation. The 81 existing DB task IDs and acceptance contracts remain; their execution grouping is no longer a serial 81-task queue.

- **Single live truth:** `docs/tracker.json` (Boolean `done` plus exact engineering acceptance and deferred final-release receipts). No second kanban, status document, completion spreadsheet, or invented percentages.
- **Read-only domain view:** `npm run progress -- --domains` groups all 81 tasks exactly once into the ten packages below, using current task truth. The grouping is an execution index, not new completion status.
- **Snapshot, not a persistent claim:** on 2026-10-29 the tracker reported 8/81 engineering DONE, 73 NOT DONE. Re-read current `main` for live numbers; DB-005 is DONE. Never reopen DB-002, DB-003, DB-004, DB-005, DB-017, DB-025, DB-030 or DB-065 without a demonstrated regression.
- **Greenfield:** no legacy production data migration. Old LMS dev is the pinned behavior/source oracle, not a live DB source.
- **Safety stays strict:** no tenant/privacy/authorization gaps, missing migration or core functionality can be deferred. Independent provider go-live, organizational signatures, final browser/release freeze may be deferred **only** through existing `deferredRelease` rules; no release certification while they remain pending.

## 2. Ten finite packages, not 81 independent projects

| Package | Primary aim | Existing task IDs included (complete, no duplicated ownership) |
| --- | --- | --- |
| FOUNDATION / GLOBAL | Independent database verification, global tenant/FK/race/storage target safety, active-field disposition, drift and exit certification | DB-001, DB-002, DB-003, DB-004, DB-014, DB-015, DB-017, DB-018, DB-019, DB-020, DB-025, DB-027, DB-028, DB-048, DB-051, DB-055, DB-058, DB-065, DB-076 |
| DB02 Academic | Academic/calendar persistence | DB-005 |
| DB03 Groups | Groups, elective integrity and slot/program policy | DB-006, DB-026 |
| DB04 Profiles | Profile verification, private documents, education, images and source dispositions | DB-007, DB-016, DB-077, DB-080, DB-081 |
| DB05 Courses | Course/offering/content persistence and source disposition | DB-008, DB-078 |
| DB06 Assessment | Assessment, grading, quizzes, attendance and immutable history | DB-009, DB-030, DB-035, DB-038, DB-041, DB-042, DB-044, DB-045, DB-052, DB-053 |
| DB07 Projects | Project, revision, sprint, task, review, meeting and submission ancestry | DB-010, DB-068, DB-070, DB-071, DB-073, DB-074, DB-075 |
| DB08 Placement | Placements, offer policy/lifecycle, applications, drives and rounds | DB-011, DB-021, DB-029, DB-054, DB-066, DB-069, DB-072 |
| DB09 CRM | TPO/recruiter CRM, notes, disclosure, messages, notifications and races | DB-012, DB-032, DB-034, DB-036, DB-047, DB-056, DB-057, DB-059, DB-060, DB-061, DB-062, DB-063, DB-064, DB-079 |
| DB10 Operations | Operational settings, notifications, mail/SMS, audit, campaigns, jobs and log retention | DB-013, DB-022, DB-023, DB-024, DB-031, DB-033, DB-037, DB-039, DB-040, DB-043, DB-046, DB-049, DB-050, DB-067 |

The package list indexes pre-existing obligations; it **does not redefine, merge, delete or weaken** any task. A package can finish tasks incrementally. Do not hold a proven individual task open waiting for unrelated package work. A package is *fully closed* only when **all** its task IDs are accepted.

## 3. Actual priority and dependency order

1. **Close the already-built work first:** DB03 (DB-006 and DB-026); DB04 (DB-007/016/077/080/081); DB05 (DB-008/078). Read recent code, executed workflow logs and exact gaps, not the old source inventories again. These packages can proceed in separate chats with disjoint touched files. DB02 is accepted; skip it.
2. **Activate the remaining domains in dependency-ready parallel:** DB06 assessment; DB07 projects; DB08 placements; DB09 TPO/recruiter CRM; DB10 operations. Dependencies win over package number: e.g. real placement parents before CRM consumers, assessment parents before downstream course/learner reads. Work on a blocking producer in its owning package before accepting its dependent consumer.
3. **Advance cross-cutting foundation checks alongside domain implementation:** disposable PostgreSQL and reset guards, FK/tenant sweep, race/state inventory and independent verification. Retain exact failing evidence while other packages progress.
4. **Global exit, last:** DB-018 executed negative sweep → DB-019 complete field disposition → DB-020 clean migration replay/catalog/schema drift plus all remaining open global checks and independent DATABASE sign-off. If DB-018 has prerequisite DB-001/025 or DB-020 depends on DB-002/017/018/019/025, satisfy those explicit tracker edges before closure.
5. When global DATABASE gates pass, start global API/user-job parity, then UI implementation, final design and release as before.

**Dependency-ready domain vertical slices may be completed now.** After safe registered persistence and required parent dependencies, implement and verify the domain's actual scoped API **and functional UI user journeys** (producer → DB → consumer) while the global phase is still DATABASE. Do not wait for all 81 DB tasks merely to deliver a working domain user job. This does **not** certify global API/UI/RELEASE, skip global DATABASE requirements, or authorize unrelated visual polish. `currentPhase` stays DATABASE until its independent gate passes.

## 4. Domain worker recipe: one investigation, one coherent repair, one acceptance

1. **Pin the target and reuse evidence:** read current `main`, this protocol, `docs/tracker.json`, exact domain source/code, existing accepted migration, recent PG logs and a *specific* failure. Freeze legacy FE/BE SHAs and the existing source crosswalk. Re-audit only newly discovered behavior, material source drift or a demonstrably wrong mapping; never start a whole-source census from scratch.
2. **Define the finite closure contract:** for each open task in the package identify one concrete missing capability, its actual producer and consumer, data/tenant ownership, and exact required evidence. No speculative feature additions or new tracker tasks. Stop source exploration when the remaining gap can be stated as a failing contract.
3. **Implement a substantial end-to-end batch:** use existing canonical schema and migration; complete SQL/journal/snapshot, Drizzle exports, transactional services and affected callers together. Avoid staged-only SQL as a deliverable. Never build fake service paths merely to make tests pass.
4. **Test proportionately, then accept definitively:** run fast static/targeted checks while editing. For database promotion run registered clean disposable Postgres journal replay, drift/catalog checks and domain tenant/FK/state/race/negative tests plus actual read/write consumer tests. Record the exact passing revision. An unrelated full-CI failure does not invalidate truly passing focused domain acceptance, but remains a real global phase blocker. Any touched-path failure, shared security prerequisite, or missing tenant/privacy/authorization witness **does** block that domain's acceptance.
5. **Commit/close in a cohesive batch:** optimistic latest-main SHA, never force-push. In the same tested change or immediately following evidence update, set `done:true` for **each independently accepted task**; leave unproved tasks `false`. Include actual run URL/command, runner, result, exit code, **tested code SHA** and permitted structured `deferredRelease` receipts. A tracker-only acceptance commit may cite the prior tested code SHA, but any intervening material source change needs revalidation. Never manufacture pass evidence.
6. **Freeze and move:** an accepted task is skipped in all later continuation chats. Reopen only for a demonstrated regression, a newly material dependency conflict, or explicit owner change. Do not repeat old audits, snapshot generation or independent acceptance merely to 'feel certain.'

**Anti-loop:** after two implementation/test passes without a new accepted task, either (a) isolate a reproducible unmet acceptance with its next code change, or (b) record the concrete external blocker and immediately move to another dependency-ready task. Do not write another gap manifesto or rerun unrelated CI in place of implementation.

## 5. Concurrency and CI: minimize wasted time

- **Domain ownership is per working pass, not a permanent chat registry.** Multiple chats can work disjoint domains; each one reads fresh main and the same single tracker. Never two active writers to the same schema domain or service file. In-flight domain commits do not give another chat permission to redo that domain.
- **One shared migration promoter at a time:** only that agent selects the next migration number from fresh main, reviews parent FKs/collisions and atomically registers numbered SQL + journal + snapshot + schema barrel. Others may work on disjoint services/tests but cannot independently promote a conflicting migration. Optimistic Git ref checks are a collision guard, not an ownership mechanism; on conflict, fetch/reconcile/regen/retest, never force or paste stale blobs.
- **CI is tiered:** (1) fast focused source/type/SQL checks while implementing; (2) one domain-specific disposable PostgreSQL replay + negative/integration run after a cohesive migration batch; (3) full integrated lint/typecheck/build/browser/security suites at the global DATABASE/API/RELEASE gates and where directly relevant. No dozens of micro-commits to retrigger a serial full suite. Never skip/suppress meaningful failed assertions.
- **No risky databases:** destructive resets, tests and seeds only against explicitly disposable/test databases, with fail-closed targeting. No actual provider sends or production data in acceptance.
- **Short, serialized tracker acceptance writes:** fetch fresh main, merge passing evidence only for your own tasks, never overwrite another worker's accepted `done:true`. Global certification still needs a current combined-revision test.
- **No dual status reporting:** official DONE/NOT DONE is only `docs/tracker.json`; the package command only *aggregates* it. Report 1–3 exact blockers, not guessed implementation percentages.

## 6. How every chat starts and ends

**Default "continue vNext database"**: read `AGENTS.md`, this protocol, current `docs/tracker.json`, `npm run progress -- --domains` (or its source equivalent), current-domain code, and latest relevant PG acceptance. Choose an *unaccepted, dependency-ready* package (user-specified domain has first priority) that another active chat is not changing. Reuse source/verification evidence, implement real fixes, verify and close accepted tasks.

**Response / handoff:** package, **IDs accepted this pass**, commit SHA, passing/failed executable tests with URLs or exact commands, official count before→after, one concrete blocker if any, and next runnable task. Do not claim phase exit from task counts alone.

**Finish line:** all 81 engineering tasks correctly accepted with evidence, complete registered Drizzle migration replay, tenant/privacy/authorization and cross-domain negative tests, source-field disposition, independent DATABASE gate approval. Final release checks stay independently mandatory; they are not silently waived by engineering DONE.

## 7. Whole-product sequence and acceptance (preserved from superseded policies)

The **global phase order** remains DATABASE → API/user-job parity → UI Implementation Green → final Design Green → RELEASE Green. Scoped vertical implementation above can precede global phase acceptance, but **never automatically certifies another phase**.

1. **DATABASE GREEN:** all required 81 tasks individually accepted; registered Drizzle migrations replay from clean disposable PostgreSQL, catalog/drift, tenant/authorization/privacy/FK/history/state/concurrency and source-field dispositions pass; independent global gate approved. DB-018 negative suite and DB-019 field disposition feed DB-020 final certification, subject to the actual tracker dependency edges.
2. **API/user-job GREEN:** all required first-party, role-safe producer→consumer workflows for Learner, Faculty, Mentor, College Admin, Super Admin, TPO and Recruiter/HR. Verify persistence, errors, retry/cancel, authorization, races and cross-role side effects. Reuse earlier passing domain-local integration rather than rebuilding it. Use pinned `lms-dev-2026` FE/BE as development behavior references.
3. **UI Implementation Green:** follow [detailed page-family contracts](../parity/README.md) covering reachable pages, tabs, sidebars, overlays, modals, drawers, dropdowns, wizards, forms, bulk actions, empty/loading/error/permission/mobile states, deep links and better vNext extras. Close the one-time Faculty Today pilot if still missing evidence, then Faculty → College Admin → Super Admin → Learner → Mentor → TPO → Recruiter/HR → Shared/Public, respecting true dependencies. Two focused repair rounds is the default; if blocked, leave NOT GREEN with exact witness and move independently. Stop functional re-audits at evidenced Implementation Green, even if design is pending. No prototype pixel-perfect requirement.
4. **Design Green:** one vNext-branded accessible/responsive UX pass across navigation, focus, keyboard, overlays and visual consistency; don't redo accepted functionality without material behavioral changes.
5. **RELEASE Green:** freeze `prod-2026` FE/BE oracle SHAs, reconcile against development, pass current-revision full CI/migrations/browser/security/privacy/recovery/cutover/authorized providers and all independently deferred signoffs. `npm run parity:clone-gate` must return READY YES. No engineering acceptance silently waives release obligations.

## 8. No-loop finish rules

**Four distinct claims:** task DONE requires all scoped engineering evidence in `docs/tracker.json`; domain package CLOSED means *all* its tasks DONE; global DATABASE GREEN means independent all-domain certification; RELEASE GREEN means all final obligations actually passed. Never conflate them.

**After two useful passes with zero new task closures:** reproduce and fix the exact unmet contract or switch to another independent ready domain, leaving unsafe work NOT DONE. Do not create another planning document or redo accepted audits. New chats should read `AGENTS.md`, **this protocol**, fresh tracker/`npm run progress -- --domains`, existing domain code and executed tests. Report actual accepted IDs, tested commit SHA, PASS/FAIL/SKIPPED, count before→after and one to three specific blockers, without inventing progress or background work.
