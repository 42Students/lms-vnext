# Work packet: edit src/components/admin/tenant-domain-manager.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-19/tenant-domain-entity.md

## G2-5-024-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy stores TXT lastFoundValues and lastCheckResult for diagnosis. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:33-43`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:92-107`
- vNext now: vNext schema has lastCheckResult but no lastFoundValues. `src/db/schema/tenant-domains.ts:15-31`, `src/components/admin/tenant-domain-manager.tsx:20-29`
- Fix: Persist bounded DNS found-value diagnostics, hide sensitive tokens.

## G2-5-024-031  [P1] MISSING  facet F09  effort M
- Legacy: Legacy edit custom host in same domain form as primary toggle. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- vNext now: vNext has set-primary confirmation but no host-edit control. `src/app/api/tenant-domains/[domainId]/route.ts:20-54`, `src/components/admin/tenant-domain-manager.tsx:112-115`
- Fix: Add edit control with confirm and DNS-proof reset.

## G2-5-024-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy TXT names `_42lms-verify.<host>` or host root, accepted bare/42lms-verification token. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:57-89`
- vNext now: vNext `_lms-vnext.<host>`, `lms-vnext-verification=token`. `src/modules/tenant-domains/service.ts:131-136`, `src/components/admin/tenant-domain-manager.tsx:31-37`
- Fix: Plan existing DNS-record transition before switching tenant ownership checks.

## G2-19-015-022  [P2] GAP  facet F08  effort S
- Legacy: Legacy UI could debug raw found TXT content `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:40-43`
- vNext now: vNext manager only displays lastCheckResult and time `src/components/admin/tenant-domain-manager.tsx:20-40`
- Fix: Offer bounded safe DNS troubleshooting text, not a secret dump.

## G2-5-024-028  [P3] GAP  facet F08  effort S
- Legacy: Legacy antd message notifications used for successful/failed setting actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1-38`
- vNext now: vNext uses scoped toast and banner presentation instead of legacy antd. `src/app/(authenticated)/admin/settings/page.tsx:117-124`, `src/components/admin/tenant-domain-manager.tsx:80-105`
- Fix: Compare exact toasts, placement and duration live.
