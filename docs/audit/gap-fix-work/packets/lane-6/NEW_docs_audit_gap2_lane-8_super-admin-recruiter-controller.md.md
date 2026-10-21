# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/super-admin-recruiter-controller.md

19 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-recruiter-controller.md

## G2-8-024-007  [P1] GAP  facet F03  effort M
- Legacy: Old grant capabilities list shown and stored as permissions (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,136-146).
- vNext now: New grant drawer displays validity and verification status but not capability chips in inspected section (src/components/admin/super-admin-hr-detail-drawer.tsx:223-249).
- Fix: Display/edit per-college capabilities or document deliberate retirement.

## G2-8-024-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy account identity Recruiter integer ID, contactMobile/contactMail, designation (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:79-100; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:411-446).
- vNext now: New account userId UUID, phoneE164/email/title + status (src/app/(authenticated)/admin/hr/page.tsx:78-88).
- Fix: Create old recruiterId to canonical user mapping, preserve email identity.

## G2-8-024-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy suspension reason up to 500 stored in Recruiter, tokenVersion increment (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-295).
- vNext now: New update sets ARCHIVED and terminates sessions, event metadata tracks changed fields only (src/modules/placements/super-admin-hr-service.ts:968-1031).
- Fix: Persist reason/auditable explanation and map suspension status semantics.

## G2-8-024-015  [P1] GAP  facet F05  effort M
- Legacy: Legacy global superadmin lists all, scoped restricts any college overlap (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:108-149,388-408).
- vNext now: New visibilityClause requires active grant and active relationship+college in scope (src/modules/placements/super-admin-hr-service.ts:77-140).
- Fix: Compare revoked/expired-only recruiters visibility in scoped admin for accurate audit review.

## G2-8-024-016  [P1] GAP  facet F06  effort M
- Legacy: Legacy create body includes profile fields and collegeIds list for initial grants (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:51-54,84-92).
- vNext now: New create chooses company relationship IDs, maps existing identity and grants (src/modules/placements/super-admin-hr-service.ts:647-684,703-847).
- Fix: Expose new company relationship selection while preserving legacy college choices and validation.

## G2-8-024-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy grant capabilities unknown value rejected with UNKNOWN_CAPABILITY (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:523-532).
- vNext now: New grant input has relationshipId and expiry but capabilities not shown in drawer (src/components/admin/super-admin-hr-detail-drawer.tsx:253-355).
- Fix: Add capability controls or intentionally default exact permission contract.

## G2-8-024-033  [P1] GAP  facet F10  effort M
- Legacy: Legacy suspend increments tokenVersion to revoke existing sessions immediately (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-295).
- vNext now: New ARCHIVED update calls terminateSuperAdminHrSessions after transaction (src/modules/placements/super-admin-hr-service.ts:997-1031).
- Fix: Make suspension+session invalidation failure atomic/retriable and test active token invalidation.

## G2-8-024-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy Delete soft-deletes recruiter + increments tokenVersion (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:307-315).
- vNext now: New profile status ARCHIVED is suspension rather than separate delete (src/modules/placements/super-admin-hr-service.ts:968-1031).
- Fix: Provide distinct deleted account lifecycle or document intentional removal.

## G2-8-024-041  [P1] GAP  facet F12  effort M
- Legacy: Legacy company resolved from recruiter's email domain; typed name used only for new company (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:535-544).
- vNext now: New canonical company/profile associated with an active relationship and identity (src/modules/placements/super-admin-hr-service.ts:647-684,788-805).
- Fix: Reject company-email domain mismatch and preserve single-company recruiter identity.

## G2-8-024-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy capability set on grant can be changed, unknown values rejected (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:523-532; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-146).
- vNext now: New grant verificationStatus and relationship, no capability list on viewed row (src/components/admin/super-admin-hr-detail-drawer.tsx:223-249).
- Fix: Define precise capability migration and effective runtime permission enforcement.

## G2-8-024-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy suspended and deleted differ (suspendedAt vs isDeleted), revocations persist (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-315).
- vNext now: New ACTIVE/ARCHIVED status and platform DISABLED separate status (src/modules/placements/super-admin-hr-service.ts:185-215,968-1005).
- Fix: Map suspended/deleted/disabled/archived distinctly to prevent accidental sign-in restoration.

## G2-8-024-059  [P1] GAP  facet F20  effort M
- Legacy: Legacy datetime nullable and LocalDateTime without timezone (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,177-183).
- vNext now: New persisted expiry timezone Date ISO timestamp, default UTC+3 months (src/modules/placements/super-admin-hr-service.ts:1040-1058).
- Fix: Normalize IST local end-of-day to UTC instant when migrating grant validity.

## G2-8-024-062  [P1] GAP  facet F22  effort M
- Legacy: Legacy RecruiterCollegeAccess owns recruiterId INT, collegeId INT, capabilities set, nullable validity/revoke status (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:19-61).
- vNext now: New college grants keyed recruiterUserId UUID and companyRelationshipId with verified status (src/modules/placements/super-admin-hr-service.ts:218-275).
- Fix: Build relational migration and capability/expiry/revocation reconciliation.

## G2-8-024-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy Recruiter has tokenVersion, isDeleted and suspension metadata (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-324).
- vNext now: New canonical users+placementRecruiterProfiles, separate status and terminate-session service (src/modules/placements/super-admin-hr-service.ts:185-215,968-1031).
- Fix: Preserve deletion and token invalidation semantics and support historical reason.

## G2-8-024-064  [P1] GAP  facet F22  effort M
- Legacy: Legacy scoped collegeIds can attach grants to a recruiter across colleges from request (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:51-54,84-92).
- vNext now: New requires active company-relationship ID per granted college (src/modules/placements/super-admin-hr-service.ts:717-756,810-835).
- Fix: Backfill or create matching company relationship for old grants before import.

## G2-8-024-065  [P1] GAP  facet F23  effort M
- Legacy: Legacy arbitrary capability grant per college and indefinite validity available (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,136-146).
- vNext now: New verified company relationships and 3-month default expiries, no capabilities in account drawer (src/components/admin/super-admin-hr-detail-drawer.tsx:223-302).
- Fix: Document explicit product retirement of indefinite custom-capability grants if intentional.

## G2-8-024-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid contactMail message contactMail is not a valid email (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:571-575).
- vNext now: New new-user email validation errors from canonical identity (src/modules/placements/super-admin-hr-service.ts:689-692).
- Fix: Present meaningful legacy-grade contact email error and map field focus.

## G2-8-024-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy missing body emits BODY_REQUIRED Request body is required (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-140; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:191-195).
- vNext now: New strict input parse throws schema validation error (src/modules/placements/super-admin-hr-service.ts:647-654).
- Fix: Return consistent 400 actionable body error from routes.

## G2-8-024-028  [P2] GAP  facet F08  effort M
- Legacy: Legacy Delete returns Recruiter deleted (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:129-134).
- vNext now: New account archive/suspend flow is primary, no deletion shown in drawer (src/components/admin/super-admin-hr-detail-drawer.tsx:167-171,375-395).
- Fix: Add explicit delete/retire action or explain intentional non-destructive model.
