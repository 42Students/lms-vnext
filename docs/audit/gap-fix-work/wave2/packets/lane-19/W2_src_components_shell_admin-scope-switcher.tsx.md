# Work packet (wave 2): edit src/components/shell/admin-scope-switcher.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-2-036-026  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/UserPrincipal.java:141-146 org/college-scoped impersonation state
- vNext now: src/components/shell/admin-scope-switcher.tsx:79-134 searchable scope select
- Fix: Clone old selected scope presentation, dialog keyboard behavior.

## G2-3-032-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:214-270`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:79-126`
- Fix: Legacy college change and organization change handlers separately callable; vNext one select contains All colleges, Organizations, Colleges.

## G2-3-032-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:65-81`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:98-122`
- Fix: Legacy full and names-only org/college selectors; vNext grouped native select with current college/organization combination label.

## G2-3-032-009  [P2] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:48-55`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:79-126`
- Fix: Legacy persistent Tenant lock toggle prevents accidental scope changes; no lock toggle in current AdminScopeSwitcher.

## G2-3-032-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:231-232`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:68-78`
- Fix: Legacy Failed to apply scope. [server detail] toast; vNext Could not change admin scope or Check your connection and retry inline.

## G2-3-032-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:288-296`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:32-38`
- Fix: Legacy filteredColleges only to selected organization; vNext search matches name and org, preserving selected option but not strict org filter.

## G2-3-032-024  [P2] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:48-55`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:79-126`
- Fix: Legacy tenantLocked boolean persisted localStorage; vNext no lock input on scope switcher.

## G2-3-032-042  [P2] MISSING  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:48-55`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:41-78`
- Fix: Tenant lock explicitly blocks switching even for SA with permissions, absent vNext.

## G2-3-032-047  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:58-93`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:127-131`
- Fix: Legacy independently shows org load and college load errors; vNext one scoped selector error after POST, no separate retry for choices failure.

## G2-3-032-056  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:214-270`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:79-129`
- Fix: Legacy status toasts for blocked switching; vNext labeled native select, role alerts, popover keyboard Escape; reconcile SR copy.

## G2-3-032-060  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:183-197`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:68-78`
- Fix: Exact errors Couldn't switch to your saved college. Pick it again from the header. and Failed to load colleges. Please refresh. lost.

## G2-3-032-072  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:48-55`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:79-126`
- Fix: Old persistent tenant lock intentionally not yet represented in vNext header; owner decide whether restore.

## G2-3-032-010  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:214-217`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:124-130`
- Fix: Legacy lock warning Tenant lock is enabled. Unlock to change scope. missing from vNext.

## G2-3-032-011  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:250-250`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:125-126`
- Fix: Legacy Showing all colleges — data may be large. warning toast 3 sec; vNext inline permanent helper.

## G2-3-032-012  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:311-312`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:97-123`
- Fix: Legacy label All Orgs / All Colleges; vNext All colleges, optgroups Organizations/Colleges, search summary.

## G2-3-032-058  [P3] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:311-312`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:97-126`
- Fix: Legacy All Orgs, All Colleges vs vNext All colleges, Organizations, Colleges, Search colleges wording.

## G2-3-032-059  [P3] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:215-216`
- vNext now: `src/components/shell/admin-scope-switcher.tsx:68-78`
- Fix: Legacy exact Tenant lock is enabled. Unlock to change scope. removed.
