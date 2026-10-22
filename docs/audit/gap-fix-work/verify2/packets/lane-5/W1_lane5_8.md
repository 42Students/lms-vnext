# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-004-035 [P1] GAP facet F09
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:700-724: Popconfirm is anchored to Save override and revalidates submission gate on opening.
- Expected fix: Re-fetch submission state immediately before confirm; show changed gate and abort stale action if needed.

## G2-7-007-014 [P1] GAP facet F05
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:63-85: four columns Resource, Action, Actor, When.
- Expected fix: Restore exact four-column semantic audit table.

## G2-7-009-024 [P1] GAP facet F20
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:20-25: exact `...rest` query object propagated (all unknown non-workspaceId keys).
- Expected fix: Accept searchParams promise, whitelist and encode all supported parameters; preserve page context.

## G2-7-011-046 [P1] GAP facet F11
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:14-117: assigned college admin can edit overview while workspace exists.
- Expected fix: Confirm legacy archived/completed edit policy; if allowed, replicate scoped edit rules or record intentional lock.

## G2-7-013-040 [P1] GAP facet F10
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/modules/projects/resource-service.ts
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:52-60: PUT /api/v1/admin/projects/:slug?collegeId, only resources + resourcesToken
- Expected fix: Define batched/atomic equivalent or partial-save reconciliation contract

## G2-7-013-047 [P1] GAP facet F12
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144-168: field `isPinned` and `isRequired` booleans
- Expected fix: Explicitly convert old keys in imports and seeded DTOs

## G2-7-014-074 [P1] GAP facet F22
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/dto/projects/ProjectSprintDTO.java:8-44 released-linked data, metrics and original key/label fields
- Expected fix: Expose all legacy visible fields/metrics in projection even if normalized

## G2-7-015-068 [P1] GAP facet F17
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61 warns on tab/Back/beforeunload
- Expected fix: Implement keyboard/click/tab dirty guard

## G2-7-016-071 [P1] GAP facet F23
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:108-165 separate submissions table
- Expected fix: Restore consolidated submitted work table

## G2-7-017-058 [P1] GAP facet F13
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:78-85 No primary mentor assigned warning
- Expected fix: Make warning visible to admin team manager

## G2-7-018-064 [P1] GAP facet F20
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:81-100 restore response may indicate BLOCKED mentorless
- Expected fix: Decide mentorless recovery state transition explicitly

## G2-7-034-004 [P1] GAP facet F01
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: templates/[templateId]/index.js:15-16 accepts numeric/slug template IDs
- Expected fix: Resolve numeric legacy IDs and slugs safely to UUID

## G2-8-021-019 [P1] GAP facet F06
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy optional free-form dropClassReason from DTO (docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/AttendanceDTO.java:21-22).
- Expected fix: Add optional admin correction reason/note with clear length rule and persistence.

## G2-8-019-032 [P1] GAP facet F12
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-77 synthetic APPLIED status with appliedAt/statusUpdatedAt
- Expected fix: Reconstruct baseline from historic application with timestamp.

## G2-15-026-037 [P1] GAP facet F11
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/app/(authenticated)/admin/placements/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:83-108 global/org/scoped Super Admin resolves org, not college
- Expected fix: Support org-scoped aggregate read for global Super Admin without unsafe mutations

## G2-18-022-021 [P1] GAP facet F08
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:179-184 partial release Modal 'N released, M not released'
- Expected fix: Implement bulk verification partial failures and detailed reasons

## G2-18-022-027 [P1] GAP facet F10
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:82-104 bulk-verify releases all eligible, returns released and failed
- Expected fix: Make bulk verification per-offer isolated with results, not all-or-nothing

## G2-18-022-028 [P1] GAP facet F10
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:106-128 external acceptance/withdraw/joining/reverse offer
- Expected fix: Map external acceptance 48h disputed, joining status variants and reversal distinctly

## G2-18-022-040 [P1] GAP facet F15
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:223-226 external acceptance sends student 48h dispute notice
- Expected fix: Send explicit dispute-window alert to learner and schedule finalization safely

## G2-18-022-048 [P1] GAP facet F20
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:88-104 per-offer failure isolation for bulk release
- Expected fix: Run verification in isolated transactions per offer and return all failures

## G2-8-026-021 [P1] GAP facet F06
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy Company name asked only after code, maxLength200, required whitespace rule (docs/legacy-source/frontend/src/pages/college-join/[token].js:137-141).
- Expected fix: Require unknown company name at form and server; focus input on empty submit.

## G2-8-024-011 [P1] GAP facet F04
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/app/(authenticated)/admin/hr/page.tsx
- Legacy: Old grant validUntil accepts nullable ISO local date-time and capabilities array (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:56-61,136-146).
- Expected fix: Preserve explicit indefinite grants or document new expiry/verification rule and migration.

## G2-8-023-054 [P1] GAP facet F15
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy added on behalf enqueues APPLIED_ON_BEHALF and allows 48h opt-out (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:121-133).
- Expected fix: Restore exact opt-out due time and candidate-facing explanation.

## G2-8-022-060 [P1] GAP facet F22
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy registration_open, deadline, blocked_dates JSON, is_current columns (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:49-61).
- Expected fix: Implement individual field parity/migration rules for all four missing properties.

## G2-9-007-030 [P1] MISSING facet F06
- Verification: DEFERRED — complete comparison of legacy behavior, permissions and mutation effects requires deeper code-path verification; no parity claim made.
- Files: src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/AllocateModal.jsx:91-115` — Allocation Roll numbers or Whole section, multiline input, optional note max500
- Expected fix: Add whole-section and note submission contract
