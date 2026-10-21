# Work packet (wave 2): edit src/components/admin/super-admin-today-board.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-016  [P2] GAP  facet F03  effort L
- Legacy: Today uses six bordered Ant Card widgets with icon title count and color tone `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-48` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- vNext now: New Today is six border-left linked text blocks, no icons or nested rows `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Rebuild classic attention cards with old icon, count badge, empty and detail structures

## G2-10-005-027  [P2] GAP  facet F05  effort S
- Legacy: Old Today card grid full width xs24, two columns lg, three xl `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-151`
- vNext now: New Today grid two at 768 and three xl `src/components/admin/super-admin-today-board.tsx:14-20`
- Fix: Use old two-column breakpoint at lg rather than 768

## G2-10-005-034  [P2] MISSING  facet F09  effort S
- Legacy: Legacy Today Refresh small text button next to heading `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-135`
- vNext now: New Today heading has no refresh button `src/components/admin/super-admin-today-board.tsx:8-13`
- Fix: Restore Refresh button for scoped attention feed

## G2-10-005-045  [P2] MISSING  facet F13  effort M
- Legacy: Old Today six skeleton cards while loading and per-card failed state `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-48` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-149`
- vNext now: New Today rendered immediately from optional null snapshot, no skeleton/per-card error state `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Restore card-level skeleton, failed and all-clear states

## G2-10-005-046  [P2] MISSING  facet F13  effort S
- Legacy: Old Today all-clear status Nothing needs you right now. when no gaps `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:241-243`
- vNext now: New no all-clear summary, only count blocks `src/components/admin/super-admin-today-board.tsx:8-24`
- Fix: Show exact all-clear message when valid complete results are all zero

## G2-10-005-054  [P2] GAP  facet F17  effort S
- Legacy: Old Today section aria-label Needs attention and Today's classes `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-138`
- vNext now: New section aria-label Today and one summary paragraph `src/components/admin/super-admin-today-board.tsx:8-14`
- Fix: Restore section landmark name and classes list/status layout

## G2-10-005-060  [P2] GAP  facet F18  effort M
- Legacy: Old attention empty strings Every class held... No student under... No assignment submission... `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-190`
- vNext now: New generic Not yet measurable for three categories `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Restore category-specific success/failure/empty sentences

## G2-10-005-064  [P2] GAP  facet F20  effort M
- Legacy: Old AttentionBoard suppresses duplicate refresh in loadInFlightRef and keeps prior data on same scope `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:70-99`
- vNext now: New Today has no refresh requests, only SSR snapshot `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:3-24`
- Fix: Support deduplicated scoped refresh with last good data and explicit failure

## G2-9-035-016  [P2] GAP  facet F03  effort L
- Legacy: Today uses six bordered Ant Card widgets with icon title count and color tone `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-48` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- vNext now: New Today is six border-left linked text blocks, no icons or nested rows `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Rebuild classic attention cards with old icon, count badge, empty and detail structures

## G2-9-035-027  [P2] GAP  facet F05  effort S
- Legacy: Old Today card grid full width xs24, two columns lg, three xl `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-151`
- vNext now: New Today grid two at 768 and three xl `src/components/admin/super-admin-today-board.tsx:14-20`
- Fix: Use old two-column breakpoint at lg rather than 768

## G2-9-035-034  [P2] MISSING  facet F09  effort S
- Legacy: Legacy Today Refresh small text button next to heading `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-135`
- vNext now: New Today heading has no refresh button `src/components/admin/super-admin-today-board.tsx:8-13`
- Fix: Restore Refresh button for scoped attention feed

## G2-9-035-045  [P2] MISSING  facet F13  effort M
- Legacy: Old Today six skeleton cards while loading and per-card failed state `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-48` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-149`
- vNext now: New Today rendered immediately from optional null snapshot, no skeleton/per-card error state `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Restore card-level skeleton, failed and all-clear states

## G2-9-035-046  [P2] MISSING  facet F13  effort S
- Legacy: Old Today all-clear status Nothing needs you right now. when no gaps `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:241-243`
- vNext now: New no all-clear summary, only count blocks `src/components/admin/super-admin-today-board.tsx:8-24`
- Fix: Show exact all-clear message when valid complete results are all zero

## G2-9-035-054  [P2] GAP  facet F17  effort S
- Legacy: Old Today section aria-label Needs attention and Today's classes `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:125-138`
- vNext now: New section aria-label Today and one summary paragraph `src/components/admin/super-admin-today-board.tsx:8-14`
- Fix: Restore section landmark name and classes list/status layout

## G2-9-035-060  [P2] GAP  facet F18  effort M
- Legacy: Old attention empty strings Every class held... No student under... No assignment submission... `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-190`
- vNext now: New generic Not yet measurable for three categories `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Restore category-specific success/failure/empty sentences

## G2-9-035-064  [P2] GAP  facet F20  effort M
- Legacy: Old AttentionBoard suppresses duplicate refresh in loadInFlightRef and keeps prior data on same scope `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:70-99`
- vNext now: New Today has no refresh requests, only SSR snapshot `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:3-24`
- Fix: Support deduplicated scoped refresh with last good data and explicit failure

## G2-9-035-084  [P2] GAP  facet F03  effort S
- Legacy: Legacy Today has six icon distinctions Clock/Warning/Form/Team/Tool/Calendar `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- vNext now: New all cards display plain text headings, no icons `src/components/admin/super-admin-today-board.tsx:14-20`
- Fix: Use six legacy icons and tone rings.

## G2-9-035-105  [P2] MISSING  facet F12  effort S
- Legacy: Old Today allclear when all four tracked risks 0 plus setup gap total 0 `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:241-243`
- vNext now: New never derives allclear from validated six sections `src/components/admin/super-admin-today-board.tsx:8-25`
- Fix: Show Nothing needs you right now. only when all populated sections count zero.

## G2-9-035-116  [P2] GAP  facet F20  effort M
- Legacy: Old refresh guard prevents duplicate inflight requests `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:70-99`
- vNext now: New today server rendered once, no refresh handler `src/components/admin/super-admin-today-board.tsx:8-25`
- Fix: Add deduplicated manual refresh while retaining last-good data.

## G2-10-005-053  [P3] GAP  facet F17  effort S
- Legacy: Old attention icons marked aria-hidden where decorative `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-33`
- vNext now: New attention cards have no icons, headings are text `src/components/admin/super-admin-today-board.tsx:14-20`
- Fix: Restore decorative hidden icons and semantic accessible count text

## G2-9-035-053  [P3] GAP  facet F17  effort S
- Legacy: Old attention icons marked aria-hidden where decorative `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:23-33`
- vNext now: New attention cards have no icons, headings are text `src/components/admin/super-admin-today-board.tsx:14-20`
- Fix: Restore decorative hidden icons and semantic accessible count text

## G2-9-035-111  [P3] MISSING  facet F17  effort S
- Legacy: Old Today status allclear check icon marked aria-hidden `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:241-243`
- vNext now: New no success status/check icon `src/components/admin/super-admin-today-board.tsx:8-25`
- Fix: Restore screen-reader-readable allclear sentence with decorative icon aria-hidden.
