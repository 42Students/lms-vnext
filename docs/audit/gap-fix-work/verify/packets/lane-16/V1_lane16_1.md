# Verification packet (P1 sample): 13 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-006-053 [P1] GAP facet F15
- Files: src/app/(authenticated)/learn/my-placements/announcements/page.tsx
- Legacy: Old load dispatches custom read event for announcement bell count (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-36`)
- Expected fix: Test bell count after opening list/marking read, ensure same notification source.

## G2-14-017-033 [P1] GAP facet F10
- Files: src/modules/projects/mentor-sprint-delete-service.ts
- Legacy: Legacy deleted workspace sprint remains tombstone so template merge ignores it `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:41-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:22-25`
- Expected fix: Add deleted intent persistence or template exclusion ledger

## G2-16-028-013 [P1] GAP facet F05
- Files: src/components/projects/project-resource-list.tsx
- Legacy: RepeatingItemEditor.jsx:87-96 reorders local array and persists only on Save; no server operation yet.
- Expected fix: Keep local unsaved reorder until section-wide save; coordinate with other edits and original token.

## G2-2-008-003 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LC:63-133 auth, query first 1000, loop, audit, response
- Expected fix: Keep server-side snapshot/retryable batch and audited summary semantics.

## G2-2-016-063 [P1] GAP facet F03
- Files: src/modules/placements/college-bulk-drive-service.ts
- Legacy: Job bulk open/close accepts max 100 IDs via jobIds/isActive `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:288-333`
- Expected fix: Either retain 100-job selection or show 25 cap and batch confirmation explicitly

## G2-20-017-023 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy workspace PUT syncs full meeting array by key including revival after deletion `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingRepository.java:24-31`
- Expected fix: Support idempotent replacement/upsert and revival semantics for legacy migrated meeting keys

## G2-19-026-063 [P1] GAP facet F23
- Files: src/app/api/admin/features/[collegeId]/trace/route.ts
- Legacy: Legacy placements exempt from lower scope hierarchy as eligibility separate. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:62`
- Expected fix: Use trace participation as sole below-college placement gate and mark ignored scopes.

## G2-6-016-023 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy allows allowProficiency, disabled, showPopular, showRecent, maxResults props (SkillsAutocomplete.jsx:23-42).
- Expected fix: Restore configurable multi-skill/proficiency/disabled/popular/recent props at consumer layer.

## G2-7-004-023 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:512-583: single workspace readiness info displayed as descriptions table.
- Expected fix: Do not substitute multi-workspace summary feed for selected full readiness panel.

## G2-7-036-013 [P1] GAP facet F04
- Files: src/components/projects/project-at-risk-page-export.tsx
- Legacy: superadmin/projects/at-risk/index.js:410-432 five cols Workspace, Mentor, Status, Severity, Risk reasons
- Expected fix: Restore status and original CSV headers/order

## G2-8-023-043 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy bulk move only OPEN_STAGES APPLIED,SHORTLISTED,ASSESSMENT,INTERVIEW,WAITLISTED (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:35-38,115-131).
- Expected fix: Map old statuses to new screening/round stages; preserve offered/withdrawn restrictions.

## G2-8-022-033 [P1] MISSING facet F10
- Files: src/modules/placements/tpo-season-write-service.ts
- Legacy: Legacy openRegistration sets isRegistrationOpen and deadline; saves season (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:44-50).
- Expected fix: Reintroduce registration lifecycle write and linked learner eligibility read.

## G2-9-013-073 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:41-51` — Request Promise.allSettled isolates job failure from hiring metrics failure.
- Expected fix: Decouple nonessential request dependencies and recover inline.
