# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-001-011 [P1] GAP facet F06
- Files: src/modules/people/college-faculty-lifecycle-model.ts
- Legacy: `AdminUserLifecycleService.js:5-6`, `Faculty.js:495`, `Students.js:645` send `{}` with no reason; legacy controller treats body and reason as optional (`AdminUserLifecycleController.java:86-90`).
- Expected fix: Define one reason policy and apply it consistently to learner/faculty/superadmin lifecycle surfaces; preserve legacy no-reason behaviour only if owner opts in.

## G2-1-001-046 [P1] GAP facet F22
- Files: src/db/schema/memberships.ts, drizzle/0000_hard_the_spike.sql, src/db/schema/users.ts
- Legacy: `Learner.java:21-28,64-74` and `Faculty.java:25-32,59-69` store per-account `suspended_at`, `suspension_reason`, `token_version`, JPA `version`; `AdminUserLifecycleController.java:97-99` mutates person table.
- Expected fix: Preserve equivalent immediate token invalidation using device-session/auth checks instead of removed token_version; document one-account-to-many-memberships mapping.

## G2-1-029-014 [P1] GAP facet F04
- Files: src/modules/placements/company-share/column-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:9: label 'Resume' as openable link.
- Expected fix: Provide scanner-backed signed resume URLs or explicit unavailable state.

## G2-1-029-019 [P1] GAP facet F04
- Files: src/modules/placements/company-share/column-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:131: unsafe resume links displayed 'Link not shown', safe clickable Open.
- Expected fix: Add safe signed resume links with fallback label and audit.

## G2-1-029-052 [P1] GAP facet F14
- Files: src/modules/placements/company-share/column-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:131: resume safeHref link opens in new tab.
- Expected fix: Implement signed receipt/short TTL delivery before showing link.

## G2-1-003-076 [P1] GAP facet F22
- Files: src/db/schema/profiles.ts, drizzle/0067_faculty_profile_document.sql
- Legacy: `FacultyProfileServiceImpl.java:90-615` stores metadata, arrays and identity in legacy `Faculty` entity JPA fields.
- Expected fix: Build field-by-field migration contract for all 15 sections and legacy orphaned faculty profiles; validate tenant-specific mapping.

## G2-1-003-080 [P1] GAP facet F23
- Files: src/app/api/people/faculty-self-document/route.ts
- Legacy: `FacultyProfileController.java:191-807` permits college-admin reads/edits of other faculty except protected admin/TPO writes.
- Expected fix: Secure admin-scoped editing gap is a separate required product decision, not merely UI polish.

## G2-12-013-001 [P1] GAP facet F01
- Files: src/app/api/notifications/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:18-42: GET /api/v2/notifications/search.
- Expected fix: Expose scoped text search equivalent with typed q and tenant constraints.

## G2-12-013-004 [P1] GAP facet F03
- Files: src/app/api/notifications/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:41-46: query/limit/classId/courseId params.
- Expected fix: Support old query/scope parameters or link to module-specific inbox.

## G2-12-022-009 [P1] GAP facet F04
- Files: drizzle/0024_placements_p6c_results.sql
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/RoundResult.java:24-71 — Long/Integer IDs; outcome, rank, Double score, reason, comment, source, submitter, timestamps
- Expected fix: Specify exhaustive old-to-new field crosswalk; preserve comment confidentiality

## G2-12-022-059 [P1] GAP facet F22
- Files: drizzle/0024_placements_p6c_results.sql
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/RoundResult.java:36-58 — score Double, nullable category/comment, source string
- Expected fix: Define rounding, legacy source→TPO/HR/IMPORT mapping, and reject overflow explicitly

## G2-12-030-032 [P1] GAP facet F10
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:184-190,234-257 — locks application/learner; cross-checks job/learner and application
- Expected fix: Verify cross-drive candidate conflict and concurrency locking across same learner.

## G2-12-030-035 [P1] GAP facet F12
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:332-340 — cannot create new round while previous same-application round active
- Expected fix: Add active-round succession rule or document deliberate multiple concurrent interviews.

## G2-12-030-036 [P1] GAP facet F12
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:367-408 — schedule auto-advances application SHORTLISTED/ASSESSMENT to INTERVIEW with status notifications
- Expected fix: Restore learner pipeline auto-advance or confirm vNext stage projection renders equivalent.

## G2-12-030-041 [P1] GAP facet F15
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:363-408 — sends status/round notices after commit, specific stage cases
- Expected fix: Match round-specific context and validate email/push/reminder channel parity.

## G2-12-030-046 [P1] GAP facet F19
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:56-71 — get full organization interviews per open form
- Expected fix: Avoid truncated candidate/overlap scan; paginate or query overlap server-side.

## G2-12-030-048 [P1] GAP facet F20
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:184-190,234-257 — pessimistic locks for applicant and learner to serialize parallel bookings
- Expected fix: Lock candidate across jobs and enforce conflict at database/concurrency boundary.

## G2-12-030-050 [P1] GAP facet F21
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:259-266,285-298 — round description and location sanitized before interpolation into candidate notifications
- Expected fix: Document safe template rendering and secure meeting URL disclosure.

## G2-12-030-051 [P1] GAP facet F21
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:25-39 — fetch organization interviews for conflict list with auth scope
- Expected fix: Provide authorized cross-drive conflict read needed for creation preview.

## G2-12-030-054 [P1] GAP facet F23
- Files: src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:76-89 — client warning for same learner or company interviewer with 15 min buffer
- Expected fix: Implement full conflict semantics in server and client, or explicitly designate reduced scope.

## G2-15-019-007 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:41-44 — nullable Long @Version optimistic lock
- Expected fix: Add CAS/version for shared company updates

## G2-15-019-014 [P1] GAP facet F09
- Files: src/db/schema/placements.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:41-44 — JPA @Version protects concurrent edits
- Expected fix: Document compare-and-swap update token

## G2-15-019-028 [P1] GAP facet F20
- Files: src/db/schema/placements.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:41-44 — JPA optimistic @Version on entity
- Expected fix: Enforce conditional mutations and stale edit conflict

## G2-18-015-002 [P1] GAP facet F01
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:37-46 — SECTION and GROUP_BACKED polymorphic classType
- Expected fix: Map elective backed groups to explicit offerings/group roster without synthetic section

## G2-18-015-005 [P1] GAP facet F03
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:44-46 — rosterGroupId only meaningful for GROUP_BACKED
- Expected fix: Retain relation to live group roster for electives
