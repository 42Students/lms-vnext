# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-020-034 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx, src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:533-555 class only cohort/teams and required there
- Expected fix: Hide class field in single mode except deliberate add-class shortcut

## G2-7-020-035 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:559-575 students multi-select optional with max500
- Expected fix: Permit college-scope learner selection up to 500 without class

## G2-7-020-038 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:74 dirty guard and :401-409 Back confirm
- Expected fix: Guard Back, Cancel, route changes and reload when dirty

## G2-7-020-070 [P1] GAP facet F13
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:113-120 template load failure separated from no assigned templates via helper
- Expected fix: Render retry for transient template-fetch failure instead of empty/crash

## G2-7-020-085 [P1] GAP facet F17
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:74 and useUnsavedFormGuard.js:17-56 protect browser nav and page unload
- Expected fix: Add dirty guard to in-app routing and beforeunload

## G2-7-020-092 [P1] GAP facet F19
- Files: src/components/projects/project-create-control.tsx, src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:194-246 remote lookups each 400ms debounced
- Expected fix: Add paged remote picker queries and debounce to avoid inaccessible mentors

## G2-7-021-021 [P1] GAP facet F04
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: reassign-mentor.js:269-284 result includes per-item failure messages and workspace names
- Expected fix: Map safe failure code to actionable reason and project title

## G2-7-021-028 [P1] GAP facet F05
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: reassign-mentor.js:336-339 row selection supports select all of current view
- Expected fix: Explain cap, retain selection semantics for more than 1000 matched workspaces

## G2-7-021-039 [P1] GAP facet F07
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: reassign-mentor.js:281-285 per-item failure descriptions include workspace and original error
- Expected fix: Display safe structured per-item failure code and retry guidance

## G2-7-021-047 [P1] GAP facet F10
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: AdminService.js:447-448 POST /api/v1/admin/projects/reassign-mentor/bulk payload collegeId, projectIds, mentorId, roleLabel
- Expected fix: Document payload ID mapping and response aggregation/partial failures

## G2-7-021-057 [P1] GAP facet F12
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: reassign-mentor.js:217-235 already-assigned no-op matches normalized role label
- Expected fix: Correct front-end no-op test and preview counts for role-label change

## G2-7-021-068 [P1] GAP facet F15
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: reassign-mentor.js:218-224 no-op prevents re-notifying unchanged mentor+role
- Expected fix: Preserve notifications on role-label changes; no notification on exact no-op

## G2-7-021-085 [P1] GAP facet F20
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: reassign-mentor.js:225-235 case-insensitive roleLabel and default Project Mentor for no-op
- Expected fix: Compare normalized role label and mentor ID together

## G2-7-026-022 [P1] GAP facet F04
- Files: src/modules/projects/mentor-attention.ts, src/app/(authenticated)/mentor/notifications/page.tsx
- Legacy: notifications.js:341-345 sortKey priority and timestamp order
- Expected fix: Preserve legacy announcement-review-request-stalled-upcoming priority ordering

## G2-7-026-052 [P1] GAP facet F12
- Files: src/modules/projects/mentor-attention.ts
- Legacy: notifications.js:27-34 reviewStatus submitted OR under review, reject stale reopen if submittedAt <= reviewedAt
- Expected fix: Compare reviewedAt and submission version so reopen is not a fresh review and under review is retained

## G2-7-026-080 [P1] GAP facet F20
- Files: src/modules/projects/mentor-attention.ts
- Legacy: notifications.js:21-34 stale review reopened should not notify mentor if submission precedes review
- Expected fix: Add version/review timestamp test for reopened deliveries

## G2-7-028-024 [P1] GAP facet F04
- Files: src/modules/projects/mentor-attention.ts
- Legacy: ProjectsContent.jsx:64-90 Stalled suppressed when blocked text and no activity signal
- Expected fix: Exclude blocker and verify recorded lastActivityAt fallback before stalled badge

## G2-7-028-059 [P1] GAP facet F12
- Files: src/modules/projects/mentor-attention.ts
- Legacy: ProjectsContent.jsx:55-61 reviewStatus submitted or under review only if new submittedAt>reviewedAt
- Expected fix: Implement version/timestamp-based reviewed detection

## G2-7-028-060 [P1] GAP facet F12
- Files: src/modules/projects/mentor-attention.ts
- Legacy: ProjectsContent.jsx:64-90 stalled after7d, exclude blocker, completed, archived and missing timestamp
- Expected fix: Align blocker suppression and no-data behavior

## G2-7-028-071 [P1] GAP facet F15
- Files: src/modules/projects/mentor-attention.ts
- Legacy: ProjectsContent.jsx:55-61 false needs-review on own reopen explicitly suppressed
- Expected fix: Avoid misleading Needs review signal to mentor and duplicate reminder

## G2-7-028-094 [P1] GAP facet F22
- Files: src/modules/projects/mentor-attention.ts
- Legacy: ProjectsContent.jsx:55-61 resolvedDelivery reviewStatus/submittedAt/reviewedAt nested
- Expected fix: Map review history fields, event versions and CAS status for list badge

## G2-7-031-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/superadmin/[...legacy]/page.tsx
- Legacy: superadmin/projects/index.js:17-23 /superadmin/projects redirects with router.replace to first Projects tab
- Expected fix: Redirect /superadmin/projects to /admin/projects/templates not /admin/projects

## G2-8-021-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy stored `student_id` is a String (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:16-18).
- Expected fix: Define migration mapping for historical string student IDs and collision handling.

## G2-8-027-032 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy schedule enforces org/job match and advances interview lifecycle/notification through InterviewService (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:170-256).
- Expected fix: Map job/application screening stage transitions and avoid duplicate notification on rebook.

## G2-13-024-006 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17 modes To read, Posted to conversations, Done, All
- Expected fix: Replace Being handled tab with Posted to conversations, optionally preserve triage as extra
