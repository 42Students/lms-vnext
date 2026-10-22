# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-011-028 [P1] GAP facet F10
- Files: src/modules/operations/scheduled-job-lease.ts
- Legacy: Legacy optional scheduler lock absent runs anyway `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:35-41`
- Expected fix: Decide fail-safe strategy and ensure metrics on lock failure.

## G2-19-014-010 [P1] GAP facet F05
- Files: scripts/sql/db10-sms-delivery-attempts-staging.sql
- Legacy: Legacy exact recipientSuffix and purpose AND optional null filters `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- Expected fix: Implement exact-match suffix and purpose predicates before paginating.

## G2-19-014-016 [P1] GAP facet F07
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Legacy SMS provider failures stored safe summary, support can query FAILED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:42-49` `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:28-34`
- Expected fix: Persist sanitized failure code/summary for each attempted send.

## G2-19-014-024 [P1] MISSING facet F10
- Files: scripts/sql/db10-sms-delivery-attempts-staging.sql
- Legacy: Legacy query optionally filters by suffix/purpose and ordered descending `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- Expected fix: Register transactional read handler and route.

## G2-19-014-025 [P1] GAP facet F11
- Files: scripts/sql/db10-sms-delivery-attempts-staging.sql
- Legacy: Legacy superadmin-only cross-tenant support read `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:29-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:58-59`
- Expected fix: Implement permissions for global support and forbid arbitrary org selection by non-global roles.

## G2-19-014-030 [P1] GAP facet F13
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Legacy missing recipient/status rows are simply absent from Page `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- Expected fix: Show explicit 'No attempts found' and distinguish ledger unconfigured.

## G2-19-014-042 [P1] GAP facet F20
- Files: src/modules/notifications/exotel-sms.ts, scripts/sql/db10-sms-delivery-attempts-staging.sql
- Legacy: Legacy provider logging precedes later read without delayed recomputation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:8-17`
- Expected fix: Persist attempt atomically or durably enqueue recorder for support lookup.

## G2-19-014-044 [P1] GAP facet F21
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Legacy BulkSMSApps and Exotel write same model per DB031 source review `docs/planning/database-parity-db10-sms-delivery-attempts.md:22-29`
- Expected fix: Capture OTP, absence, correction, job.update attempts generically, not just OTP.

## G2-19-014-045 [P1] GAP facet F22
- Files: scripts/sql/db10-sms-delivery-attempts-staging.sql
- Legacy: Legacy table `sms_delivery_log` integer ID, purpose, suffix, status, provider id, error_summary, college_id, created_at `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-35`
- Expected fix: Map legacy rows to new privacy-safe table and status codes.

## G2-19-014-048 [P1] GAP facet F23
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Legacy admin can answer 'what happened to number ending XXXX' `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:14-24` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-82`
- Expected fix: Store both failure and accepted attempts and expose bounded support lookup.

## G2-19-001-026 [P1] GAP facet F06
- Files: src/components/college/college-student-register-form.tsx, src/modules/people/college-student-registration-service.ts
- Legacy: Legacy register First/Last/Roll/Mobile/Program/Class all individually required `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1134-1170`,1191-1218
- Expected fix: Restore required Roll/Class parity or document the new batch-first enrollment policy as an intentional change.

## G2-19-001-032 [P1] GAP facet F06
- Files: src/components/college/college-person-edit-action.tsx, src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy edit can update first/last name, login mobile/email, college placement program/class `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:526-568`
- Expected fix: Provide an explicitly permissioned account-identity and academic-placement edit workflow instead of silently dropping fields.

## G2-19-001-047 [P1] GAP facet F10
- Files: src/components/college/college-student-register-form.tsx, src/modules/people/college-student-registration-service.ts
- Legacy: Legacy register POST `/api/v1/learner/register`, payload first_name,last_name,contact_mobile,contact_mail,roll_number,college_id,class_id,program_id,gender,dob,address `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:493-508`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-340`
- Expected fix: Document field mapping and enrollment semantics; ensure required legacy class enrollment parity.

## G2-19-001-051 [P1] MISSING facet F10
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy clear-OTP operation keyed by learner mobile `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:685-694`
- Expected fix: Provide rate-limit unlock with superadmin authorization and audit receipt.

## G2-19-001-082 [P1] GAP facet F20
- Files: src/components/college/college-student-csv-import.tsx
- Legacy: Legacy FileReader sequence prevents slow old CSV selection overwriting latest upload `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:729-756`
- Expected fix: Add monotonically increasing file-select revision and ignore late reads after newer selection.

## G2-2-006-056 [P1] MISSING facet F21
- Files: (none, new feature)
- Legacy: LF:8-10 UploadFromLinkButton and uploadFileViaPresign
- Expected fix: Integrate link import and upload with tenant-based access checks.

## G2-2-009-044 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: LF:456-463 multi-session cell CSV n/m
- Expected fix: Export aggregate attended/marked ratio identical to displayed legacy grid.

## G2-2-012-029 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LC:79-83 superadmin or collegeadmin scoped via AccessControl
- Expected fix: Provide selected-college Super Admin admin dashboard access via approved acting scope.

## G2-2-014-025 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LC:130-135 catches each course failure and continues
- Expected fix: Isolate unauthorized/invalid course and process remaining permitted IDs.

## G2-2-018-011 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: Lessons.js:397-398 green `Visible` or neutral `Hidden` computed active AND enabled
- Expected fix: Compute student-visible status from lesson flags, not published-content count.

## G2-2-024-007 [P1] GAP facet F04
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: SmsDeliveryLog.java:24-55 ID,purpose,recipientSuffix,status,providerMessageId,errorSummary,collegeId,createdAt
- Expected fix: Persist provider message ID and redacted attempt metadata in indexed DB.

## G2-2-024-008 [P1] GAP facet F04
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: AdminSmsLogController.java:74-83 response content,totalElements,totalPages,number,size,note
- Expected fix: Return actual attempt history and explicit provider-acceptance caveat.

## G2-2-024-017 [P1] MISSING facet F08
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: AdminSmsLogController.java:80-82 note exact SENT means operator accepted, not handset delivery
- Expected fix: Expose provider-acceptance caveat beside statuses in UI and API response.

## G2-2-024-021 [P1] MISSING facet F10
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: AdminSmsLogController.java:71-72 searches persisted SmsDeliveryLog
- Expected fix: Persist OTP accepted/failed outcomes and provider IDs transactionally where possible.

## G2-2-024-022 [P1] GAP facet F10
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: SmsDeliveryLogRepository.java:18-24 search suffix and purpose via DB
- Expected fix: Add dispatched-attempt event rows separate from queue state.
