# Work packet (wave 2): edit src/components/admin/super-admin-hr-accounts.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md

## G2-10-021-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:405-417 — Overview title 'Recruiter account lifecycle' with 'Add recruiter' CTA.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:662-677 — PageHeader 'Recruiter accounts', separate lifecycle subheading.
- Fix: Render legacy overview hierarchy and one primary CTA.

## G2-10-021-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-572 — Click name opens in-page right 640px detail Drawer.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:560-562,907-943; src/components/admin/super-admin-hr-detail-drawer.tsx:100-135 — Detail Drawer via 'View' button, name not clickable.
- Fix: Make name a link/button to open 640px drawer and preserve View as optional.

## G2-10-021-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:403-418 — AdminControlOverview eyebrow/description, scope pill, metrics, CTA in unified card.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:662-684 — PageHeader, separate scope strip, lifecycle heading and metrics grid.
- Fix: Align hierarchy, card background, density and metric alignment to original.

## G2-10-021-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:419-429 — Scoped view single Ant info Alert under overview.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:672-673 — Plain border-left status strip with different copy.
- Fix: Use source info banner tone, icon, paddings and message.

## G2-10-021-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:434-471 — Card 'Recruiter accounts', header toolbar Search and Refresh, dense Ant Table.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:685-821 — Filters, status cards at mobile, borderless DataTable, extra page actions.
- Fix: Restore table Card and exact header toolbar layout.

## G2-10-021-011  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:318-323 — Name is clickable link; mobile shown raw; activeCollegeCount numeric.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:585-626 — Name plain, grants list with names and 'N active'.
- Fix: Link names, numeric count alone in table, preserve detail grants in drawer.

## G2-10-021-013  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:329-359 — Inline action buttons Edit, Suspend/Reactivate, Sign out visible.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:560-579 — View plus Actions dropdown hiding mutations.
- Fix: Restore inline button visibility and red suspend state.

## G2-10-021-018  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:399-401 — Active/Suspended/Deleted metrics counted on page rows.
- vNext now: src/app/(authenticated)/admin/hr/page.tsx:122-127; src/components/admin/super-admin-hr-accounts.tsx:682-684 — global status summary separately queried, not current page counts.
- Fix: Render page-local lifecycle metrics with correct labels.

## G2-10-021-023  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:437-452 — Input.Search allowClear width240, search only on Enter/onSearch, clear resets page0.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:685-743 — GET form query q, Apply filters, new Status and page-size controls.
- Fix: Restore toolbar Search on Enter and in-field clear; keep advanced filters below.

## G2-10-021-025  [P2] MISSING  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:438-454 — Refresh inline next to Search.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:685-743 — No visible Refresh next to search; refresh via route/action elsewhere.
- Fix: Add visible refresh control with loading spinner.

## G2-10-021-026  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:458-470 — Table scroll x960 across small widths.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:797-821 — Mobile cards below lg; desktop DataTable.
- Fix: Match table horizontal scroll while retaining optional mobile cards.

## G2-10-021-046  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:344-348 — Suspend confirms account name, dangerous red, signs out everywhere; grants kept.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:954-965 — Quick status confirm same message but account status ARCHIVED.
- Fix: Preserve confirmation red danger variant and lifecycle mapping.

## G2-10-021-048  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:387-392 — Revoke confirms 'Remove <college> from <name>?' and 'Takes effect on their next request. The history is kept.'
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:954-965 — 'Revoke <college> access?', other-grant explanation.
- Fix: Restore person-specific title and next-request effect.

## G2-10-021-055  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:338-358; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:103-129 — Suspend/reactivate/revoke-sessions endpoints.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:500-547; src/modules/placements/super-admin-hr-service.ts:1342-1388 — New mutation through HR endpoints and canonical sessions.
- Fix: Cross-check status transaction and global session invalidation.

## G2-10-021-067  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:97-122 — List loading spinner separate from college options failure.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:745-762 — SSR read ErrorState; no in-table refetch spinner.
- Fix: Add table spinner and independent college options status.

## G2-10-021-070  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:430-433 — List error and options error distinct retry banners.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:745-757; src/components/admin/super-admin-hr-detail-drawer.tsx:312-328 — independent detail/option errors but options not top-level.
- Fix: Render both top-level errors without blanking list.

## G2-10-021-076  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:434-471 — Ant dense table width960 horizontal scroll on mobile.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:797-821 — mobile cards until lg1024, table desktop.
- Fix: Restore legacy x-scroll table at matching breakpoints.

## G2-10-021-077  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:438-454 — 240px Search and Refresh top toolbar wrapped.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:685-742 — Responsive full-page GET filter grid.
- Fix: Place search+refresh inline at desktop; wrap at small widths.

## G2-10-021-080  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:318-319 — Name has Button type=link focusable/keyboard.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:585-595 — Name plain text, View separate button.
- Fix: Make name focusable Link/functional opening action.

## G2-10-021-082  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:353-358 — Disabled Sign out explanatory tooltip when not ACTIVE/outside scope.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:560-579 — Sign out MenuItem disabled outside scope, no active-only check.
- Fix: Disable live-session action for nonactive as source, explain why.

## G2-10-021-101  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:11-21 — Recruiter created via account service and may reuse mobile identity.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:328-365 — New canonical identity collisions and relationship checks.
- Fix: Map reactivation/reuse collision cases to same user-facing flow.

## G2-3-031-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:103-133`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:500-558`
- Fix: Legacy suspend/reactivate/sign-out/delete discrete HTTP commands; vNext PATCH status and terminate-sessions, no equivalent visible hard Delete.

## G2-3-031-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-155`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:459-529`
- Fix: Legacy collegeId grant/revoke endpoints; vNext grant identified by active company–college relationship and revocation by grant UUID.

## G2-3-031-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:403-418`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:663-685`
- Fix: Legacy AdminControlOverview colored scope chip, eyebrow Industry access and metrics; vNext PageHeader and border-separated metric figures.

## G2-3-031-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:434-471`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:685-731`
- Fix: Legacy Recruiter accounts Card contains search/Refresh and Ant Table; vNext FilterBar/search/status fields and DataTable pagination outside Card.

## G2-3-031-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-574`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:760-915`
- Fix: Legacy detail Drawer with nested College access Card; vNext detail pane/dialog layout and separate relationship picker.

## G2-3-031-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:406-408`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:663-676`
- Fix: Exact title Recruiter account lifecycle and Industry access eyebrow replaced by Recruiter accounts header plus lifecycle subsection.

## G2-3-031-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:319-323`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:582-642`
- Fix: Legacy table columns Name/Mobile/Company/Colleges/Status/Actions; vNext combined contact and grant status display, not separate Mobile column.

## G2-3-031-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:335-356`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:560-581`
- Fix: Legacy Suspend, Reactivate and Sign out direct row buttons; vNext Actions dropdown contains those actions.

## G2-3-031-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:366-390`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:780-908`
- Fix: Legacy grant table College/Access/optional expiry/Remove; vNext grant history and relationship-based state controls.

## G2-3-031-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:318-323`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:582-646`
- Fix: Legacy activeCollegeCount numeric summary per row; vNext grants.length summary and college names. Counts can differ for scoped/inactive grants.

## G2-3-031-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:24-25`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:582-642`
- Fix: Legacy firstName + lastName display fallback #id; vNext canonical displayName separate first/last derivation.

## G2-3-031-018  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:22-23`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:630-638`
- Fix: Legacy ACTIVE/SUSPENDED/DELETED tags; vNext ACTIVE/ARCHIVED/DISABLED with Suspended presentation. Explicit status crosswalk.

## G2-3-031-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:457-471`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:685-731`
- Fix: Legacy page size fixed 25; vNext user-selectable pageSize via URL and status dropdown.

## G2-3-031-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:399-415`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:678-685`
- Fix: Legacy metrics Active/Suspended/Deleted on page; vNext Accounts/Active/Suspended/Disabled global scope count.

## G2-3-031-027  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:566-568`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:459-482`
- Fix: Legacy Until (optional) dayjs ends at local endOf day, vNext ISO validUntil input may use calendar parsing. Check IST date boundary.

## G2-3-031-036  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:228-260`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:500-558`
- Fix: Legacy Modal.confirm action for revoke/suspend/sessions includes title and danger; vNext state-driven ConfirmDialog and menu trigger.

## G2-3-031-037  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-574`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:736-990`
- Fix: Legacy Drawer detail opens by linked Name and keeps page visible; vNext detail controls placement/viewport requires pixel clone.

## G2-3-031-039  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:269-294`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:459-495`
- Fix: Legacy grants selected College ID with optional validUntil; vNext relationship-bound grant with verification status and scoped company ownership.

## G2-3-031-040  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:335-356`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:500-558`
- Fix: Legacy suspended recruiter keeps college grants and signs out everywhere; vNext archived/suspended status route must match session revocation.
