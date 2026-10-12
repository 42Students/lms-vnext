# DB05 — Learning path scope and publication race contract

**Phase:** DATABASE · **Worker:** Chat 6 · **Status:** source implementation committed, runtime race acceptance **NOT RUN**.

A learning path's offering determines its course, cohort, academic period, owning department, college and organization. The previous update/publish code loaded the scope for permission **before** writing and then updated by learning-path ID and status. If an offering or course's owning scope moved between those operations, a stale grant could edit or publish under another scope; a published activity record would also carry the old college.

The source fix to `src/modules/courses/learning-path-service.ts` now:

- Creates with a current ACTIVE offering/course/college/organization, SHARE locks, and exact pre-authorized **course, cohort, period, college and organization** comparison in the insert transaction.
- Updates with a row-level learning-path `FOR UPDATE`, a current ACTIVE offering ancestor SHARE-lock + tenant/scope equality, then a same-offering/not-archived `UPDATE` inside one transaction.
- Publishes/archives with the same locks and final scope predicate; the publication event remains in the same transaction as the status change. Publication still requires `DRAFT`.

This does **not** certify direct SQL / DB05 ancestor reparent integrity; W01/DB02 need accompanying database guards, and READ COMMITTED multi-session tests still matter. Locked `courseOfferings`, `courses`, `departments`, `colleges`, `organizations` cover this path's current permission ancestry. Separate program/cohort/period and upstream parent state changes remain DB02/DB05 gates.

## Acceptance matrix — do not count as executed

LP-01: ordinary same-tenant path creation accepts active offering.

LP-02: concurrent offering archive vs path create rejects path create after archive commits.

LP-03: concurrent authorized scope moving to another college after preliminary auth rejects edit and creation.

LP-04: concurrent path relocation to another offering before edit lock rejects edit; historical and target scopes preserved.

LP-05: concurrent path relocation before publish cannot emit an event in the old college.

LP-06: second publisher after first commit fails DRAFT predicate and emits no duplicate event.

LP-07: archived path cannot accept update, and repeated archive rejects as an invalid transition.

LP-08: path create under course, college or organization becoming inactive rejects; no partial insert.

LP-09: two-session READ COMMITTED lock-order contention with offering archive and DB05 ancestor triggers produces no cross-tenant row or deadlock.

LP-10: test DB02 cohort, period, program, department and college reparent interactions; verify existing child rows do not silently change tenant.

Record actual command, exact revision, PostgreSQL version, SQLSTATE/rollback, and race ordering before marking any gate PASS. Authored Node static tests do not replace PostgreSQL evidence.
