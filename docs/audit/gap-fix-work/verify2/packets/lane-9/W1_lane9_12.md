# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-026-047 [P1] GAP facet F21
- Files: src/app/api/internal/placements/recruiter-message-inbound/route.ts, src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy Cloudflare Email Routing Worker stores mail 30 days in Cloudflare D1 and sends provider-signed payload. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-27`
- Expected fix: Implement/configure gateway, rotation and webhook observability.

## G2-5-026-051 [P1] GAP facet F23
- Files: src/app/api/internal/placements/recruiter-message-inbound/route.ts, src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy rejects with secret shared as constant-time bytes, can work cross-origin from Cloudflare. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:64-67`
- Expected fix: Create authenticated proxy/gateway and document origin headers.

## G2-5-031-029 [P1] MISSING facet F08
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy delete toast `Admin deleted.`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:243-246`
- Expected fix: Add permanent deletion receipt when safe and authorized.

## G2-6-021-018 [P1] GAP facet F10
- Files: src/modules/organizations/service.ts
- Legacy: Hibernate sets createdAt on insert (@CreationTimestamp) and updatedAt on updates (@UpdateTimestamp) (BaseModel.java:28-34).
- Expected fix: Audit every vNext mutable table/service for updatedAt writes; add triggers where bulk mutations bypass service.

## G2-6-015-014 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Job list excludes soft-deleted candidates (JobApplicationRepository.java:88-90).
- Expected fix: Default active register must exclude WITHDRAWN; expose explicit history filter.

## G2-6-019-031 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Legacy GET requireAccessLearner; PUT requireWriteAccessLearner (LearnerProfileController.java:1177-1200).
- Expected fix: Confirm staff profile read/edit rights remain where old requireAccessLearner allowed them, without allowing staff to change private consent.

## G2-11-020-037 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Follow-up datetime D MMM, h:mm A with optional About text (index.js:653-656).
- Expected fix: Support optional time selection; preserve selected wall time and timezone.

## G2-11-026-018 [P1] MISSING facet F09
- Files: (none, new feature)
- Legacy: No controller UI dialogs: attachment presign then PUT to URL then confirm (PublicBugTrackerController.java:64-76; BugTrackerAttachmentService.java:63-73,75-137).
- Expected fix: Implement presign/confirm sequence and caller error/retry states.

## G2-12-011-022 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: feed(recruiterId,collegeId) derives audit, requests, messages from SQL and returns {feed,unread,unreadTotal} (RecruiterNotificationService.java:70-153).
- Expected fix: Implement compatibility projection with feed/unread/unreadTotal and action links.

## G2-6-018-020 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy edit Cancel warns of unsaved edits (Organizations.js:129-146,208-216).
- Expected fix: Add dirty-form confirmation Discard changes to this organization? with matching copy and Escape/close guard.

## G2-6-031-001 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Legacy route /superadmin-login is its own unauthenticated page and is explicitly nolayout, not redirected (superadmin-login.js:6-25).
- Expected fix: Restore legacy route's recognizable branded login surface or record approved single-login consolidation and preserve returnTo.

## G2-6-005-020 [P1] GAP facet F11
- Files: src/app/(authenticated)/teacher/contacts/page.tsx, src/modules/courses/faculty-contacts-service.ts
- Legacy: Old index does not perform role/tenant check, contacts target enforces access `docs/legacy-source/frontend/src/pages/teacher/contacts/index.js:11-19` `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:15-23`
- Expected fix: Document narrower Faculty-only requirement at destination and ensure non-Faculty staff route resolution

## G2-6-004-016 [P1] GAP facet F04
- Files: src/modules/courses/faculty-contacts-service.ts
- Legacy: Old contact mobile and email sourced ContactDTO fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-90` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:94-104`
- Expected fix: Resolve privacy decision explicitly: authorized direct contact vs masked/removed contact fields

## G2-6-004-022 [P1] GAP facet F05
- Files: src/modules/courses/faculty-contacts-service.ts
- Legacy: Old page search matches name, email, mobile substring, fetching up to 5000 rows `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:78-116`
- Expected fix: If contact data is allowed, support email/mobile search with permission guard; otherwise record privacy-motivated difference

## G2-6-004-030 [P1] GAP facet F07
- Files: src/modules/courses/faculty-contacts-service.ts
- Legacy: Old backend guards staff-only with `The contacts directory is for staff only` on learner/recruiter `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-447`
- Expected fix: Define whether superadmin/mentor/staff access parity is needed and match access error wording

## G2-6-004-038 [P1] GAP facet F10
- Files: src/modules/courses/faculty-contacts-service.ts
- Legacy: Old UserServiceImpl merges faculty and learner contacts, no writes `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:77-134`
- Expected fix: Reconcile record count, role duplicates and inactive inclusion semantics with old source

## G2-6-004-039 [P1] GAP facet F10
- Files: src/modules/courses/faculty-contacts-service.ts
- Legacy: Old `getContacts` returns ContactDTO with public email, phone and avatar URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-90`
- Expected fix: Document/contact data availability decision and implement authorized masking/access

## G2-6-004-040 [P1] GAP facet F11
- Files: src/modules/courses/faculty-contacts-service.ts
- Legacy: Old controller denies learners/recruiters but allows same-college staff and SuperAdmin `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-448`
- Expected fix: Support original audience or explicitly change navigation for other staff

## G2-6-004-068 [P1] GAP facet F22
- Files: src/modules/courses/faculty-contacts-service.ts
- Legacy: Old ContactDTO has first/last, email, mobile, profile image, userType `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-104`
- Expected fix: Map each legacy DTO field, document intentionally private omissions and data access policy

## G2-6-007-016 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: Old avoids rendering faculty course data at root `docs/legacy-source/frontend/src/pages/teacher/index.js:9-11`
- Expected fix: Add route alias and forward before route not-found

## G2-6-008-032 [P1] GAP facet F09
- Files: src/modules/courses/faculty-notification-link-model.ts, src/components/activity/notification-list.tsx
- Legacy: Old detail footer has conditional View Course/View Interview/Take Assessment and `Got it` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-746` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`
- Expected fix: Offer only validated faculty-safe conditional deep links; retain Got it and modal close

## G2-6-008-040 [P1] GAP facet F11
- Files: src/modules/courses/faculty-notification-link-model.ts
- Legacy: Old notifications modal course links adapt to role base path `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:99-107`
- Expected fix: Audit legacy mentor base path and explicitly support only valid entitled course URLs

## G2-12-027-019 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:35-46: updates may omit faculty/course/class/semester and retain originals.
- Expected fix: Provide validated full reassignment/edit or formally deprecate partial-edit capabilities.

## G2-13-023-050 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:340-354 round_assignment.student_confirmed_at on round/app; room and slot FK.
- Expected fix: Migrate old booking slot identity, confirmation timestamp, room/time and version to candidate-slot records.

## G2-15-025-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LBE/controller/RecruiterCollegeController.java:71-75 GET `/overview` returns college summary with recruiter privacy and counts.
- Expected fix: Restore privacy-banded college overview as a separate authorized read view.
