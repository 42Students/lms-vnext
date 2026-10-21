# Work packet (wave 2): edit src/components/placements/super-admin-platform-placement-policy.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-10-017-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:267-385 — Policy Card full 2-column grid before attention, visible by default.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:73-85; src/components/placements/super-admin-platform-placement-policy.tsx:62-81 — Policy Disclosure collapsed below operations, platform-wide fields.
- Fix: Place visible legacy policy block with correct scope.

## G2-10-017-067  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:267-385 — Two-column policy settings with Ant Row gutter24.
- vNext now: src/components/placements/super-admin-platform-placement-policy.tsx:62-81 — Grid sm2 with different placement and collapsed by default.
- Fix: Align policy grid + default expanded state.

## G2-17-030-005  [P2] GAP  facet F02  effort M
- Legacy: Policy Ant Card size small, 2 cols, help text, needs-attention rules inline; DrivesLanding.js:266-386
- vNext now: Admin policy Disclosure separate below overview and custom editor grid; admin/placements/page.tsx:80-85; super-admin-platform-placement-policy.tsx:49-81
- Fix: Match Ant compact card margins/gutters and global policy placement before attention.

## G2-17-030-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy global policies 9 settings arranged 2-column with min/max, suffix; DrivesLanding.js:270-385
- vNext now: Generic typed policy fields/Reset to default in Disclosure; super-admin-platform-placement-policy.tsx:49-80
- Fix: Match labels/default/help/suffix and input bounds field-by-field, retain new reset in overflow.
