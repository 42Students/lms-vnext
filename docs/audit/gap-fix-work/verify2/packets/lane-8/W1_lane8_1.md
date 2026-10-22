# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-024-012 [P1] MISSING facet F05
- Files: src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:243-252 — preview four placements counters in one payload
- Expected fix: Add active jobs/in-progress/pending offers/upcoming interviews to disabling review.

## G2-13-026-012 [P1] GAP facet F06
- Files: src/modules/academics/semester-mutation-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-23 — POST/PUT request programId min1, name nonblank max255, optional start/end date strings max255, courseIds, status.
- Expected fix: Build field-by-field compatibility and DTO migration.

## G2-19-030-005 [P1] MISSING facet F02
- Files: src/app/(authenticated)/tpo/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:48-61 — top UserInfo photo/identity card, then How students and recruiters see you Descriptions card.
- Expected fix: Restore identity/photo card and second summary card.

## G2-10-006-025 [P1] GAP facet F06
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: Old Semester numeric Input min1 max12 disabled only for enrolled edit `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:273-286`
- Expected fix: Permit identity edits before enrollment history as legacy; lock only when history exists

## G2-10-006-045 [P1] GAP facet F10
- Files: src/components/electives/college-slot-manager.tsx
- Legacy: Old create POST slot and PUT edit slot with same body fields `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:11-15` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:141-159`
- Expected fix: Support editing academic identity until enrollment history, with version guard

## G2-10-006-050 [P1] GAP facet F12
- Files: src/components/electives/college-slot-manager.tsx, src/modules/electives/college-slot-mutation-service.ts
- Legacy: Old enrollment-history lock prevents changing program semester year credits/pick rules after picks `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:265-296`
- Expected fix: Use hasEnrollmentHistory to dynamically lock only fields legacy locks

## G2-10-006-069 [P1] GAP facet F19
- Files: src/modules/electives/admin-directory-service.ts, src/app/(authenticated)/admin/electives/page.tsx
- Legacy: Old list loads all selected program's slots then client paginates 20 and searches description `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:48-71` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:125-129` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:257-258`
- Expected fix: Implement cursor/page query for complete catalogue and total matches, no silent result loss

## G2-10-008-036 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:352-366` Department dropdown All; on change resets Program
- Expected fix: Clear selected program automatically when Department changes

## G2-10-017-048 [P1] MISSING facet F10
- Files: src/app/(authenticated)/admin/placements/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:74-88 — extendJobDeadline mutation within card; validated Important Date entry.
- Expected fix: Wire deadline mutation with optimistic token and audit.

## G2-10-018-047 [P1] GAP facet F10
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:216-228 — DELETE lectureHall old endpoint physically deletes if unused.
- Expected fix: Explicitly document intentional data retention/state divergence.

## G2-10-018-055 [P1] GAP facet F12
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:366-368 — Capacity enforced min1/max1000.
- Expected fix: Record changed business max and revise validations/help.

## G2-10-018-056 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:68-82,411-420 — Load error inline table card with Retry; skeleton while rows fetch.
- Expected fix: Separate initial error from stale table errors.

## G2-10-018-086 [P1] GAP facet F22
- Files: src/modules/academics/lecture-hall-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:216-224 — Deleting hall removes row, cannot restore.
- Expected fix: Document lifecycle decisions and effects.

## G2-10-020-012 [P1] GAP facet F03
- Files: src/components/academics/academics-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:227-245 — Always visible Edit icon button + red Delete icon button.
- Expected fix: Use inline Edit/Delete buttons with matching destructive red state.

## G2-10-020-042 [P1] GAP facet F07
- Files: src/components/academics/academics-actions.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:299-301 — Delete failure 'Program was not deleted' with Retry delete.
- Expected fix: Preserve per-row retry even after failed server archive.

## G2-10-020-057 [P1] GAP facet F10
- Files: src/components/academics/academics-actions.tsx, src/app/api/academics/programs/[programId]/route.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-194; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-211 — DELETE /api/v1/new-program/delete/:id.
- Expected fix: Document contract: hard delete vs soft archive and linked-content policy.

## G2-10-020-069 [P1] GAP facet F12
- Files: src/components/academics/academics-actions.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-207 — Legacy DELETE erases program; dependency guard modal.
- Expected fix: Decide explicit archive-v-delete owner policy; align label and restoration.

## G2-10-020-102 [P1] GAP facet F21
- Files: src/components/academics/academics-actions.tsx, src/modules/academics/program-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-195; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-211 — Delete service rejects dependencies; admin decides via Popconfirm.
- Expected fix: Review dependent migration FK and restore for safe archive parity.

## G2-10-023-022 [P1] MISSING facet F05
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:180-199 — Organizations Table search inline, refresh, pagination page 25 with size.
- Expected fix: Embed searchable organization table

## G2-17-026-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/notifications/page.tsx
- Legacy: Learner hook establishes classId-scoped bell feed, SSE reconnect; useNotificationFeed.js:29-39,76-125
- Expected fix: Specify class/course versus membership eligibility conversion and deep-link redirects on parity matrix.

## G2-11-002-017 [P1] GAP facet F04
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Scheduled when booked/date even if round status pending `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:358`
- Expected fix: Derive scheduled state from booked/date

## G2-11-002-075 [P1] MISSING facet F15
- Files: src/components/hr/recruiter-conversation-reply-form.tsx
- Legacy: Inline RequestQuote for responding `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:842`
- Expected fix: Propagate quote ID

## G2-11-006-012 [P1] GAP facet F04
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: Reads id,actorType,actorId,actorName,action,entityType,entityId,detail,createdAt. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:82`
- Expected fix: Introduce explicit compatibility projection for missing actor/entity attributes.

## G2-11-006-027 [P1] GAP facet F06
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: Four filter facets accept multi-select option arrays in URL f_* keys. `docs/legacy-source/frontend/src/components/tpo/filters/filterModel.js:9`
- Expected fix: Use multi-value filter schema OR within facet/AND between facets.

## G2-11-006-039 [P1] GAP facet F10
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: GET /api/v1/tpo/audit?limit=500 by default or 5000&from&to; response rows + headers. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:33`
- Expected fix: Build source/action parity map and compatibility test for API return.
