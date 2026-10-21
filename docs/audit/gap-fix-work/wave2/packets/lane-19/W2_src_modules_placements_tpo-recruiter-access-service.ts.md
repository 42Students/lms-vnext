# Work packet (wave 2): edit src/modules/placements/tpo-recruiter-access-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-15-022-001  [P2] GAP  facet F01  effort S
- Legacy: TPO settings `Recruiters` tab via `/tpo/settings` and GET `/api/v1/tpo/recruiter-access`; settings.js:57,72,681-690; TpoRecruiterAccessController.java:34,58-59
- vNext now: Dedicated `/tpo/settings/recruiters`, server page + list reader; recruiters/page.tsx:47-111; tpo-recruiter-access-service.ts:35-69
- Fix: Make tab/link placement and breadcrumb consistent with legacy and preserve direct URL entry.

## G2-15-022-009  [P2] MISSING  facet F04  effort M
- Legacy: `joinedVia` maps PUBLIC_LINK/COMPANY_LINK/INVITE; TpoRecruiterAccessController.java:80-82; settings.js:727-728
- vNext now: No joinedVia in scoped select/view; tpo-recruiter-access-service.ts:78-101; tpo-recruiter-access-model.ts:61-81
- Fix: Persist grant source and display `Public link`, `Company link`, `Invitation` badges.

## G2-15-022-012  [P2] GAP  facet F05  effort M
- Legacy: List all college grants; JS filters statuses all/active/soon/ended in memory; settings.js:699-704
- vNext now: SQL status ALL/ACTIVE/REVOKED/ENDING_SOON/ENDED_OR_REMOVED and q; tpo-recruiter-access-service.ts:127-163
- Fix: Use matching segment labels and semantics; keep backend filtering for larger lists.

## G2-15-022-014  [P2] GAP  facet F05  effort S
- Legacy: Legacy table search includes name/company/designation/masked phone; settings.js:719-722
- vNext now: vNext q searches name/company/designation only, max80; tpo-recruiter-access-service.ts:142-147; model.ts:20
- Fix: Support matching masked phone suffix if authorized and desired; keep escaping + throttling.

## G2-15-022-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy table offers `exportName=recruiters` through TpoDataTable; settings.js:719-721
- vNext now: vNext CSV/XLSX links with filtered export cap500; recruiters/page.tsx:227-244; tpo-recruiter-access-service.ts:201-209
- Fix: Confirm old export columns and no truncation; surface explicit cap/continuation for >500.

## G2-15-022-028  [P2] GAP  facet F10  effort M
- Legacy: GET lists grants, POST extend, POST revoke, writes grant and `tpo_audit_log`; TpoRecruiterAccessController.java:58-85,93-111,118-136
- vNext now: List paginated; change transaction logs activityEvents; tpo-recruiter-access-service.ts:35-234; tpo-recruiter-grant-write-service.ts:132-174
- Fix: Produce exact endpoint/side-effect crosswalk including audit entity/action and response shape.

## G2-14-016-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy TPO manage endpoint /api/v1/tpo/recruiter-access `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:33-35` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:58-60`
- vNext now: New separate app access services and own-leave DELETE route `src/modules/placements/tpo-recruiter-access-service.ts:54-82` `src/app/api/placements/recruiter/access/[grantId]/route.ts:10-19`
- Fix: Map old TPO extend/revoke paths to new scoped actions

## G2-14-016-013  [P2] GAP  facet F05  effort S
- Legacy: Legacy grants returned ordered grantedAt asc per recruiter `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterCollegeAccessRepository.java:16-18`
- vNext now: New TPO list paginated ordered via service `src/modules/placements/tpo-recruiter-access-service.ts:168-194`
- Fix: Match historical chronological sort and tiebreaker or document descending change

## G2-14-016-015  [P2] GAP  facet F05  effort S
- Legacy: Legacy activeGrants filters active and existing college `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:45-53`
- vNext now: New history intentionally shows revoked and archived grants `src/modules/placements/tpo-recruiter-access-service.ts:44-53`
- Fix: Separate active-only selector from grant audit history
