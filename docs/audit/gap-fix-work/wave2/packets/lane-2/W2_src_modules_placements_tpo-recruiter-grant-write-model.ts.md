# Work packet (wave 2): edit src/modules/placements/tpo-recruiter-grant-write-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-15-022-002  [P2] GAP  facet F01  effort M
- Legacy: Controller extends `/recruiterId/extend` and revokes `/recruiterId/revoke`; TpoRecruiterAccessController.java:92-95,118-120
- vNext now: Single POST `/api/placements/tpo/settings/recruiter-grants` action union; recruiter-grants/route.ts:7-17; tpo-recruiter-grant-write-model.ts:4-22
- Fix: Provide endpoint mapping in API compatibility notes; ensure callers use UUID grantId not legacy recruiter integer.

## G2-15-022-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy confirmation choices Extend 3/6/12/No end and popconfirm Remove; settings.js:730-736
- vNext now: vNext explicit confirmed:true + optimistic version token; tpo-recruiter-grant-write-model.ts:9-21
- Fix: Retain confirmation copy/actions and verify current vNext controls match, including disabled/pending states.

## G2-14-016-019  [P2] GAP  facet F06  effort S
- Legacy: Legacy extend allows any integer months 1..60 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:100-105`
- vNext now: New restricts to 3,6,12 `src/modules/placements/tpo-recruiter-grant-write-model.ts:10-14`
- Fix: Add custom duration option or document restriction

## G2-14-016-020  [P2] MISSING  facet F06  effort S
- Legacy: Legacy revoke reason optional, trims and bounds to500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:114-134`
- vNext now: New REVOKE schema requires grantId/expectedUpdatedAt, no reason `src/modules/placements/tpo-recruiter-grant-write-model.ts:15-20`
- Fix: Add optional revoke explanation field and length validation

## G2-14-016-029  [P2] GAP  facet F09  effort S
- Legacy: Legacy revoke allows optional reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:114-133`
- vNext now: New confirmation has no reason payload in schema `src/modules/placements/tpo-recruiter-grant-write-model.ts:15-20`
- Fix: Add reason textarea and persist it

## G2-14-016-054  [P2] GAP  facet F18  effort S
- Legacy: Legacy extend error uses exact No end date wording `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:104-108`
- vNext now: New does not support no-end date `src/modules/placements/tpo-recruiter-grant-write-model.ts:10-14`
- Fix: Clarify bounded access in UI copy
