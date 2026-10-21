# Work packet (wave 2): edit src/components/placements/super-admin-needs-attention.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md

## G2-10-017-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:388-458 — Compact capped needs-attention card with four categories.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:14-44 — Section with flat border lists; count/list semantics differ.
- Fix: Align capped card, heading and status/error states.

## G2-10-017-012  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:390-409 — WarningOutlined #ad6800 icon and 'Needs attention (N)' inside small Card.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:20-24 — Plain heading no warning icon; total computed differently.
- Fix: Add icon, card border, legacy count.

## G2-10-017-019  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:410-458 — Category-level count, top3 rows, expand/collapse, item.detail and right chevron.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:26-39 — Top3 rows with job/company and affected count but omits item.detail/context.
- Fix: Render underlying candidate/drive detail and chevron.

## G2-10-017-056  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:390-404 — Attention loading ListSkeleton 3 rows, error Alert Retry, empty green success.
- vNext now: src/components/placements/super-admin-needs-attention.tsx:19-24 — Attention always synchronous with workspace; plain empty text and no local Retry.
- Fix: Rebuild attention skeleton/error/empty tri-state.

## G2-10-017-073  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:390-420 — 'Needs attention (N)' category titles exact labels; zero 'No drives currently flagged in this view.'
- vNext now: src/components/placements/super-admin-needs-attention.tsx:19-32 — Category labels mostly exact, but count/status style differs.
- Fix: Match count and green empty styling.

## G2-17-030-006  [P2] GAP  facet F02  effort S
- Legacy: Needs attention yellow tinted Card with 4px amber left border and shadow #fff1b8; DrivesLanding.js:405-409
- vNext now: vNext neutral border-bottom section, dark text no amber surface; super-admin-needs-attention.tsx:14-19
- Fix: Apply exact old yellow warning card, 4px left border, icon #ad6800 and body spacing.

## G2-17-030-048  [P2] GAP  facet F17  effort S
- Legacy: Attention rows role=button tabIndex0 + Enter/Space; drive card role=button tabIndex0, nested dropdown stopPropagation; DrivesLanding.js:421-434,526-537,565-584
- vNext now: vNext attention semantic Link and portfolio `Open drive` Link; super-admin-needs-attention.tsx:22-26; placement-operations-overview.tsx:103-106
- Fix: Preserve keyboard destination and non-nesting; focus ring/aria on restored card action dropdown.

## G2-17-030-054  [P2] GAP  facet F20  effort M
- Legacy: Legacy attention sampleCount displays truncated if count>items.length; DrivesLanding.js:441-453
- vNext now: vNext attention total row count and +more based on row count; super-admin-needs-attention.tsx:12-42
- Fix: Carry backend total count and sampleTruncated into category view.

## G2-17-030-060  [P2] GAP  facet F13  effort S
- Legacy: Legacy attention empty is success alert. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:402`
- vNext now: vNext attention empty is plain paragraph. `src/components/placements/super-admin-needs-attention.tsx:19`
- Fix: Use success alert with icon and legacy border/background.

## G2-17-030-070  [P2] GAP  facet F18  effort S
- Legacy: Legacy Needs attention sublabels and empty copy exact, including last category. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19`
- vNext now: vNext attention copies match first categories but differing OFFERED tab and no detail. `src/components/placements/super-admin-needs-attention.tsx:6`
- Fix: Use exact legacy copy mapping and status target separately.

## G2-17-030-073  [P2] GAP  facet F19  effort M
- Legacy: Legacy attention sample capped per category and expansion limited by fetched items. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:410`
- vNext now: vNext attention aggregates rows in operations workQueue. `src/components/placements/super-admin-needs-attention.tsx:14`
- Fix: Enforce dynamic sample cap; report total vs sample explicitly.
