# Work packet (wave 3): edit src/app/(authenticated)/admin/faculty/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-6-002-027  [P1] MISSING  facet F05  effort L
- Legacy: Old has right-fixed action column on md with eight actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:802-936`
- vNext now: New row `More faculty actions` disclosure only lifecycle and transfer, edit separate `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Restore per-row audit/profile/OTP/deletion/impersonation alongside edit/suspend/reassign

## G2-6-002-047  [P1] MISSING  facet F09  effort L
- Legacy: Old audit trail modal 800 and Profile modal 860, with row icon buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1517-1539`
- vNext now: New row actions contain edit/lifecycle/transfer and a generic Open details link `src/app/(authenticated)/admin/faculty/page.tsx:36-44` `src/components/admin/admin-scoped-read-page.tsx:245-265`
- Fix: Expose audit/profile modals or parity detail navigation with original triggers

## G2-6-002-049  [P1] MISSING  facet F09  effort L
- Legacy: Old superadmin-only impersonation Popconfirm and `Log in as faculty` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:856-873`
- vNext now: New action block omits impersonation `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Restore permission-guarded support impersonation with distinct audit and return flow, or document security drop

## G2-6-002-054  [P1] MISSING  facet F10  effort L
- Legacy: Old DELETE `/api/v1/faculty/delete/:id` and class schedule transfer POST `docs/legacy-source/frontend/src/api/Services/AdminService.js:254-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:515-529`
- vNext now: New transfer POST `/api/admin/faculty/schedules/reassign`, but no delete action `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx:32-45` `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Implement blocked-if-assigned safe deletion with audit logs; retain transfer API

## G2-6-002-055  [P1] MISSING  facet F10  effort L
- Legacy: Old impersonation swaps access+refresh tokens and navigates into faculty dashboard `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:543-560`
- vNext now: New superadmin row has no impersonation action `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Provide audit-logged, non-cross-tenant safe impersonation or record deliberate exclusion

## G2-6-002-092  [P1] MISSING  facet F23  effort L
- Legacy: Old supports superadmin impersonation and direct faculty deletion `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:543-560` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:915-935`
- vNext now: New omits both from row action set `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Record formal product decision for each drop, or implement safe audited equivalents

## G2-6-003-047  [P1] MISSING  facet F21  effort L
- Legacy: Old Faculty child can call impersonateUser, OTP lockout clear `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:543-571`
- vNext now: New page More actions lacks those imports `src/app/(authenticated)/admin/faculty/page.tsx:36-43`
- Fix: Expose audited support tools or record deliberate security exclusions

## G2-15-027-006  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:540-566 legacy impersonation and clear-OTP-lockout row tools superadmin-only
- vNext now: src/app/(authenticated)/admin/faculty/page.tsx:36-43 edit,lifecycle,schedule-reassignment actions only
- Fix: Document approved impersonation/lockout policy and add permitted tools or explicit retirement decision.
