# Verification packet (P1 sample): 15 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-006-013 [P1] GAP facet F05
- Files: src/modules/placements/learner-applications-browse-model.ts
- Legacy: In progress uses a.live or offered RELEASED, Finished is complement `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:17-24,43-54`
- Expected fix: Reconcile legacy live/finished status mapping

## G2-18-029-013 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: Stale request epoch, same-scope last data preserved on refresh error, separate program/list retries (legacy:61-158,518-532)
- Expected fix: Retain old same-scope rows and warning Couldn't refresh semesters

## G2-16-001-043 [P1] GAP facet F12
- Files: src/modules/bug-tracker/independent-finding-actions-model.ts, src/components/tracker/independent-finding-actions.tsx
- Legacy: `AuditFindingService.java:165-170`: free-form assignee max 100 or blank to clear.
- Expected fix: Support legacy one-character names up to 100; permit clearing to null.

## G2-16-003-043 [P1] GAP facet F11
- Files: src/app/(authenticated)/tracker/issues/[publicId]/page.tsx, src/app/(authenticated)/tracker/mine/[publicId]/page.tsx
- Legacy: `[issueId].js:174-187`: unprivileged viewer sees status read-only and all core details.
- Expected fix: Expose owner-scoped, privacy-safe detail showing core fields and evidence, not global reports.

## G2-18-010-003 [P1] GAP facet F01
- Files: src/modules/placements/tpo-student-nudge-send-service.ts
- Legacy: Legacy student sendToStudentAsCollege sends placement-branded email (`TpoMailService.java:99-110`).
- Expected fix: Audit student placement event-to-channel matrix, implement email when required.

## G2-4-031-013 [P1] GAP facet F04
- Files: src/modules/colleges/signin-methods-model.ts
- Legacy: Values EMAIL_PHONE/PHONE_EMAIL/EMAIL_ONLY/PHONE_ONLY (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:9-14`)
- Expected fix: Use explicit migration mapping for two renamed enum values.

## G2-4-020-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/profile/page.tsx, src/app/(authenticated)/college/faculty/[membershipId]/page.tsx
- Legacy: Legacy facultyId integer lookups target profile owner in GET. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:56-74`)
- Expected fix: Map legacy faculty numeric IDs to per-college membership and self-only read.

## G2-5-022-013 [P1] GAP facet F06
- Files: src/modules/placements/tpo-academic-import-service.ts
- Legacy: Legacy academic upsert `PUT /{learnerId}/academic-record` raw incoming entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:50-57`
- Expected fix: Add single-record TPO correction route or use one-row preview+commit.

## G2-5-022-033 [P1] GAP facet F12
- Files: src/modules/placements/tpo-academic-import-service.ts
- Legacy: Legacy verified source wins over self-reported academic `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:13-22,65-78`
- Expected fix: Document conflict order for imported/verified/self values.

## G2-6-030-043 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: Legacy scoped SA can read all within org, all if global; college admin scope and selected college authorization (LectureHallController.java:80-101,115-128).
- Expected fix: Document intentional stricter scope and ensure role switching guides users rather than silent denial.

## G2-7-007-053 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectResourceAudit.java:11-52 and backend migration V80__project_resource_audit.sql:1-21: physical resource audit table with resourceKey/action/actor/order/diffs indexed by project/time.
- Expected fix: Promote audited migration and writer/reader or provide equivalent immutable event metadata with legacy fields and indexes.

## G2-7-019-083 [P1] GAP facet F20
- Files: src/modules/projects/college-projects-query-model.ts
- Legacy: workspaces/index.js:148-154 auto-clamp empty page after archiving
- Expected fix: Wire helper and redirect to last in-range page when total shrinks.

## G2-8-027-053 [P1] GAP facet F22
- Files: src/modules/placements/college-interview-action-service.ts
- Legacy: Legacy interview table single integer key, FK job/application/learner, type/status/date/mode/notes/feedback/version (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-173).
- Expected fix: Create explicit legacy interview and dependent notification/link migration to multiple tables.

## G2-9-002-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/batch-promotion/page.tsx
- Legacy: Absent college shows warning in place (`docs/legacy-source/frontend/src/pages/college-admin/batch-promotion.js:21-31`)
- Expected fix: Show exact warning instead of uninformative redirect.

## G2-9-017-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/lecture-halls/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/lecture-halls.js:17-28` — Unassigned college renders Admin not assigned to a college explanatory warning.
- Expected fix: Show contextual no-college warning and administrator guidance.
