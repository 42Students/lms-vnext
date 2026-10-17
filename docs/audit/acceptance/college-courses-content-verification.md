# College Courses & Content — chat-3 verified gap closure, round 2

Protocol `docs/orchestrator/briefs/gap-closure-lane.md`; audit `docs/audit/pages/college/courses-content.md`. Tests **written but not run** (the orchestrator executes them). Tests: `tests/unit/college-courses-content-gap-closure.test.ts` (one named case per gap below).

| ID | Status | Evidence and test |
| --- | --- | --- |
| COL-courses-content-01 | OPEN | SQL-scoped catalogue is paginated; admin workspace still requests all offerings/deliveries. Source and model test COL-courses-content-01 |
| COL-courses-content-02 | OPEN | Course display editor has overview/takeaways/thumbnail but gated on DB05; no dedicated colour or real image storage. Test COL-courses-content-02 |
| COL-courses-content-03 | OPEN | Course status is not a stand-alone visibility control; bulk hide/retry not implemented. Test COL-courses-content-03 covers currently visible signals only |
| COL-courses-content-04 | DONE | Duplicate link/metadata-only prefill and conflict-safe copy code. Test COL-courses-content-04 |
| COL-courses-content-05 | OPEN | Department, student status and accurate active-offering Dependencies count now render; image and official short title remain missing. Test COL-courses-content-05 |
| COL-courses-content-07 | DONE | Guided wizard Course→Offering→Delivery→Faculty maps records. Test COL-courses-content-07; final runtime integration unrun |
| COL-courses-content-08 | DONE | Offering Home, Syllabus, Back and persisted teaching roster visible. Test COL-courses-content-08 |
| COL-courses-content-09 | DONE | Section choice and privacy-limited shared/section content preview. Test COL-courses-content-09 |
| COL-courses-content-10 | DONE | Offering not-found and distinct retriable loading-error screens. Test COL-courses-content-10 |
| COL-courses-content-11 | DONE | Faculty cascading program/batch/class/semester/year and bulk course submit. Test COL-courses-content-11; PostgreSQL actor mutation not run |
| COL-courses-content-12 | OPEN | Reassign and end lifecycle works, but full edit fields still missing. Test COL-courses-content-12 |
| COL-courses-content-14 | DONE | Class dropdown, role labels and non-destructive assignment end copy. Test COL-courses-content-14 |
| COL-courses-content-16 | NOT-A-GAP | These named lesson/media/assessment/progress routes exist and are separately owned/audited; not a missing course overview feature. Test COL-courses-content-16 |
| COL-courses-content-17 | OPEN | Archive dialog now previews how many active offerings block archiving, but nested lesson/content counts remain missing. Test COL-courses-content-17 |
| COL-courses-content-15 | DONE | Shared apiFetch maps HTML 502, non-JSON, network and timeout failures, with ref-locked action guard in course create/edit/display flows; test COL-courses-content-15 |

Graceful operation: `GR-20` per-offering error retry, `GR-71` catalogue empty/filter guidance, `GR-90` role=alert, `GR-91` keyboard reachable Retry. Existing shared `src/lib/friendly-error.ts` and `api-fetch.ts` were not yet on main when work began; no raw code is rendered in the new boundaries. GR entries in `docs/audit/acceptance/graceful-chat-3-verification.md`.

## Chat-3 round 14 — COL-courses-content-02 owner decision

| ID | Disposition | Evidence |
| --- | --- | --- |
| COL-courses-content-02 | OPEN — UNCONFIRMED resolved | The richer Course display is a separately persisted, migration-gated object; `courseDisplayRuntimeEnabled()` correctly requires `DB05_COURSE_DISPLAY_READY=DB05_VERIFIED` and does not pretend the table exists. Do not enable or invent course images/card colours without verified storage and deployment readiness. Keep existing Course creation safe, and add missing short-title/code fields only with a real schema-backed write. `tests/unit/chat3-tpo-round14-decisions.test.ts`. |
