# Work packet: edit src/modules/platform-settings/admin-editor-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-14/u021-app-setting.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-022-026  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1006-1013 — Three scope modes incl ORG unused label.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71; src/modules/platform-settings/admin-editor-service.ts:16-17 — Two-mode editing only.
- Fix: Show ORG unused option with read-only cleaning

## G2-10-022-035  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:920-933 — Per-field required/range validators in Form.Item.
- vNext now: src/modules/platform-settings/admin-editor-service.ts:23-52; src/components/admin/tenant-settings-editor.tsx:73-87 — Server rejects invalid setting, no inline form error.
- Fix: Add per-key inline validation before submit

## G2-10-022-097  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:45-76 — Auth host, cookie and OTP reads exact GLOBAL config.
- vNext now: src/modules/platform-settings/admin-editor-service.ts:23-52 — Override persists but deployment-managed auth/SMS may ignore runtime edit.
- Fix: Label live vs deployment-only effects per key

## G2-17-029-017  [P1] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:273-365 placement overlap, duration, apply rate, stale, closing, conversion threshold/cap
- vNext now: vNext admin-editor-service.ts:97-128 validates placement overrides including duration pair; legacy-setting-specs.ts:168-267
- Fix: Provide per-key activation status and preserve low conversion decimal formatting and min/max cross-field messages

## G2-17-029-034  [P1] GAP  facet F10  effort L
- Legacy: legacy TenantAdminController.java:637-762 GET/PUT/DELETE GLOBAL/ORG/COLLEGE app_setting persisted directly
- vNext now: vNext admin-editor-service.ts:69-78,82-154 stores platform_setting_overrides only GLOBAL/COLLEGE
- Fix: Validate all runtime readers consult new override table; document intentional ORG exclusion and no-effect keys

## G2-14-021-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy setting rows support GLOBAL ORGANIZATION COLLEGE DEPARTMENT PROGRAM BATCH CLASS LEARNER scopes `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:14-18`
- vNext now: New tenant editor supports only GLOBAL COLLEGE `src/db/schema/platform-setting-overrides.ts:5-16` `src/modules/platform-settings/admin-editor-service.ts:14-17`
- Fix: Preserve old fine-grained module setting resolution in dedicated policy store

## G2-14-021-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy module access evaluator resolves learner to global chain `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:59-61` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:174-207`
- vNext now: New override editor only lists GLOBAL/COLLEGE `src/modules/platform-settings/admin-editor-service.ts:53-78`
- Fix: Define replacement for 8-level learner entitlements and nav

## G2-14-021-006  [P1] GAP  facet F03  effort L
- Legacy: Legacy exposes module locked/enabled decisions at every applicable scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:344-390`
- vNext now: New tenant editor restricts scopes, no equivalent nested lock UI here `src/modules/platform-settings/admin-editor-service.ts:14-17`
- Fix: Preserve locked parent overrides and reason text in UI

## G2-14-021-011  [P1] GAP  facet F05  effort L
- Legacy: Legacy bulk scope-type grouped read supports many learner overrides `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:186-213`
- vNext now: New reader lists one GLOBAL/COLLEGE selected scope only `src/modules/platform-settings/admin-editor-service.ts:69-78`
- Fix: Restore batched learner/class/batch module override listing

## G2-14-021-027  [P1] GAP  facet F11  effort L
- Legacy: Legacy settings resolution applies learner to global ancestors `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:174-207` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:380-390`
- vNext now: New editor scope GLOBAL/COLLEGE requires superadmin/adminScope `src/modules/platform-settings/admin-editor-service.ts:53-68`
- Fix: Preserve authorization and effective policy across all role/learner scopes

## G2-14-021-028  [P1] GAP  facet F11  effort L
- Legacy: Legacy module fail closed on unavailable/conflicting setting `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:311-326` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:349-370`
- vNext now: New storage pending returns ready:false, write throws `src/modules/platform-settings/admin-editor-service.ts:69-89`
- Fix: Ensure every runtime entitlement consumer fails closed, not editor alone

## G2-14-021-030  [P1] GAP  facet F12  effort L
- Legacy: Legacy module decisions follow most specific chain and lock semantics `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:344-390`
- vNext now: New global/college overrides do not express class/student hierarchy `src/modules/platform-settings/admin-editor-service.ts:53-78`
- Fix: Implement matching nearest override and ancestor locked semantics

## G2-14-021-038  [P1] GAP  facet F15  effort L
- Legacy: Legacy module keys control availability for users `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:380-390`
- vNext now: New editor explicitly says activation depends on consumer `src/modules/platform-settings/admin-editor-service.ts:149-150`
- Fix: Wire settings to runtime module gates and warn if unconsumed

## G2-14-021-049  [P1] GAP  facet F21  effort L
- Legacy: Legacy settings consumed by modules, auth cookies, OTP, interview policy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:45-89`
- vNext now: New overrides list/store does not automatically activate operational readers `src/modules/platform-settings/admin-editor-service.ts:149-150`
- Fix: Audit consumers of each key and integrate safe configuration activation

## G2-5-024-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy supports GLOBAL, ORG, COLLEGE settings read, PUT and per-key delete. `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:36-52`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:695-763`
- vNext now: vNext editor only GLOBAL/COLLEGE scopes. `src/app/api/admin/settings/overrides/route.ts:8-16`, `src/modules/platform-settings/admin-editor-service.ts:16-17`
- Fix: Restore ORG settings reader/editor or record approved removal.

## G2-5-024-034  [P1] GAP  facet F10  effort M
- Legacy: Legacy bulk map update transactional for all keys, returns full scope map. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:637-763`
- vNext now: vNext saves each key independently and returns saved/failed counts. `src/modules/platform-settings/admin-editor-service.ts:80-155`
- Fix: Explain partial commit and offer all-or-nothing alternative if required.

## G2-5-024-039  [P1] GAP  facet F11  effort M
- Legacy: Legacy organization-scoped superadmin can manage org settings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:696-706`
- vNext now: vNext editor scopes omit ORG entirely. `src/modules/platform-settings/admin-editor-service.ts:16-17,53-68`
- Fix: Introduce explicit org-scope key reader/writer or owner-approved deprecation.

## G2-5-024-064  [P1] GAP  facet F22  effort M
- Legacy: Legacy app_setting accepts multiple named scopes including ORG/DEPARTMENT/PROGRAM/BATCH. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-24`
- vNext now: vNext platform setting override editor supports GLOBAL/COLLEGE only. `src/modules/platform-settings/admin-editor-service.ts:14-17,53-68`
- Fix: Inventory actual readers and migrate supported scopes intentionally.

## G2-9-036-137  [P1] GAP  facet F22  effort L
- Legacy: Legacy app_setting also stores nonmodule runtime values like OTP, SMS, course progress `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:73-235`
- vNext now: New platformSettingOverrides stores varchar4096 value and typed key registry `src/db/schema/platform-setting-overrides.ts:5-17`; `src/modules/platform-settings/admin-editor-service.ts:89-99`
- Fix: Audit/migrate other settings by owning consumer, never fake them as module rules.

## G2-17-029-025  [P2] GAP  facet F07  effort M
- Legacy: legacy TenantSettings.js:920-931 shows `Must be between X and Y` on validation
- vNext now: vNext tenant-settings-editor.tsx:85-86 shows range, admin-editor-service.ts:23-35 rejects invalid with INVALID_SETTING receipt
- Fix: Add inline field validation and equivalent exact min/max error text before network request
