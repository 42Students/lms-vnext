# Work packet (wave 2): edit src/app/(authenticated)/dashboard/page.tsx (part 2 of 2)

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-9-035-081  [P2] GAP  facet F03  effort S
- Legacy: Scoped greeting labels Selected college operations and Super Admin scoped view `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:84-87`
- vNext now: PageHeader Overview and scope description `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Recreate two-line greeting block.

## G2-9-035-082  [P2] MISSING  facet F03  effort S
- Legacy: Old bottom two utility buttons Back to tenant setup and Platform activity `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:91-94`
- vNext now: vNext ends at quick actions and has no buttons `src/app/(authenticated)/dashboard/page.tsx:154-165`
- Fix: Render buttons after quick actions with mapped links.

## G2-9-035-113  [P2] MISSING  facet F18  effort S
- Legacy: Old scoped secondary action 'Back to tenant setup' `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:91-94`
- vNext now: New no button with that label `src/app/(authenticated)/dashboard/page.tsx:154-165`
- Fix: Add exact bottom CTA.

## G2-9-035-114  [P2] MISSING  facet F18  effort S
- Legacy: Old scoped secondary action 'Platform activity' `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:91-94`
- vNext now: New no button with that label `src/app/(authenticated)/dashboard/page.tsx:154-165`
- Fix: Add exact bottom CTA.

## G2-9-035-083  [P3] GAP  facet F03  effort S
- Legacy: Legacy scope tip uses ApartmentOutlined icon `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:74-77`
- vNext now: New no scope-tip icon, disclosure labelled Safety scope `src/app/(authenticated)/dashboard/page.tsx:156-163`
- Fix: Restore apartment icon next to selected-college hint.
