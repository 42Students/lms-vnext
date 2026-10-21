# Work packet (wave 2): edit src/app/(authenticated)/admin/settings/page.tsx

33 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-5/l17-u029-tenant-settings.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-022-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/settings.js:6-19 — /superadmin/settings global entry via PageShell and SuperAdmin scope.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:30-47,82-89 — /admin/settings with inventory filter parsing and header CTA.
- Fix: Match legacy PageShell header and place extra auth checklist separately

## G2-10-022-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:940-951 — AdminControlOverview title, scope badge, three metrics.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:91-99 — Flat metrics stripe and prose, no colored pill.
- Fix: Clone overview card and scope badge

## G2-10-022-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:940-970 — Overview followed by blue info Alert about noninheritance.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:91-115 — Scope prose, not equivalent blue Alert.
- Fix: Restore exact info banner

## G2-10-022-012  [P2] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:952-969 — 'Each setting applies at one level only' with InfoCircle icon.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:100-115 — No exact title/icon.
- Fix: Add exact alert header, icon and explanation

## G2-10-022-014  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:982-989 — Scope warning 'Clear the college in the header to edit platform-wide settings'.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:119-124 — Generic warning under editor.
- Fix: Show specific warning title and danger copy

## G2-10-022-023  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:946-950 — Overview documented controls count per selected scope.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:78-98 — Counts all inventory items independent of scope.
- Fix: Make count use active editorScope

## G2-10-022-058  [P2] GAP  facet F11  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1048-1053 — COLLEGE unselected gives explicit warning.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:64-71 — Editor inferred from context, no unselected option.
- Fix: Show scoped selector warning

## G2-10-022-065  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:526-549 — Independent loading/error/Retry for scope editor.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:52-61 — Entire inventory unavailable screen if one read fails.
- Fix: Separate editor and inventory failure regions

## G2-10-022-066  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1048-1054 — Unselected ORG/COLLEGE Alert asks choose scope.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71 — Only global/college inferred.
- Fix: Add exact empty state for unselected selector

## G2-10-022-078  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1006-1013 — Scope native Ant Select keyboard and announces options.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71 — No in-page selector.
- Fix: Add keyboard-accessible scope selector

## G2-10-022-083  [P2] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:956-956 — Info title 'Each setting applies at one level only'.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:100-115 — No matching title.
- Fix: Use exact info title

## G2-10-022-087  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:986-987 — Exact global scope lockout warning.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:120-124 — New generic 'Clear the Super Admin safety scope...' text.
- Fix: Restore original warning copy

## G2-10-022-092  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:497-557 — loadSeq/ref blocks response from previous scope.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:117-119 — Editor keyed by scope, server selected scope; no draft warning.
- Fix: Reset dirty draft and announce scope change

## G2-17-029-001  [P2] GAP  facet F01  effort M
- Legacy: legacy pages/superadmin/settings.js:9-20 is /superadmin/settings within SuperAdminLayout/PageShell 'Tenant Settings'
- vNext now: vNext src/app/(authenticated)/admin/settings/page.tsx:30-40,82-89 /admin/settings and PageHeader with auth checklist
- Fix: Map legacy settings sidebar and /superadmin/settings deep links; audit extra checklist action alignment

## G2-17-029-002  [P2] GAP  facet F01  effort M
- Legacy: legacy TenantSettings.js:416-443 allows local GLOBAL, ORG, COLLEGE scope choice; app scoped IDs from superadmin context
- vNext now: vNext admin/settings/page.tsx:62-71 infers only GLOBAL/COLLEGE from adminScope with no on-page selector
- Fix: Preserve global vs college switch/reachability through header scope; ORG readonly cleanup needs alternate safe route or explicit waiver

## G2-17-029-003  [P2] GAP  facet F02  effort M
- Legacy: legacy TenantSettings.js:938-951 AdminControlOverview uses card eyebrow,title,summary, three metric blocks
- vNext now: vNext admin/settings/page.tsx:91-99 custom border-bottom overview and metric grid
- Fix: Match legacy card border/radius, internal spacing, metrics alignment and value/hint hierarchy

## G2-17-029-004  [P2] GAP  facet F02  effort L
- Legacy: legacy TenantSettings.js:1003-1046 one scope toolbar card before editable grouped cards and Other stored keys table
- vNext now: vNext admin/settings/page.tsx:117-145 editor then attendance controls then filter form and inventory tables
- Fix: Restore toolbar/sections ordering and canvas/section hierarchy, segregate inventory if additive

## G2-17-029-006  [P2] GAP  facet F03  effort S
- Legacy: legacy TenantSettings.js:947-950 metrics 'Documented controls','Stored keys','Editing' and scope tag
- vNext now: vNext admin/settings/page.tsx:94-97 adds text suffix 'visible inventory settings', Editing shows scope label
- Fix: Match exact three metric values/labels including editing Available/Select scope/Disabled

## G2-17-029-044  [P2] GAP  facet F13  effort M
- Legacy: legacy TenantSettings.js:519-552 scope unavailable clears form, loading card skeleton, error retry
- vNext now: vNext admin/settings/page.tsx:43-61 and tenant-settings-editor.tsx:65 pending migration, ErrorState
- Fix: Match scope-not-ready banner, loading placeholder and backend error message at relevant section

## G2-17-029-051  [P2] GAP  facet F18  effort S
- Legacy: legacy TenantSettings.js:940-960 eyebrow Runtime configuration, title Settings with explicit execution scope, info `Each setting applies at one level only`
- vNext now: vNext admin/settings/page.tsx:84-114 repeats some text but drops info alert and has different header description
- Fix: Restore exact help/info alert and explanatory sentence, preserve semantic content

## G2-17-029-052  [P2] GAP  facet F18  effort S
- Legacy: legacy TenantSettings.js:972-999 ORG warning and global scope lock warning exact copy, error title
- vNext now: vNext admin/settings/page.tsx:120-124 says clear scope but ORG cleanup warning absent
- Fix: Restore scope locked message with warning treatment, add ORG cleanup warning if functionality remains

## G2-2-024-004  [P2] GAP  facet F02  effort M
- Legacy: SmsDeliveryLog.java:28-55 purpose,suffix,status,providerMessageId,errorSummary,collegeId,createdAt
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:198-210 shows SMS template purpose/definition, not send outcome
- Fix: Render real attempt fields with sortable timestamp and linked provider reference.

## G2-2-024-005  [P2] MISSING  facet F03  effort M
- Legacy: AdminSmsLogController.java:54-57 recipientSuffix and purpose optional filters
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:198-210 no recipient suffix search
- Fix: Add suffix input (last four digits) and purpose filter.

## G2-2-024-011  [P2] MISSING  facet F05  effort M
- Legacy: SmsDeliveryLogRepository.java:18-24 exact purpose equality filter
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:198-210 SMS template list, not searchable attempt history
- Fix: Filter by purpose key with clear-all option.

## G2-2-024-028  [P2] MISSING  facet F13  effort M
- Legacy: AdminSmsLogController.java:74-83 empty result content[] with totals
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:198-210 source templates shown regardless of provider logs
- Fix: Add honest No SMS attempts found empty state.

## G2-2-024-036  [P2] MISSING  facet F17  effort M
- Legacy: AdminSmsLogController.java:54-57 suffix search accessibility not specified backend
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:198-210 table caption SMS source templates
- Fix: Provide labelled suffix/purpose inputs and status announcements.

## G2-17-029-064  [P2] GAP  facet F23  effort M
- Legacy: Legacy unused ORG rows inspect/delete. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:972-989`
- vNext now: vNext omits ORG by design. `src/app/(authenticated)/admin/settings/page.tsx:64-72`
- Fix: Provide cleanup of deprecated ORG values.

## G2-5-024-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/api/v1/superadmin/tenant` houses domains, onboarding, subdomain, branding and settings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:40-47`, `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:3-22`
- vNext now: vNext splits into college setup pages, settings inventory and `/api/tenant-domains` routes. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-43`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:17-63`, `src/app/(authenticated)/admin/settings/page.tsx:30-89`
- Fix: Provide precise navigation/route compatibility map.

## G2-5-024-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy settings controls specify key labels, group descriptions, input placeholders and help. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:73-145`
- vNext now: vNext inventory shows runtime configuration, counters, editor scope and banners. `src/app/(authenticated)/admin/settings/page.tsx:83-124`
- Fix: Audit each key's exact label/helper/placeholder and disposition.

## G2-5-024-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy settings grid can inspect ORG keys and metadata. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:45-68`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:695-763`
- vNext now: vNext editorData null under org-scope, shows unselected warning instead of org keys. `src/app/(authenticated)/admin/settings/page.tsx:63-71`
- Fix: Distinct ORG unsupported state and allow authorized org inventory.

## G2-5-024-054  [P2] GAP  facet F18  effort M
- Legacy: Legacy settings wording emphasizes each key has an exact effective scope; org has no active reader. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:45-68`
- vNext now: vNext headings `Tenant Settings`, `Runtime configuration`, `Stored keys` plus counts. `src/app/(authenticated)/admin/settings/page.tsx:84-113`
- Fix: Reconcile original help/labels with new inventory purpose.

## G2-9-036-096  [P2] GAP  facet F01  effort M
- Legacy: Legacy distinct Tenant Settings screen for general app_setting `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:45-68`
- vNext now: vNext /admin/settings uses platformSettingOverrides typed values `src/app/(authenticated)/admin/settings/page.tsx:1-65`
- Fix: Keep settings visually separate from module toggles and preserve its scope warning.

## G2-10-022-011  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:941-951 — Eyebrow Runtime configuration, colored scope tag.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:91-98 — Eyebrow rendered plain text with different type hierarchy.
- Fix: Use original eyebrow font and badge
