# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-8-030-046 [P1] GAP facet F15
- Files: src/components/placements/super-admin-bulk-drive-actions.tsx, src/modules/placements/super-admin-bulk-drive-service.ts
- Legacy: Old delete warning learners notified, bulk close disables applying docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:441-447,739-742.
- Expected fix: Preserve learner notification semantics for close/delete and make affected count visible.

## G2-8-030-055 [P1] GAP facet F22
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx, src/modules/placements/admin-drive-directory-model.ts
- Legacy: Old job active/draft booleans, postedDate/createdAt, importantDates arrays docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:195-203,249-264,578-596.
- Expected fix: Create legacy column->new field mapping for status/posted/deadline/jobType.

## G2-8-024-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy account identity Recruiter integer ID, contactMobile/contactMail, designation (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:79-100; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:411-446).
- Expected fix: Create old recruiterId to canonical user mapping, preserve email identity.

## G2-8-023-044 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy reject transitions to REJECTED but never for offered/placed/withdrawn (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:109-131).
- Expected fix: Reconcile Not selected pipeline visible status with underlying screening decision.

## G2-8-022-059 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy placement_season id Long identity, college INT, start/end nullable, version Long (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:25-50,71-73).
- Expected fix: Backfill IDs, dates and optimistic token with traceable migration for historic linked drives.

## G2-9-007-022 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:337-368` — Eligible table search roll/name/dept, class filter, persistent select, 50/page
- Expected fix: Replicate bulk selection and per-pick counters across pages

## G2-9-015-006 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:877-903` — Create/Edit form opens 800px modal in same list route.
- Expected fix: Restore create/edit in-modal workflow or match modal entry point.

## G2-9-010-047 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-516` — GET /api/v1/admin/jobs/{jobId}/applications accepts page,size,status,source,dept,program,batch
- Expected fix: Map legacy query defaults, sort and mode to vNext scoped query

## G2-9-010-079 [P1] GAP facet F19
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:551-574` — Whole-result fetch processes 100 rows/page for export/select all
- Expected fix: Document hard caps; enable safe bulk subset beyond CSV cap and show truncation

## G2-9-010-086 [P1] GAP facet F22
- Files: src/modules/placements/college-drive-applications-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-40` — JobApplication unique learner+job, LocalDateTime, status field and entity version
- Expected fix: Map legacy job application fields and uniqueness to new schema/migrations

## G2-9-012-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/interviews.js:26-32` — Missing college renders Admin not assigned to a college warning
- Expected fix: Render scoped missing-college message and recovery

## G2-9-012-038 [P1] MISSING facet F10
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:142-165` — Legacy Complete and Feedback POST for interview record
- Expected fix: Implement or link interview feedback with rating1-5 and recommend action

## G2-9-012-064 [P1] GAP facet F21
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:39-44` — Uses interviewService, CSV export, ICS export and conflict calculation utility
- Expected fix: Implement CSV and conflict service adapters

## G2-9-013-005 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:72-75` — Missing college assignment shows Admin not assigned to a college warning.
- Expected fix: Render scoped missing-college recovery instead of generic redirect when appropriate.

## G2-9-013-012 [P1] MISSING facet F03
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1138-1183` — Update Job/Save draft/Publish now/Cancel button set varies by draft state.
- Expected fix: Restore draft Publish now and Cancel flows with guarded preflight.

## G2-9-013-019 [P1] GAP facet F04
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1018-1076` — Preferred degree/specialization/year/GPA/city are informational display-only preferences.
- Expected fix: Show preferences distinctly as non-gating fields.

## G2-9-013-028 [P1] GAP facet F06
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:702-710` — Job Type required from college choices (fallback for no-longer-listed type).
- Expected fix: Wire college job types, unknown saved option and counts-as-placed label.

## G2-9-013-031 [P1] GAP facet F06
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:724-735` — VisibilityType offers INTERNAL_ONLY/HYBRID/EXTERNAL_ONLY with college-vs-org descriptions.
- Expected fix: Do not conflate audience visibilityType with application submission mode.

## G2-9-013-032 [P1] MISSING facet F06
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:737-752` — Assessment URL optional http(s), maxLength 2048, showCount, allowClear.
- Expected fix: Add separate assessment URL with validation and intended audience.

## G2-9-013-035 [P1] GAP facet F06
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:950-1014` — Target Department, Program, Batch and Class cascading selectors; blank means broad.
- Expected fix: Restore exact targeting mapping, including class-level boundary.

## G2-9-013-036 [P1] GAP facet F06
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1028-1076` — Preferred degree/specialization/year/min GPA/city have independent inputs and limits.
- Expected fix: Provide separate advisory preferences; never silently translate to hard eligibility.

## G2-9-013-039 [P1] GAP facet F07
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:27-36` — Empty rich text rejected with Please enter job description after stripping HTML.
- Expected fix: Validate meaningful rich text, not HTML-tag-only payload.

## G2-9-013-052 [P1] GAP facet F09
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:560-571` — 409 optimistic edit conflict Modal with Reload and Dismiss.
- Expected fix: Show dedicated stale-write reload dialog and avoid partial save.

## G2-9-013-059 [P1] GAP facet F10
- Files: src/app/api/placements/jobs/[jobId]/status/route.ts
- Legacy: `src/app/api/placements/jobs/[jobId]/status/route.ts:16-36` — Legacy POST status accepts true/false isActive.
- Expected fix: Document distinct reopen requirements and route clients through one guarded UX.

## G2-9-013-065 [P1] GAP facet F12
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1018-1025` — Legacy candidate preferences informational, do NOT gate applications.
- Expected fix: Separate informational preferences from enforced eligibility policies.
