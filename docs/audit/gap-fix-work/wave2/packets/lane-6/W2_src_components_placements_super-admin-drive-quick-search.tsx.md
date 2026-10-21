# Work packet (wave 2): edit src/components/placements/super-admin-drive-quick-search.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md

## G2-10-017-013  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:540-554 — Each active card has 40px company avatar/logo and yellow #faad14 numeric attention badge.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-43 — No avatar or attention badge in quicksearch rows.
- Fix: Render logos/fallback and per-drive attention count.

## G2-10-017-014  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:555-585 — Blue/default applicant-count Tag, calendar icon, small ellipsis More actions.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-45 — Plain applicants text, status line, Open drive link.
- Fix: Restore chip/clock/menu icons and affordances.

## G2-10-017-015  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:523-539 — Card hoverable/keyboard activated via Enter/Space, equal height 100%.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:34-45 — Flat article row with Open drive link; no card click.
- Fix: Add keyboard-accessible clickable card semantics.

## G2-10-017-016  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:485-493 — Search bar right width240, CTA New Drive with PlusOutlined.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:23-33 — New Drive in global header; Find a drive section lower, separate Status filter.
- Fix: Position search/new inside active drive header.

## G2-10-017-020  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:461-479 — Search only loaded up to 60 latest active drives; if more, explicit 'search all drives' link.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:23-49 — Quicksearch searches all loaded jobs and caps rendered 60, generic narrow-search hint.
- Fix: Restore exact search scope notice and link to full directory.

## G2-10-017-021  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:555-564 — Active card applicant count and applicationDeadline in DD MMM.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-45 — Quicksearch only submitted count, no deadline.
- Fix: Include deadline and expired cue.

## G2-10-017-024  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:204-208 — Search q persisted in URL via shallow router updates; filters active list only.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:23-35 — Input useState; query not reflected in URL, adds optional ALL status toggle.
- Fix: Synchronize q and back/forward link behavior.

## G2-10-017-029  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:565-584 — Card More actions: Duplicate as new drive, Extend deadline.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-43 — Only Open drive link; workflows in nested workspace.
- Fix: Expose exact actions in card ellipsis.

## G2-10-017-042  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:674-699 — Extend deadline opens explicit Modal with DatePicker and confirm.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-43 — No modal in quick search.
- Fix: Add dialog with DatePicker and busy state.

## G2-10-017-057  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:497-521 — Active card loading CardGridSkeleton 4, error banner Retry, no-active PanelEmpty with Create your first drive CTA.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-51 — Quicksearch empty 'No drives match your search and status.', no card skeleton.
- Fix: Separate no active vs filtered zero, correct CTA and skeleton.

## G2-10-017-060  [P2] MISSING  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:541-545 — Company logo via PlacementsCompanyAvatar HTTPS fallback initials (40px).
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-43 — Text only; no image/logo/preview.
- Fix: Restore sanitized logo/fallback.

## G2-10-017-065  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:523-590 — Active cards grid XS24 SM12 LG8 XL6, gaps16; 1/2/3/4 columns.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-46 — Flat rows full width, no four-breakpoint cards.
- Fix: Match responsive grid and 40px logo alignment.

## G2-10-017-066  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:461-495 — Active header compact search240px and New Drive CTA, wraps under 400px.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:23-35 — Search in separate full-width lower section, header CTA distant.
- Fix: Reflow header controls at 320,375,768.

## G2-10-017-068  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:523-539 — Entire card has role=button, tabIndex=0, keydown Enter/Space for deep link.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-46 — Only Open drive link keyboard accessible, row not clickable.
- Fix: Implement card key activation and focus outline.

## G2-10-017-069  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:546-553 — Attention badge aria-label 'Drive status: N item(s) need attention'.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-43 — No attention badge/aria description.
- Fix: Add descriptive count announcement.

## G2-10-017-070  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:565-584 — More actions button aria-label More actions; stopPropagation prevents opening card.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-46 — No menu/action button.
- Fix: Recreate nested menu with correct propagation.

## G2-10-017-072  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:461-493 — 'Active drives (N)' and placeholder 'Search by drive or company', button 'New Drive'.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:19-35 — 'Find a drive' and 'N of N drives', no adjacent New Drive.
- Fix: Use exact title/placeholder/labels.

## G2-10-017-074  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:513-520 — 'No active drives yet' / 'No active drives match your search', CTA Create your first drive / Clear search.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:46-51 — 'No drives match your search and status.'
- Fix: Restore variant messages and CTA.

## G2-10-017-077  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:204-208 — Search only active cards loaded, uses URL query q; transparently discloses cap60.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:16-35 — Quicksearch local state and full list filtering then slice60.
- Fix: Keep reproducible deep links and cap scope notice.

## G2-10-017-079  [P2] MISSING  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:30-39,555-563 — Date parse UTC/local, calendar shows DD MMM and proper deadline.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:36-45 — Quicksearch lacks deadline entirely.
- Fix: Add date with IST formatting and expired cue.

## G2-17-030-059  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty active drives offers Create your first drive or Clear search. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:511`
- vNext now: vNext Find a drive displays No drives match your search and status. `src/components/placements/super-admin-drive-quick-search.tsx:47`
- Fix: Match two distinct legacy empty/CTA states.

## G2-17-030-064  [P2] GAP  facet F16  effort M
- Legacy: Legacy responsive cards 1xs/2sm/3lg/4xl, policy grid xs24/md12. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:523`
- vNext now: vNext quick search and portfolio are list/rows with flex breakpoints. `src/components/placements/super-admin-drive-quick-search.tsx:39`
- Fix: Clone card width, gutters 16 and 24 breakpoint policy columns.

## G2-17-030-065  [P2] GAP  facet F16  effort S
- Legacy: Legacy search width 240px and wraps next to New Drive button. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:485`
- vNext now: vNext search stretches with min-width and status dropdown. `src/components/placements/super-admin-drive-quick-search.tsx:23`
- Fix: Match desktop toolbar field width and mobile wrap behavior.
