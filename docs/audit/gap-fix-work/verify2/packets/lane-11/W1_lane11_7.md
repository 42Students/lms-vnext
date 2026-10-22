# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-031-032 [P1] GAP facet F11
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LBE/controller/ProjectWorkspaceController.java:664-699 learner/member edit API.
- Expected fix: Map mentor/reviewer/learner mutation powers and role transfer rules.

## G2-19-027-096 [P1] GAP facet F22
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LBE/service/impl/CourseServiceImpl.java:168-210 soft delete/restore stores isDeleted boolean.
- Expected fix: Preserve deleted/restored audit lifecycle with timestamp and reversible status transition.

## G2-7-002-047 [P1] GAP facet F12
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:79-99: destructive set marks 11 action types including readiness override and learner roster reassignment.
- Expected fix: Build explicit taxonomy-to-destructive mapping; test counts per action.

## G2-7-004-070 [P1] GAP facet F20
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:321-326,700-720: revalidates live submission state when confirm opens to avoid stale warning.
- Expected fix: Preflight latest readiness before showing/applying override.

## G2-7-007-032 [P1] GAP facet F12
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:31-61: history is ONLY project resource changes, four action kinds.
- Expected fix: Default resource-audit view to resource events only; prevent generic activity leakage.

## G2-7-010-016 [P1] GAP facet F05
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:210-215: meeting editable notes and linked sprint/task keys.
- Expected fix: Enable admin authorized meeting notes/link editing to legacy scope, respecting role rules.

## G2-7-011-077 [P1] GAP facet F23
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:67-111: extra unknown overview facts roundtrip and untouched-save protection.
- Expected fix: Restore extension-key preservation and untouched guard; document any purposeful removal.

## G2-7-013-077 [P1] GAP facet F22
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:147-167: type Link/PDF/DOC/PPT/Video/File; flags isRequired/isPinned
- Expected fix: Create enum+flag conversion and lossless legacy media type metadata

## G2-7-015-012 [P1] GAP facet F03
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:474-500 Change template…, Archive, Delete action buttons
- Expected fix: Add template change and soft delete actions

## G2-7-016-005 [P1] GAP facet F02
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:67-107 no-sprints Alert, inline multirow task editor and Save footer
- Expected fix: Provide bulk editing and one scoped Save with concurrency

## G2-7-017-016 [P1] GAP facet F04
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:61-77 task aggregates assigned, done, review, in progress, latest submittedAt/updatedAt by userId
- Expected fix: Derive per-member status metrics and latest task activity timestamp

## G2-7-018-006 [P1] MISSING facet F02
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:175-207 Card contains Skeleton, failure fallback, deleted table or Empty
- Expected fix: Build page Card and conditionally render states

## G2-7-019-005 [P1] GAP facet F01
- Verification: OK — all three header links are visible.
- Files: src/app/(authenticated)/college/projects/page.tsx
- Legacy: workspaces/index.js:348-350 three direct head actions Create workspace, Bulk reassign mentor, Deleted workspaces
- Expected fix: Restore three visible head actions and dedicated Deleted workspaces link.

## G2-7-035-002 [P1] MISSING facet F01
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: overview.js:445-468 Audit trail link /superadmin/projects/audit?entityId=slug&range=all
- Expected fix: Add scoped Audit trail link with legacy entity filter mapping

## G2-8-021-069 [P1] GAP facet F23
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy soft-deleted row retains dropClassReason, marker and prior timestamps (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:26-44; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37).
- Expected fix: Expose durable per-cell change history for disputed attendances and reason trails.

## G2-11-024-009 [P1] GAP facet F04
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/tpo/settings/recruiters/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:606-613 recruiter approval=true, access months=6, sees=AFTER_REVIEW defaults
- Expected fix: Restore combined policy controls and defaults.

## G2-8-018-094 [P1] GAP facet F23
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/notifications/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:205-225,228-253: merges announcements feed with notifications
- Expected fix: Restore merged role feed with source-typed stable keys.

## G2-8-025-030 [P1] GAP facet F10
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy validates path regex org-N/college-N/lesson-content/* against caller tenants (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:40-41,109-115).
- Expected fix: Enforce private tenant-scoped key ownership invariant at sign boundary.

## G2-8-024-041 [P1] GAP facet F12
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy company resolved from recruiter's email domain; typed name used only for new company (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:535-544).
- Expected fix: Reject company-email domain mismatch and preserve single-company recruiter identity.

## G2-8-022-007 [P1] GAP facet F03
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy can make multiple seasons current; UI season chip identifies latest current (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-40; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:61-80).
- Expected fix: Use nonexclusive season chips/filters if overlapping seasons remain supported.

## G2-9-002-012 [P1] MISSING facet F03
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/college/batch-promotion/page.tsx
- Legacy: Mark graduated visible at max semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:316-335`)
- Expected fix: Expose actionable graduation button.

## G2-9-007-058 [P1] MISSING facet F14
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:133-141` — Roster CSV export with filtered rows and elective-ID filename
- Expected fix: Add CSV with exact column order and filename

## G2-9-015-076 [P1] MISSING facet F15
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:426-460` — Delete UI says affected learners notified and active interviews cancelled.
- Expected fix: Place exact grounded archive retention/interview impact disclosure.

## G2-9-010-056 [P1] GAP facet F12
- Verification: OK — INTERVIEW→SHORTLISTED/ASSESSMENT and HIRED→OFFERED are modeled.
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14` — Legacy state machine includes INTERVIEW to SHORTLISTED, ASSESSMENT and HIRED to OFFERED reversals
- Expected fix: Restore intended reversal transitions with audit/offer guards or document product decision

## G2-9-010-057 [P1] GAP facet F12
- Verification: OK — APPLIED permits only SHORTLISTED/REJECTED.
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:6-8` — Legacy APPLIED only SHORTLISTED/REJECTED; ASSESSMENT after shortlist
- Expected fix: Confirm APPLIED→ASSESSMENT allowance; align with legacy if exact parity required
