# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/super-admin-recruiter-controller.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-recruiter-controller.md

## G2-8-024-001  [P2] GAP  facet F01  effort M
- Legacy: Old Super Admin /api/v1/superadmin/recruiters GET list and POST create (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:35-36,67-92).
- vNext now: New page /admin/hr (redirects clients /admin/recruiters) fetches server list (src/app/(authenticated)/admin/hr/page.tsx:26-39,71-76,168-171).
- Fix: Ensure old recruiter account links resolve to new canonical admin directory.

## G2-8-024-003  [P2] GAP  facet F01  effort M
- Legacy: Old GET /companies exposes recruiter-associated company options (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:74-77).
- vNext now: New relationship options list only active companies+relationships (src/modules/placements/super-admin-hr-service.ts:495-565).
- Fix: Clarify separate company directory entry and active-relationship filter.

## G2-8-024-006  [P2] GAP  facet F03  effort M
- Legacy: Old recruiter fields firstName,lastName,contactMobile,contactMail,designation,companyName (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:73-81).
- vNext now: New uses canonical displayName, phoneE164, email, title, companyName (src/app/(authenticated)/admin/hr/page.tsx:78-105).
- Fix: Map exact identity fields and ensure first/last name separation where editable.

## G2-8-024-008  [P2] GAP  facet F03  effort M
- Legacy: Old suspend/reactivate, Revoke sessions, Delete actions all exposed by controller (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:103-134).
- vNext now: New drawer shows Edit account and Terminate all sessions, status badge; no Delete button in shown drawer (src/components/admin/super-admin-hr-detail-drawer.tsx:115-125,167-171,375-395).
- Fix: Restore/clearly explain suspended/reactivated/deleted account controls.

## G2-8-024-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy response wraps hr in mutations, includes colleges and activeCollegeCount in detail (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:84-100; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:411-446).
- vNext now: New page maps grants array and status into HrAccount, no hr wrapper (src/app/(authenticated)/admin/hr/page.tsx:78-114).
- Fix: Version/translate old API envelope if any clients still consume it.

## G2-8-024-013  [P2] GAP  facet F05  effort M
- Legacy: Old list defaults page=0,size=25, caps 100; search query q (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:67-72; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:46,108-112).
- vNext now: New page uses page/pageSize filters, default 25 from redirect logic (src/app/(authenticated)/admin/hr/page.tsx:129-155).
- Fix: Normalize 0-based legacy page to 1-based URL, keep page-size cap and old search state.

## G2-8-024-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy contactMobile optional; company email mandatory; regex and lower-case (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:191-197,571-575).
- vNext now: New canonical users email and phoneE164 stored separately (src/modules/placements/super-admin-hr-service.ts:689-692,936-960).
- Fix: Ensure email is required for recruiter creation and normalize before identity matching.

## G2-8-024-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy company choices GET /companies returns items list (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:74-77).
- vNext now: New Select eligibleRelationships only from active company/college relationships (src/components/admin/super-admin-hr-detail-drawer.tsx:261-293).
- Fix: Ensure no eligible companies screen tells user why and how to create company relationship.

## G2-8-024-032  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST create and PUT update audit RECRUITER_CREATE/RECRUITER_UPDATE (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:84-100).
- vNext now: New writes canonical user/profile/grants and activity events within transaction (src/modules/placements/super-admin-hr-service.ts:647-847,997-1016).
- Fix: Map action taxonomy and ensure one audit per mutation without exposing private contact data.

## G2-8-024-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy revoke sessions increments recruiter tokenVersion (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:317-324).
- vNext now: New terminate action signs canonical user out across memberships (src/components/admin/super-admin-hr-detail-drawer.tsx:375-385).
- Fix: Warn explicitly about other membership sessions before action.

## G2-8-024-044  [P2] GAP  facet F12  effort M
- Legacy: Legacy no-expiry grants allowed (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,177-183).
- vNext now: New 3-month expiry by default, rejects past date (src/modules/placements/super-admin-hr-service.ts:1040-1058).
- Fix: Backfill legacy indefinite grants with an explicit policy choice, never silently expire.

## G2-8-024-049  [P2] GAP  facet F15  effort M
- Legacy: Legacy controller emits AdminAuditLogService entries, not email notification/send directly (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:84-157).
- vNext now: New account management emits activityEvents, no direct email shown on update (src/modules/placements/super-admin-hr-service.ts:997-1016).
- Fix: Verify invite/onboarding and suspension messages in underlying identity service; do not presume email is sent.

## G2-8-024-053  [P2] GAP  facet F18  effort M
- Legacy: Legacy GrantRequest validUntil ISO local datetime description e.g. 2026-12-31T23:59:59 (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,177-183).
- vNext now: New UI label Until (optional) uses date-only and expiry defaults to three months (src/components/admin/super-admin-hr-detail-drawer.tsx:296-302).
- Fix: State end-of-day IST semantics explicitly next to date input.

## G2-8-024-056  [P2] GAP  facet F19  effort M
- Legacy: Legacy companies() returns live company list from directory (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:160-163).
- vNext now: New active relationship options bounded to current scope and sorted name (src/modules/placements/super-admin-hr-service.ts:495-565).
- Fix: Provide search/pagination for platforms with thousands of relationships, avoid silent truncation.

## G2-8-024-057  [P2] GAP  facet F20  effort M
- Legacy: Legacy grant revoked row retained and re-grant may reactivate it (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:19-31; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:330-361).
- vNext now: New grants onConflictDoNothing + validUntil extension behavior (src/modules/placements/super-admin-hr-service.ts:810-835).
- Fix: Confirm revoked same relationship can be reactivated without creating invisible duplicates.

## G2-8-024-060  [P2] GAP  facet F21  effort M
- Legacy: Legacy domain-based company resolver and RecruiterAuthService control onboarding (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:48-54,535-544).
- vNext now: New canonical identity/placement company service and relation links (src/modules/placements/super-admin-hr-service.ts:647-684).
- Fix: Audit DNS/domain lookup guarantees and invitation side effects before final migration.

## G2-8-024-061  [P2] GAP  facet F21  effort M
- Legacy: Legacy AdminAuditLogService logs 9 recruiter action types (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:84-157).
- vNext now: New activity events Recruiter Created/Updated/Suspended/Granted/Session events (src/modules/placements/super-admin-hr-service.ts:836-846,997-1016,1027-1031).
- Fix: Map all legacy recruiter audit names, including revoke/delete/reactivate.
