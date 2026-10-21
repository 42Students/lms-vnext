# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-029-013 [P1] GAP facet F04
- Files: src/modules/placements/company-share/column-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:9: table label 'UG %' (cgpa).
- Expected fix: Record privacy policy; if precise authorized old data needed, expose secure grade with consent.

## G2-1-003-043 [P1] GAP facet F10
- Files: src/app/api/people/faculty-self-document/route.ts
- Legacy: `FacultyProfileController.java:191-807` ~50 GET/PUT/POST/DELETE methods for single and repeatable sections.
- Expected fix: Define compatibility map for every legacy CRUD route/method to new document patch service and admin-authorized counterpart.

## G2-18-015-033 [P1] GAP facet F21
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:45-46 — GROUP_BACKED group id nullable
- Expected fix: Define group offering relation and referential safeguards

## G2-19-031-023 [P1] GAP facet F04
- Files: src/db/schema/discussions.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:18-29` — Legacy lesson discussions save contentText, sequence, userName, profileName.
- Expected fix: Add lesson scoped data mapping and sequence; avoid conflating threads.

## G2-1-034-033 [P1] GAP facet F11
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:12-33: existing recruiter pending invitations require authenticated explicit accept/decline.
- Expected fix: Ensure existing account invitations transition through authenticated pending workflow.

## G2-10-003-013 [P1] GAP facet F04
- Files: src/components/activity/activity-center.tsx
- Legacy: Old sentence derives action from typed VERBS table with special sentence cases `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:4-60`
- Expected fix: Port legacy verb/thing and exceptional sentence rules to new event taxonomy

## G2-10-006-043 [P1] GAP facet F09
- Files: src/components/electives/college-elective-offering-manager.tsx
- Legacy: Old ElectiveSlotPanel has AllocateModal OfferingRosterDrawer faculty and capacity modals `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:10-26` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:71-147`
- Expected fix: Restore nested offering faculty, allocation, roster drawer interactions with correct focus return

## G2-10-009-073 [P1] GAP facet F12
- Files: src/db/schema/inbound-mail.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:79-81` INSERT IGNORE by external Message-ID prevents duplicate inbound emails
- Expected fix: Use sourceMessageId idempotency at actual inbound ingest boundary

## G2-10-011-053 [P1] GAP facet F12
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14 — Admin transitions permit reversals INTERVIEW→ASSESSMENT/SHORTLISTED, OFFERED→INTERVIEW and HIRED→OFFERED.
- Expected fix: Implement safe status reversal with history and offer/joining safeguards, or record intentional policy exception.

## G2-10-013-043 [P1] GAP facet F10
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-38 — Backend interview statuses/relations from InterviewService route; candidate notification separate.
- Expected fix: Document status transition and notification mapping between sources.

## G2-10-012-033 [P1] MISSING facet F08
- Files: src/components/placements/super-admin-drive-pipeline.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:225-232 — Metrics partial failure shows Warning Alert 'Could not load pipeline metrics', description=API error.
- Expected fix: Render metrics warning inside Pipeline section and keep other content.

## G2-10-012-043 [P1] GAP facet F10
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:39-68 — Main display waits for job GET and attention; metrics failure doesn't stop display.
- Expected fix: Move optional panels into settled/lazy loads so overview remains resilient.

## G2-10-012-053 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx, src/components/placements/super-admin-drive-pipeline.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:226-233 — Pipeline error remains in card and states 'Could not load pipeline metrics'.
- Expected fix: Catch only pipeline promise; preserve hero and actions.

## G2-10-015-033 [P1] GAP facet F07
- Files: src/modules/placements/college-stage-action-model.ts, src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1442; docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14 — Admin transitions allow INTERVIEW→ASSESSMENT, OFFERED→INTERVIEW, HIRED→OFFERED.
- Expected fix: Keep reversal semantics or record deliberate retirement.

## G2-10-019-103 [P1] GAP facet F22
- Files: src/db/schema/module-access.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:19-27 — Old levels LEARNER, CLASS, BATCH; selected college numeric ID.
- Expected fix: Map learner→membership, class→section, batch→cohort, college IDs.

## G2-10-022-013 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:972-979 — ORG scope warning 'No setting applies at organization level'.
- Expected fix: Expose warning in cleanup-only ORG mode

## G2-17-026-023 [P1] GAP facet F10
- Files: src/modules/activity/notification-service.ts
- Legacy: Broadcast newly sent, updated and deleted class notifications over SSE; NotificationServiceImpl.java:151-165,230-262
- Expected fix: Provide signed/authenticated real-time invalidation (SSE or equivalent) for class and personal inbox or document deliberate polling.

## G2-17-026-033 [P1] GAP facet F15
- Files: src/modules/activity/notification-service.ts
- Legacy: Creation/update/delete are broadcast on class SSE; NotificationServiceImpl.java:151-165,230-262
- Expected fix: Specify push/distribution parity, and whether updates and deletes fan out to recipient clients.

## G2-17-030-043 [P1] GAP facet F13
- Files: src/components/placements/placement-operations-workspace.tsx
- Legacy: Refresh failure preserves last-known jobs and warning, full failure error; DrivesLanding.js:122-133,197-203,497-507
- Expected fix: Cache last-known college-scoped rows and show yellow refresh warning, never empty success.

## G2-11-008-043 [P1] MISSING facet F09
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: `Paste a list of roll numbers` dialog triggered from gate. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:359`
- Expected fix: Restore separate attendance paste dialog.

## G2-11-008-063 [P1] MISSING facet F13
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Polling failure retains last roster and displays stale error with Retry. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:253`
- Expected fix: Keep last successful snapshot with stale indicator.

## G2-11-008-083 [P1] MISSING facet F20
- Files: src/components/placements/tpo-round-drive-day-read-only.tsx
- Legacy: Ambiguous suffix never auto-selects a student. `docs/legacy-source/frontend/src/components/tpo/ui/driveDayRules.js:19`
- Expected fix: Never guess matching student; list candidates.

## G2-11-010-103 [P1] GAP facet F22
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Selection statuses SELECTED/PENDING_VERIFICATION, RELEASED/ACCEPTED. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:140`
- Expected fix: Document state transition mapping before cloning selection counts.

## G2-12-019-053 [P1] GAP facet F20
- Files: src/db/schema/placements.ts, src/modules/placements/college-application-stage-service.ts
- Legacy: Old optimistic-lock version on root application `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- Expected fix: Introduce explicit version in state transitions and prove serializable edits.

## G2-16-031-063 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: TpoOfferController.java:47-127 uses JobOffer selection/letter/response/joining
- Expected fix: Compare LOI/offer status enums, uniqueness, letter URL retention and separate joining outcome timestamps
