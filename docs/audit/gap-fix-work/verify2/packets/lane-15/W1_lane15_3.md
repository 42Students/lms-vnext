# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-030-061 [P1] GAP facet F22
- Files: src/db/schema/profiles.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:204-215 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyProfileServiceImpl.java:112-130 — faculty.website stores approved image URL/key.
- Expected fix: Define avatar storage relationship, issuer IDs, asset ownership and migration.

## G2-10-025-011 [P1] MISSING facet F03
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:207-220 — College item has TPO contact name and email.
- Expected fix: Render authorized TPO contact or contact missing state

## G2-10-003-040 [P1] GAP facet F12
- Files: src/components/activity/activity-center.tsx
- Legacy: Old technical event parser handles ENTITY_VERB_BULK naming `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:4-61`
- Expected fix: Add explicit event-code to canonical sentence mapping and action tone test vectors

## G2-10-004-019 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy duplicate company names permitted after domain-global V202 migration `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19`
- Expected fix: Allow distinct real companies with same name but distinct verified domains; move unique identity to domain

## G2-10-004-087 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy V202 one shared company, domains unique per domain, college_company has private notes contacts & owner `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:21-60`
- Expected fix: Add permissioned college CRM contact/notes model or record deliberate data feature removal

## G2-10-004-088 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy V202 allows same company name for distinct global identities by domain `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:30-42`
- Expected fix: Remove name-global uniqueness and enforce canonical identity/domain rules

## G2-10-006-031 [P1] GAP facet F06
- Files: src/components/electives/college-elective-offering-manager.tsx
- Legacy: Old offering created by courseId and nullable capacity, no explicit group selection in old modal `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:71-83`
- Expected fix: Map course to delivery/section automatically or document new requirement and migrate existing electives safely

## G2-10-006-052 [P1] GAP facet F12
- Files: src/components/electives/college-elective-offering-manager.tsx
- Legacy: Old capacity nullable allows unlimited seats in offering `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:169-174` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:71-79`
- Expected fix: Support null unlimited capacity and display unlimited where chosen

## G2-10-006-075 [P1] GAP facet F21
- Files: src/components/electives/college-elective-offering-manager.tsx
- Legacy: Old roster allocation and faculty changes happen synchronously in controller service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:153-195`
- Expected fix: Ensure synchronous faculty and allocation operations stay available under authorized superadmin acting-college role

## G2-10-006-077 [P1] GAP facet F22
- Files: src/db/schema/electives.ts
- Legacy: Old offering binds course group AND group-backed class roster_group_id `docs/legacy-source/backend/src/main/resources/db/migration/V167__electives.sql:14-18` `docs/legacy-source/backend/src/main/resources/db/migration/V167__electives.sql:39-56`
- Expected fix: Document precise group-backed class to course-section-delivery mapping for grade and attendance parity

## G2-10-007-088 [P1] GAP facet F22
- Files: src/db/schema/module-access.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-25` app_setting string setting_key/value and integer scope
- Expected fix: Write explicit app_setting-to-rule migration map when data migration applies

## G2-10-008-119 [P1] GAP facet F22
- Files: src/db/schema/placement-college-application-stages.ts, src/modules/admin-ui/super-admin-hiring-report-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:13-35` legacy immutable history records old/new status, changedAt, actor
- Expected fix: Preserve historical transitions in equivalent vNext schema and use for funnel/time-to-shortlist

## G2-10-009-011 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` REPLIES Posted to conversations and DONE/ALL segments
- Expected fix: Reinstate REPLIES based on mail-routing status, not only triage status

## G2-10-009-087 [P1] MISSING facet F15
- Files: src/db/schema/inbound-mail.ts, src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:109-122` postEmailReply triggers message handling, non-posted retained for manual triage
- Expected fix: Persist non-posted reply as staff actionable item with reason/status tag

## G2-10-009-106 [P1] GAP facet F20
- Files: src/db/schema/inbound-mail.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:78-81` duplicate Message-ID dedupe insert ignore
- Expected fix: Enforce durable idempotent ingestion transaction after HMAC/worker validation

## G2-10-009-115 [P1] GAP facet F22
- Files: src/db/schema/inbound-mail.ts
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:4-12` inbound_email has kind, body_text, recruiter_id, learner_id, college_id, handled_at/by plus idx kind/handled
- Expected fix: Extend schema with routing status, kind, sender identity joins and handledAt/by and indexes

## G2-10-009-117 [P1] MISSING facet F22
- Files: src/db/schema/inbound-mail.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35` preview, threadId, recruited/student names derived via joins
- Expected fix: Add dedicated foreign keys or indexed reference fields plus safe joined projection

## G2-10-009-119 [P1] GAP facet F22
- Files: src/db/schema/inbound-mail.ts
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:10-11` handledAt/by audit dates + actor
- Expected fix: Add handler and timestamp for staff triage; log transitions

## G2-10-011-055 [P1] GAP facet F12
- Files: src/db/schema/placement-college-application-stages.ts, src/modules/placements/college-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-40 — Single canonical applicationStatus updated with timestamp/actor.
- Expected fix: Display/persist consistent canonical status vs stage and explain current pipeline projection.

## G2-10-011-084 [P1] GAP facet F22
- Files: src/db/schema/placement-college-application-stages.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:39-46,133-141 — JobApplication carries statusUpdatedAt/by and version optimistic token.
- Expected fix: Project last-updated actor/time and preserve version checks for candidate edits.

## G2-10-013-075 [P1] GAP facet F21
- Files: src/modules/placements/college-round-slot-action-service.ts, src/modules/placements/college-drive-interviews-service.ts
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-49; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — InterviewService GET responds interview objects including job, learner, status, schedule, mode.
- Expected fix: Map legacy view model to slots+rounds+candidate identities without losing status.

## G2-10-012-004 [P1] MISSING facet F01
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-213 — Header actions Edit drive -> /superadmin/jobs/:id/settings and View applications -> /superadmin/jobs/:id/applications.
- Expected fix: Add Edit drive to settings and preserve primary View applications CTA for Super Admin.

## G2-10-012-020 [P1] MISSING facet F05
- Files: src/components/placements/super-admin-drive-pipeline.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:16-20,81-88 — Attention grouped by type and sorted in category declaration; candidate links mapped to APPLIED/INTERVIEW/OFFERED status.
- Expected fix: Keep specified category sequence and status deep-link mapping.

## G2-10-012-025 [P1] GAP facet F06
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-212 — Edit drive and View applications are visible direct buttons.
- Expected fix: Restore direct edit destination in settings; do not hide critical action in dropdown.

## G2-10-012-042 [P1] GAP facet F10
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-213 — Edit and Applications URLs under /superadmin/jobs/{jobId}.
- Expected fix: Map correct Super Admin edit route; avoid TPO-only hrefs from Super Admin.
