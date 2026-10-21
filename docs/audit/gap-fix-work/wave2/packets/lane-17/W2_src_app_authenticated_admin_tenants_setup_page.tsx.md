# Work packet (wave 2): edit src/app/(authenticated)/admin/tenants/setup/page.tsx

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:39-62 — Default tab is structure globally, identity if college scoped.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:46-48 — Separate /setup route resolves selected tab, directory landing unchanged.
- Fix: Preserve default tab at landing and query semantics

## G2-10-023-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:64-76 — Tabs persist ?tab=structure or ?tab=identity shallowly.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:97-101 — Query uses uppercase STRUCTURE/LAUNCH on different path.
- Fix: Accept legacy lowercase query aliases and preserve URL

## G2-10-023-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:95-106 — AdminControlOverview eyebrow Tenant lifecycle, headline, 3 metrics.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:83-96 — Three flat stats; headline description moved into PageHeader.
- Fix: Restore Overview card and pill

## G2-10-023-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:107-121 — Tabs with 16px padded panels and introductory text.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:97-114 — Tabs outside any Card and section headers distinct.
- Fix: Wrap two panels in original Card and match intro spacing

## G2-10-023-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:95-105 — Badge Platform view/Organization-scoped/College: name.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:83-95 — 'College setup' stat name only, scope badge absent.
- Fix: Render original scope badge

## G2-10-023-012  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:123-133 — Scoped warning headline 'You're working inside one college, so creating is turned off'.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:106-112 — Generic Organization creation not permitted warning.
- Fix: Use exact college-v-org warning copy

## G2-10-023-013  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:169-180 — Selected-college blue tag 'Working on: Name'; unselected info Alert 'Pick a college first'.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:175-177 — EmptyState no selected and different explanatory prose.
- Fix: Restore tag and info alert

## G2-10-023-014  [P2] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:155-167 — Identity intro explains Tenant Settings handles platform domains/OTP/SMS.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:135-145 — Header/checklist lacks crosslink/help details.
- Fix: Restore intro explanation and link to Tenant Settings

## G2-10-023-019  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:101-105 — Metrics Current step, Creation Available/Locked, College setup Available/Select.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:83-95 — Creation uses organization count; College setup uses name.
- Fix: Compute exact availability metrics and hints

## G2-10-023-047  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:683-761 — Edit College modal with address fields.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:115-134 — Navigation to college detail instead.
- Fix: Embed edit modal at legacy table

## G2-10-023-048  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:107-205 — Tabs change panels without full route.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:97-102 — Link-based tab navigation reloads server page.
- Fix: Keep tab state/focus and shallow query update

## G2-10-023-049  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:100-112 — Removing web address opens confirmation.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — No in-page address removal.
- Fix: Restore Remove confirmation

## G2-10-023-050  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:34-62 — GET organizations on mount; create/update/delete via AdminService.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:51-58; src/components/admin/organization-create-form.tsx:23-58 — Server organizations list, separate organization mutation routes.
- Fix: Document new routes, preserve independent refresh and CRUD paths

## G2-10-023-054  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ReadinessGate.js:149-190 — Readiness fetch for fixed college, link actions scrolling to cards.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:59-65,144-174 — Server readiness summary and deep links to separate workspaces.
- Fix: Keep drilldowns and in-page scroll to exact card

## G2-10-023-057  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:169-199 — Identity only exposes domain/signin for selected college; branding picker when none.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:175-177 — No-college empty state only.
- Fix: Permit branding college picker when unscoped (if authorized)

## G2-10-023-059  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:40-62 — User-picked tab overrides automatic scope default after interaction.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:46-48 — Default derives tab at each navigation request.
- Fix: Preserve explicit tab choice through scope change

## G2-10-023-064  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:174-181 — Without college, identity shows 'Pick a college first' info Alert.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:175-177 — EmptyState 'No college selected' and link.
- Fix: Restore source info notice

## G2-10-023-065  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ReadinessGate.js:202-258 — Readiness shows loading, retry, blockers and warnings.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:59-73,144-174 — Server page fail state all-or-nothing; summary and links.
- Fix: Restore readiness loading and per-section Retry

## G2-10-023-066  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:188-195 — Organization list refresh warning may retain stale loaded rows.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:66-73 — Entire setup becomes unavailable.
- Fix: Use last verified same-scope list as fallback

## G2-10-023-075  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:134-146 — Structure stacked xs24 full-width panels at all widths.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:103-134 — min992 two-column create and list grids.
- Fix: Use full-width serial panels

## G2-10-023-076  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:183-200 — Launch readiness full, cards half only xxl, full below.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:147-158 — 3 shortcut cards at md grid.
- Fix: Match breakpoint xxl half and section stacking

## G2-10-023-077  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:107-108 — Ant Tabs horizontally scroll with panel padding16.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:97-101 — Shared Tabs renderPanel false, section content no original Card.
- Fix: Clone tab density and panel inset

## G2-10-023-078  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:107-108 — Ant Tabs keyboard-selected within page.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:97-101 — Anchor Tabs change URL; keyboard interactions differ.
- Fix: Preserve tablist focus semantics across navigation

## G2-10-023-080  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ReadinessGate.js:81-98 — Readiness action buttons scroll to named sections.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:160-174 — Links open external subpages.
- Fix: Restore accessible jump-to-card targets

## G2-10-023-081  [P2] MISSING  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:141-153 — Subdomain input has aria-label Subdomain.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Link only, no input.
- Fix: Restore labeled input and focusable save/removal

## G2-10-023-083  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:98-98 — Intro title 'Create the customer, then make one college launch-ready'.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:81-82 — Page title Tenant Setup, intro sentence description.
- Fix: Restore original intro headline

## G2-10-023-085  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:155-165 — 'Get this college ready to go live' and Tenant Settings pointer.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:143-159 — College Launch heading and card descriptions differ.
- Fix: Use exact introduction wording

## G2-10-023-086  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:127-130 — Scope warning exact text and create disabled.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:106-112 — Generic permission warning.
- Fix: Match warning for college-v-org contexts

## G2-10-023-097  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:80-125 — Sign-in method backend config saved per college.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Delegated sign-in page/API.
- Fix: Ensure edit has equal role/validation and setting propagation

## G2-10-023-101  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:66-82 — Organization entity mutable/deletable; legacy admin CRUD.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:115-134 — New setup read list and separate mutation forms.
- Fix: Keep legacy create/edit/delete semantics via linked service

## G2-10-023-074  [P3] GAP  facet F15  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:99-112 — Branding save notification toast only.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Branding links to workspace.
- Fix: Restore in-page success and error feedback
