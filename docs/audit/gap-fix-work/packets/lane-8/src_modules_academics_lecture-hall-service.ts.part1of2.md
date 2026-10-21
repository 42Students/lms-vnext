# Work packet: edit src/modules/academics/lecture-hall-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md, docs/audit/gap2/lane-9/college-admin-lecture-halls.md

## G2-10-018-031  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:352-367 — Room Type required 'Select a room type'; capacity min1 max1000 default50.
- vNext now: src/components/admin/lecture-hall-manager.tsx:280-289; src/modules/academics/lecture-hall-service.ts:63-64 — New room type preselected Lecture Hall; capacity min1 max5000 default50.
- Fix: Match legacy required select and 1000 cap or formally change constraint.

## G2-10-018-047  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:216-228 — DELETE lectureHall old endpoint physically deletes if unused.
- vNext now: src/modules/academics/lecture-hall-service.ts:269-334 — PATCH status ARCHIVED retains row; restore supported.
- Fix: Explicitly document intentional data retention/state divergence.

## G2-10-018-055  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:366-368 — Capacity enforced min1/max1000.
- vNext now: src/modules/academics/lecture-hall-service.ts:63-64 — Capacity extends to5000.
- Fix: Record changed business max and revise validations/help.

## G2-10-018-086  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:216-224 — Deleting hall removes row, cannot restore.
- vNext now: src/modules/academics/lecture-hall-service.ts:269-334 — ARCHIVED retains record and Restore; historical bookings preserved.
- Fix: Document lifecycle decisions and effects.

## G2-14-013-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy global super-admin may search all colleges without scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:41-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:54-68`
- vNext now: New super-admin page requires selected college before query `src/app/(authenticated)/admin/lecture-halls/page.tsx:20-34` `src/modules/academics/lecture-hall-service.ts:124-138`
- Fix: Provide safe explicitly authorized global search or document removed capability

## G2-14-013-014  [P1] GAP  facet F05  effort L
- Legacy: Legacy exact/prefix/score/fuzzy search with typo distance 2 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188`
- vNext now: New ILIKE name-only substring `src/modules/academics/lecture-hall-service.ts:175-181`
- Fix: Build scoped fuzzy/name+description search or document deliberate simplification

## G2-14-013-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy deptId filter overrides collegeId filter when both supplied `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:76-88`
- vNext now: New always college filter and optional department filter conjunctively `src/modules/academics/lecture-hall-service.ts:175-190`
- Fix: Document corrected scope precedence and test cross-college dept ID

## G2-14-013-032  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET search uses cache.search(query,min(limit,200)), filters in JVM after search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:76-94`
- vNext now: New GET invokes Drizzle SQL filters, sort and limit `src/app/api/lecture-halls/route.ts:14-22` `src/modules/academics/lecture-hall-service.ts:175-234`
- Fix: Preserve relevant match ranking while performing tenant-safe DB filtering

## G2-14-013-036  [P1] GAP  facet F11  effort M
- Legacy: Legacy allows global SA unrestricted college search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:41-46` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:54-68`
- vNext now: New SA selected college mandatory `src/app/(authenticated)/admin/lecture-halls/page.tsx:20-34` `src/modules/academics/lecture-hall-service.ts:124-138`
- Fix: Define explicit global SA search scope with role check or document removal

## G2-14-013-068  [P1] GAP  facet F22  effort M
- Legacy: Legacy description can be null and JPA unbounded string declaration `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:24-27`
- vNext now: New description varchar255 `src/db/schema/lecture-halls.ts:10-13` `src/modules/academics/lecture-hall-service.ts:52-59`
- Fix: Plan truncation or explicit reject with preserved long descriptions

## G2-19-018-002  [P1] GAP  facet F01  effort L
- Legacy: Super Admin global all-hall and org-scoped listing; non-SA principal sees its college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101`
- vNext now: vNext requires exact selected college even for global Super Admin. `src/modules/academics/lecture-hall-service.ts:124-138` `src/app/(authenticated)/admin/lecture-halls/page.tsx:26-34`
- Fix: Resolve broader Super Admin read parity under permission checks.

## G2-19-018-035  [P1] GAP  facet F10  effort L
- Legacy: Legacy physical DELETE blocks on any associated class schedule. `docs/legacy-source/frontend/src/api/Services/AdminService.js:642-643` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- vNext now: vNext PATCH ARCHIVED allowed except future/ongoing scheduled events. `src/components/admin/lecture-hall-manager.tsx:152-183` `src/modules/academics/lecture-hall-service.ts:289-309`
- Fix: Approve archive-vs-delete business change and preserve booking referential history.

## G2-19-018-037  [P1] GAP  facet F11  effort L
- Legacy: Legacy requires admin action permission per college and applies org/college SA scope. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:60-74` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:139-152`
- vNext now: vNext academics.manage plus exact selected-college gate. `src/modules/academics/lecture-hall-service.ts:124-138`
- Fix: Document and implement explicit SA role/scope parity.

## G2-19-018-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy any authenticated non-SA principal gets own college rooms on fetch. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101`
- vNext now: vNext list only for academics.manage permission. `src/modules/academics/lecture-hall-service.ts:124-138` `src/modules/academics/lecture-hall-service.ts:167-173`
- Fix: Allow safe room-read permission for scheduling consumers while restricting writes.

## G2-19-018-041  [P1] GAP  facet F12  effort M
- Legacy: Legacy blocks delete whenever any schedule references room. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- vNext now: vNext blocks archive for active/future scheduled events only, additionally protects capacity changes. `src/modules/academics/lecture-hall-service.ts:289-309`
- Fix: Define expected lifecycle and all scheduling constraints.

## G2-4-027-002  [P1] GAP  facet F01  effort M
- Legacy: GET `/fetch` returns all tenant-scoped halls, Super Admin org/global support (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:83-108`)
- vNext now: Only single selected collegeId authorized; no global/org listings (`src/modules/academics/lecture-hall-service.ts:124-138,167-173`)
- Fix: Preserve scoped org/all discovery for authorized SA or document deliberate restriction.

## G2-4-027-038  [P1] GAP  facet F10  effort M
- Legacy: GET all reads per principal college/org/global (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:83-108`)
- vNext now: GET list requires selected college and `academics.manage` (`src/modules/academics/lecture-hall-service.ts:167-235`)
- Fix: Enable authorized org/global reads or explicit migration decision.

## G2-4-027-046  [P1] GAP  facet F12  effort M
- Legacy: Delete blocked if any scheduled classes (past included) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:144-153`)
- vNext now: Archive blocked if upcoming scheduled only (`src/modules/academics/lecture-hall-service.ts:289-309`)
- Fix: Decide full-history delete vs active-only archive; no silent loss of historical schedule.

## G2-4-027-072  [P1] GAP  facet F23  effort M
- Legacy: Org-scoped/global SA can list halls and `/fetch` GET (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:89-108`)
- vNext now: Explicitly denies unless selected college (`src/modules/academics/lecture-hall-service.ts:124-138`)
- Fix: Owner decides safe SA global listing or keep deliberate tighter scope.

## G2-9-017-094  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:12-27` — MySQL lecture_hall int id/college_id/dept_id; capacity int; no status.
- vNext now: `src/modules/academics/lecture-hall-service.ts:60-111` — Postgres UUID and nullable departmentId, status ACTIVE/ARCHIVED.
- Fix: Document migration mapping ID/dept0/null/status defaults.
