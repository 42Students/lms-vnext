# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-010-048 [P1] MISSING facet F13
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy empty public base+domain returns empty string for workspaceLink (`TpoMailService.java:133-152`).
- Expected fix: Provide validated absolute link or explicitly indicate unavailable, avoid blank CTA.

## G2-18-010-050 [P1] GAP facet F15
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy TpoMailService itself dispatches actual email only when configured+allowed (`TpoMailService.java:172-190`).
- Expected fix: Validate production bridge flags, template provisioning, sender DNS and worker secret; expose readiness.

## G2-18-010-056 [P1] MISSING facet F17
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy college link anchors to `https://{host}/recruiter`, from verified domain preference (`TpoMailService.java:133-153`).
- Expected fix: Ensure email CTA text explicit and verified HTTPS destination in template.

## G2-18-010-057 [P1] GAP facet F18
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy exact template placeholders `name`, `collegeName`, `workspaceLink` (`TpoMailService.java:88-96,196-200`).
- Expected fix: Produce template-merge crosswalk and provision compatible Zepto templates.

## G2-18-010-066 [P1] GAP facet F21
- Files: src/modules/placements/recruiter-message-email-provider.ts, src/modules/placements/recruiter-message-email-inbound-service.ts, src/db/schema/tenant-domains.ts
- Legacy: Legacy integrates ZeptoMail, tenant-domain DB, Cloudflare replies via Worker (`TpoMailService.java:43-46,133-153,183-185`).
- Expected fix: Verify provider token/From DNS, Cloudflare HMAC webhook and tenant URL mapping.

## G2-19-021-046 [P1] GAP facet F21
- Files: src/modules/placements/application-service.ts
- Legacy: Old job applicant resume can differ from profile document. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-69` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-661`
- Expected fix: Store per-application snapshot rather than silently replacing with profile.

## G2-19-021-048 [P1] GAP facet F22
- Files: src/modules/placements/validation.ts
- Legacy: Old DTO single nullable String with Java Pattern, service 2048/HTTPS/host constraints. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:13-17` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:401-412`
- Expected fix: Version schema around secure owned storage reference, not arbitrary URL.

## G2-19-021-049 [P1] GAP facet F22
- Files: src/modules/placements/application-service.ts
- Legacy: Old application resume_url, resume_history data are persisted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-69` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:599-618`
- Expected fix: Extend migration/schema to preserve historical applicant resume snapshots.

## G2-19-003-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/course-progress/page.tsx
- Legacy: Course Progress heading and class/course completion purpose `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-245`
- Expected fix: Restore class/course measured-completion default route and exact page title.

## G2-19-011-001 [P1] GAP facet F01
- Files: src/modules/placements/learner-job-service.ts, src/modules/placements/application-deadline-policy.ts
- Legacy: Legacy cron at 01:00 server-time deactivates expired job rows, no UI route `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:14-17` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-41`
- Expected fix: Record lifecycle choice: persist auto expiry or consistently derive application closure.

## G2-19-011-002 [P1] GAP facet F01
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy active job query omits `isActive=false` once sweep persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- Expected fix: Decide hidden vs view-only expired drives and match all entry points.

## G2-19-011-027 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy worker saves `isActive=false` for all matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:53-69`
- Expected fix: Do not blindly call manual-close service from scheduled expiry.

## G2-19-011-029 [P1] GAP facet F11
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy global system job has no principal check `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-53`
- Expected fix: Use auditable system actor and scoped DB write for scheduled closure.

## G2-19-011-032 [P1] GAP facet F12
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy expiry sets inactive only; existing recruitment stages/issued offers untouched `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- Expected fix: Separate application intake closure from entire-drive stop/offer revocation.

## G2-19-011-049 [P1] GAP facet F19
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy entire loop under `@Transactional` with per-row catch `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:43-47` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-69`
- Expected fix: Design idempotent per-job transaction and retry marker for automated processing.

## G2-19-011-057 [P1] GAP facet F22
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy expiry repository predicate excludes inactive/soft deleted/draft `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188`
- Expected fix: Preserve draft/deleted exclusion in all read and write paths.

## G2-19-006-077 [P1] GAP facet F22
- Files: src/modules/attendance/learner-attendance-filter-model.ts, src/modules/attendance/learner-service.ts
- Legacy: Legacy single numeric courseId selects attendance, independent of sections `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:146-163`
- Expected fix: Handle migrated duplicate course deliveries and preserve historical attendance visibility.

## G2-19-017-029 [P1] GAP facet F11
- Files: src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx
- Legacy: Legacy history DTO exposes actor and before/after fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:8-21`
- Expected fix: Design permission-dependent summary vs full diff; ensure no secrets leak.

## G2-2-006-044 [P1] MISSING facet F14
- Files: (none, new feature)
- Legacy: LF:163-183 presigned PDF/FILE R2 direct upload, Link importer LF:8-10
- Expected fix: Add persisted scanned/attested file materials (PDF/FILE), upload and from-link controls.

## G2-2-009-010 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LC:242-249 record includes present,attendanceStatus,markedBy/Name,markedAt
- Expected fix: On correction open refetch exact record state with server denial/error instead of relying on potentially stale grid.

## G2-2-011-035 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:163-186 one failed occurrence does not roll back any success
- Expected fix: Guarantee per-date independent persistence or document stronger all-or-none behavior.

## G2-2-014-011 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LF:616-620 selection persists after pagination/filtering
- Expected fix: Retain selected IDs across filter/page within same scope, clear on acting-college change.

## G2-2-016-002 [P1] MISSING facet F01
- Files: src/modules/placements/job-service.ts
- Legacy: Get job by slug supports legacy public external job URL (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2242-2278`)
- Expected fix: Add safe legacy public slug resolver for approved external job access; don't expose tenant data

## G2-2-016-014 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: EXTERNAL_ONLY rejects all targeting fields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:512-526`)
- Expected fix: Explicitly enforce no hidden LMS targeting for external-only public applications if retained

## G2-2-016-017 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts, src/modules/placements/job-service.ts
- Legacy: Target hierarchy validates class→batch/program→department and college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2018-2137`)
- Expected fix: Verify exact hierarchy/archival/tenant validation against courses/groups schema
