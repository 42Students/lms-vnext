# Work packet: edit src/app/(authenticated)/admin/tenants/setup/page.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-007  [P1] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:134-146 — Structure Organization form+list then College form+list stacked full-width.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:103-134 — 2-column desktop create section and separate lists section.
- Fix: Stack organization and college Card screens serially

## G2-10-023-008  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:183-201 — Identity: readiness full width, domain and sign-in half, branding half.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:137-174 — Cards are link-only shortcuts and checklist, not editable panels.
- Fix: Embed readiness, subdomain, sign-in, branding controls in launch tab

## G2-10-023-009  [P1] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:123-133 — Scoped Structure hides all global lists after warning.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:55-64,102-134 — Still fetches scoped organizations on structure tab.
- Fix: Suppress platform tenant listing/actions when non-global scope selected

## G2-10-023-022  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:180-199 — Organizations Table search inline, refresh, pagination page 25 with size.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:115-133 — No full organization table inside setup.
- Fix: Embed searchable organization table

## G2-10-023-031  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:141-156 — Subdomain text placeholder kluniversity, save and remove buttons.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:147-159 — Linked domain workspace, no inline field.
- Fix: Embed subdomain editor in Launch

## G2-10-023-032  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:46-50,145-151 — Radio tiles Sign-in methods (email-phone etc) and Save.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-158 — Link to sign-in page only.
- Fix: Render source radio tile picker inline

## G2-10-023-037  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:188-191; docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:584-590 — Org/college lists have separate inline error Alerts with Retry.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:66-73 — One 'Tenant setup unavailable' screen on any read failure.
- Fix: Isolate Org, College and readiness failures with separate Retry

## G2-10-023-045  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:208-217 — Organization Edit modal; delete Popconfirm.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:115-133 — Only linked organization rows; no modal at this surface.
- Fix: Restore Edit and Delete modal/confirm paths

## G2-10-023-051  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:57-77 — GET colleges and organizations separately, with distinct errors.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:55-73 — Promise path combined in setup; dependent failure blanks workspace.
- Fix: Separate organization/college reads and errors

## G2-10-023-056  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:123-146 — Any active org/college scope hides global lists and creation.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:55-59,102-134 — Structure offers scoped organization creation/list based on can().
- Fix: Hide global structure entirely when scoped

## G2-10-023-067  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:584-590 — Colleges and organizations have separate error banners.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:66-73 — Single Tenant setup unavailable.
- Fix: Split panel error/retry states

## G2-10-023-071  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-236 — Branding logo upload/preview within identity.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Only outbound link.
- Fix: Render branding file controls inline, respect existing signed URL policies

## G2-10-023-096  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:70-110 — Legacy subdomain allot/remove through TenantAdminService and DNS expectations.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Delegated domain workspace.
- Fix: Inspect DNS/wildcard verification work and route service outputs

## G2-10-023-098  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:70-112 — Branding upload uses backend media/storage.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Delegated branding pages; no inline upload.
- Fix: Use existing signed URL workflow in embedded editor

## G2-10-023-102  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — Last-created org local state and current selectedCollegeId context.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:36-50; src/app/(authenticated)/admin/tenants/setup/page.tsx:46-48 — Preferred org URL and server scope; no coupling.
- Fix: Implement transactional next-step state/provenance

## G2-10-023-105  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:93-208 — One integrated workflow.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:53-65; src/app/(authenticated)/admin/tenants/setup/page.tsx:79-179; src/app/(authenticated)/admin/tenants/create/page.tsx:38-59 — New split directory/create/setup stages.
- Fix: Reintegrate stage flow or provide exact in-context parity

## G2-10-023-038  [P2] MISSING  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:127-127 — Domain load error 'Couldn't load the web address'.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Domain editor not mounted, only link.
- Fix: Restore domain-specific error and Retry

## G2-10-023-042  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:70-70 — Domain save success '<subdomain>.<baseDomain> is live'.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Link-out no visible domain save result.
- Fix: Show domain success in page

## G2-10-023-043  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:121-125 — 'Sign-in settings saved' on success.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — No inline save action.
- Fix: Restore sign-in feedback

## G2-10-023-044  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:99-112 — Branding saved / Couldn't save branding.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — No on-page branding feedback.
- Fix: Restore branding toast/error
