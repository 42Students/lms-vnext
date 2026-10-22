# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-020-005 [P1] GAP facet F02
- Files: src/components/admin/admin-program-directory.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:270-323 — 24px gutter desktop left span10/right14 with simultaneous visible create/list Cards.
- Expected fix: Clone two-column cards at >=lg with mobile stacking.

## G2-10-020-006 [P1] GAP facet F02
- Files: src/components/admin/admin-program-directory.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:272-289 — Create New Program Card visible unconditionally.
- Expected fix: Keep form expanded by default and visible beside existing table.

## G2-10-020-107 [P1] GAP facet F23
- Files: src/components/admin/admin-program-directory.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:267-342 — Legacy Program form beside list always visible.
- Expected fix: Do not hide creation on populated page.

## G2-10-021-012 [P1] GAP facet F03
- Files: src/components/admin/super-admin-hr-accounts.tsx, src/components/admin/super-admin-hr-types.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:323-323 — Status ACTIVE green, SUSPENDED orange, DELETED red Tag.
- Expected fix: Map status lifecycle accurately, expose DELETED separately from disabled.

## G2-10-021-016 [P1] GAP facet F03
- Files: src/components/admin/super-admin-hr-accounts.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:406-417 — Overview fourth metric 'Deleted on page'.
- Expected fix: Compute deleted-on-current-page separately, do not conflate disabled identity.

## G2-10-021-065 [P1] GAP facet F12
- Files: src/components/admin/super-admin-hr-accounts.tsx, src/components/admin/super-admin-hr-types.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:335-351 — ACTIVE can suspend; SUSPENDED reactivate; DELETED displays Deleted.
- Expected fix: Define DELETED ↔ ARCHIVED/DISABLED mapping and resurrection.

## G2-10-022-034 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/settings/page.tsx, src/components/admin/tenant-settings-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:804-849 — Dirty scope switch/add close prompts discard.
- Expected fix: Guard navigation and modal closure while dirty

## G2-10-022-044 [P1] MISSING facet F08
- Files: src/components/admin/tenant-settings-editor.tsx, src/app/(authenticated)/admin/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:508-512 — Scope switch warns unsaved edits discarded.
- Expected fix: Prompt on header scope changes with dirty draft

## G2-10-022-108 [P1] GAP facet F23
- Files: src/components/admin/tenant-settings-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1057-1084 — Legacy per-key help/default always visible.
- Expected fix: Restore context help before pixel clone approval

## G2-10-023-007 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:134-146 — Structure Organization form+list then College form+list stacked full-width.
- Expected fix: Stack organization and college Card screens serially

## G2-10-024-096 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: src/modules/verification/staff-queue-service.ts:65-68 — 1001 row scan cap then slice/filter before pagination can undercount.
- Expected fix: Use server-side filtered aggregate or mark unknown totals

## G2-11-003-068 [P1] GAP facet F13
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Network failure retains Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:117`
- Expected fix: Recoverable inline warning

## G2-11-002-087 [P1] GAP facet F19
- Files: src/modules/placements/hr-job-read-service.ts
- Legacy: Partial data Promise.allSettled `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:109`
- Expected fix: Isolate auxiliary failures

## G2-11-005-140 [P1] GAP facet F23
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: Retryable list-fetch failure `docs/legacy-source/frontend/src/pages/tpo/announcements.js:98`
- Expected fix: Implement data-error Retry

## G2-11-012-045 [P1] GAP facet F07
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Drives GET failure uses response message or Could not load drives. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:155`
- Expected fix: Render exact PanelError and retry.

## G2-17-029-030 [P1] GAP facet F08
- Files: src/components/admin/tenant-settings-editor.tsx
- Legacy: legacy TenantSettings.js:508-515 scope switch warns discarded unsaved drafts
- Expected fix: Add unsaved-change protection for scope/navigate/reload and pending add draft

## G2-17-029-050 [P1] GAP facet F17
- Files: src/components/admin/tenant-settings-editor.tsx
- Legacy: legacy TenantSettings.js:445-446 useUnsavedFormGuard on settings and add modal
- Expected fix: Add leave/scope/refresh beforeunload warning and alert text equivalent to legacy

## G2-17-029-056 [P1] GAP facet F21
- Files: src/components/admin/tenant-settings-editor.tsx
- Legacy: legacy TenantSettings.js:148-187 references BulkSMSApps DLT templates, cookie/domain runtime readers
- Expected fix: Define deployment propagation for SMS provider Exotel and DLT, login/cookie rollouts; don't promise instant runtime behavior

## G2-12-006-011 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/applications/page.tsx
- Legacy: Staff opt-out timestamp day and time `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:121-121,144-146`
- Expected fix: Expose opt-out deadline and direct action

## G2-12-002-008 [P1] MISSING facet F03
- Files: src/components/admin/admin-scoped-read-page.tsx
- Legacy: Refresh button in selected-semester right card `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:380-384`
- Expected fix: Add selected-semester refresh with stale data handling

## G2-17-23-048 [P1] GAP facet F10 Cascade other applications
- Files: (none, new feature)
- Legacy: JS:1325–1420 locks other active applications; OFFERED→REJECTED, other eligible statuses→WITHDRAWN; may keep dream/uplift cases
- Expected fix: Crosswalk legacy six active statuses and statuses now modeled as SUBMITTED; prove all eligible sibling applications, not just one subset, transition correctly

## G2-17-028-025 [P1] GAP facet F10 Override API
- Files: (none, new feature)
- Legacy: LR:66 navigates only; LC:688-705 separate POST `/api/v1/admin/projects/{id}/readiness/override` with collegeId/override/note
- Expected fix: Keep business intent equivalent through payload/status mapping, reject outside-scope IDs; align parent form behavior

## G2-18-019-036 [P1] GAP facet F15 SMS notification
- Files: (none, new feature)
- Legacy: LC:439-444 `smsService.sendOtp(phoneNumber, otp, LMS)` before save
- Expected fix: Verify SMS provider template/recipient, delivery retries and fallback recipients align required login reliability

## G2-18-030-041 [P1] GAP facet F12 Dependency guard
- Files: (none, new feature)
- Legacy: L:219-223 counts program/course/faculty; L:282-320 disables delete when known positive
- Expected fix: Explain archived children still block even when active count chips show zero; provide count/blocker reason from server

## G2-19-029-065 [P1] MISSING facet F23 Removed warning
- Files: (none, new feature)
- Legacy: Legacy LG:60-71 Logo and academic advisory explained, fix links
- Expected fix: Restore advisory partition and `Fix in Branding`; keep new academic data completeness as separate criterion
