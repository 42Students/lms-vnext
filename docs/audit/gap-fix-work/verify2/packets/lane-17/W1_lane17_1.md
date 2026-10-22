# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-031-020 [P1] GAP facet F04
- Files: src/modules/placements/tpo-recruiter-thread-detail-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:92-123` — Thread detail returns author IDs/names, transport, kind, event, request and readAt.
- Expected fix: Extend projection with sender names, via, event/request metadata.

## G2-1-009-017 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/profile/academic-record/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:58-60`: source SELF or VERIFIED.
- Expected fix: Display provenance per specific data row rather than universal unverifiable caveat.

## G2-1-004-039 [P1] GAP facet F11
- Files: src/modules/people/learner-profile-access-service.ts
- Legacy: `LearnerProfileController.java:64-105` learner self, staff/admin access guarded by teaching assignment.
- Expected fix: Implement scoped authorized staff/teacher read with teaching guard separately from self write.

## G2-1-034-005 [P1] GAP facet F03
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:176-183: heading names college and optional reviewDrive info.
- Expected fix: Restore named review-drive CTA/context when invite pertains to a drive.

## G2-1-034-009 [P1] GAP facet F04
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:43-49: preview collegeName/companyName/reviewDrive/contactName/designation/email.
- Expected fix: Extend preview contract to reviewDrive and show in invite summary.

## G2-1-034-011 [P1] GAP facet F04
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:102: `PENDING_HR` accepted status produces pending login instruction.
- Expected fix: Restore existing-recruiter pending invite handoff, no silent/grant duplicate.

## G2-1-034-020 [P1] GAP facet F07
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:8-17: INVALID_MOBILE, FIRST_NAME_REQUIRED, COMPANY_EMAIL_REQUIRED and CODE_* map field errors.
- Expected fix: Render code/phone/name/email errors underneath matching input with aria-describedby.

## G2-1-034-022 [P1] GAP facet F07
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:98: 'We could not confirm that the invitation was accepted. Your form is still here; please retry.'
- Expected fix: Validate response outcome before showing success; avoid false confirmed joins.

## G2-1-034-039 [P1] GAP facet F13
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:98-99: preserves form on unconfirmed success payload.
- Expected fix: Keep form until durable acceptance attested.

## G2-1-034-046 [P1] GAP facet F18
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:176-184: heading and reviewDrive explanatory sentence.
- Expected fix: Restore drive mention exact wording when present.

## G2-1-034-051 [P1] GAP facet F20
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:97-99: checks response data object before joined status.
- Expected fix: Validate HTTP accepted payload shape before state transition.

## G2-1-034-054 [P1] GAP facet F22
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:28-35: Invite has college/company/reviewDrive/email/contactName/designation.
- Expected fix: Extend data contract for drive and pending status.

## G2-15-028-027 [P1] GAP facet F10
- Files: src/components/projects/mentor-sprint-write.tsx, src/components/projects/mentor-sprint-details-edit.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:91-96 — updateProject once with {sprints,sprintsToken} and original workspace snapshot.
- Expected fix: Build atomic bulk-plan endpoint with CAS token or document deliberate granularity.

## G2-10-025-028 [P1] GAP facet F06
- Files: src/modules/placements/recruiter-profile-details-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:245-252 — Mobile optional, blank clears, validates 10-digit.
- Expected fix: Reject invalid extra-digit/malformed phone instead of slicing

## G2-10-025-061 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-profile-details-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:245-252 — Mobile may be cleared; invalid rejects.
- Expected fix: Enforce original 10-digit semantics

## G2-10-002-010 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: Feed has recipient reach progress bar percent and N of M placement cells read `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:85-91`
- Expected fix: Aggregate recipients for a whole broadcast and display old reach fraction on its card

## G2-10-009-071 [P1] MISSING facet F12
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:51` REPLIES = status POSTED even if manually marked
- Expected fix: Restore posted conversation replies view

## G2-10-017-006 [P1] GAP facet F02
- Files: src/components/placements/placement-operations-overview.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:41-45,246-265 — Legacy overview metrics, policy, short attention queue, then active drive cards, retention and inline student lookup.
- Expected fix: Restore legacy section order and four-column active card grid.

## G2-10-017-026 [P1] GAP facet F05
- Files: src/components/placements/placement-operations-overview.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257 — Top counts activeTotal/allTotal and needs attention from dedicated endpoints.
- Expected fix: Create accurate mapping; do not claim same 'needs attention' from distinct aggregation.

## G2-10-017-028 [P1] MISSING facet F06
- Files: src/components/placements/placement-operations-overview.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:74-88 — Extend deadline modal updates same Important Dates application deadline, default +7 days end of day.
- Expected fix: Add Extend deadline menu using existing validated service.

## G2-10-017-087 [P1] GAP facet F23
- Files: src/components/placements/placement-operations-overview.tsx, src/components/placements/super-admin-drive-quick-search.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:41-45,523-597 — Active 60 card grid, attention badge, duplicate/extend actions is principal operator view.
- Expected fix: Rebuild card-first landing with attention above it.

## G2-10-014-035 [P1] MISSING facet F08
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:68-75 — Status update success 'Drive opened/closed' toast and failure toast plus Alert.
- Expected fix: Restore feedback when close/open returns.

## G2-10-019-051 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/module-access/page.tsx, src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:217-232; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:46-67 — GET /api/v1/admin/module-access/tree?collegeId loads entire resolved hierarchy.
- Expected fix: Provide tree DTO of all nodes with resolved module decisions/counts.

## G2-10-028-018 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/projects/page.tsx, src/modules/projects/admin-projects-query-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:444-461 — default table and inline table pagination.
- Expected fix: Unify default table selection.

## G2-10-023-061 [P1] GAP facet F12
- Files: src/app/(authenticated)/admin/tenants/create/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — New college auto-selects then setup identity tab.
- Expected fix: Implement automatic scope transition
