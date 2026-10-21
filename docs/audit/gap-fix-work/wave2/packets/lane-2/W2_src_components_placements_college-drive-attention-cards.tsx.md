# Work packet (wave 2): edit src/components/placements/college-drive-attention-cards.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-9-016-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:461-498` — Active drives heading/search/New Drive same inline toolbar.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:42-48` — Active drives list heading inside attention disclosure, no search/inline create.
- Fix: Restore active drives toolbar, company/name search, New Drive.

## G2-9-016-010  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:522-592` — Cards grid xs24 sm12 lg8 xl6, hoverable full clickable.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-63` — Simple flat border-bottom articles, grid sm2 xl3, only buttons links.
- Fix: Build hoverable 4-column card grid at xl and card click.

## G2-9-016-011  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:593-601` — All drives link centered beneath cards, includes closed/draft count.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:43-46` — All drives link at heading right, no count.
- Fix: Move count link under grid with chevron icon.

## G2-9-016-016  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:407-410` — WarningOutlined amber, four-pixel #faad14 left bar and #fff1b8 background.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:14-21` — Neutral bordered section and normal header, no warning icon.
- Fix: Match warning card colors/border and icon.

## G2-9-016-018  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:445-456` — Expander +N more / Show less with top K of count when truncated.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:28-34` — Disclosure +N more · Show more, says Showing N of N always.
- Fix: Display correct total vs sample, toggle Show less.

## G2-9-016-019  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:530-557` — 40px PlacementsCompanyAvatar/logo, amber attention badge with accessible title, truncated text.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-53` — No company avatar/name, badge replaced text attention item(s).
- Fix: Add avatar/logo, company subtitle and badge with exact count.

## G2-9-016-020  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:555-566` — Applicants Tag blue if >0, CalendarOutlined DD MMM.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:50-55` — Plain applicants and Deadline dateStyle medium.
- Fix: Render colored count tag and calendar date icon short format.

## G2-9-016-029  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:544-552` — CompanyLogo in 40px avatar; jobTitle and companyName rows.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:49-55` — Only title, applicant count, deadline; no companyName/logo.
- Fix: Join company relationship and avatar.

## G2-9-016-032  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:522-592` — Active drive cards keyboard clickable Enter/Space + nested More dropdown.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-63` — Grid article only link Applications and deadline action, no whole-card focus.
- Fix: Make card focusable link to Overview; nested controls stop propagation.

## G2-9-016-034  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:410-450` — Attention order 4 fixed categories, show first3, then +more.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:6-36` — Three category map with rows.slice(0,3) and Disclosure overflow.
- Fix: Restore fourth category and correct counts/truncation semantics.

## G2-9-016-036  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:593-600` — All drives link secondary with inactive count, follows cards.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:42-47` — All drives unconditional link above cards.
- Fix: Move secondary link beneath cards and include count.

## G2-9-016-037  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:204-208` — Client search limited to loaded60, warns of incomplete search and links global search.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:42-64` — No search and no capped-count explanation.
- Fix: Show capped search caveat and All drives link.

## G2-9-016-056  [P2] MISSING  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:565-587` — Per-card More icon dropdown click, stopPropagation from card click.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-61` — Only inner links/buttons; no More popup.
- Fix: Add accessible More menu and prevent nested card event.

## G2-9-016-071  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:498-509` — Active cards has separate loading/success/failed refresh with stale rows.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:42-64` — List renders loaded result after shared server read, no refresh state.
- Fix: Reproduce initial skeleton and cached scoped refresh states.

## G2-9-016-078  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:523-529` — Card grid xs1 sm2 lg3 xl4, 16px gutter.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-49` — Grid sm2 xl3 with generic gap token.
- Fix: Match 4-column at xl and 16px gutter.

## G2-9-016-079  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:525-531` — Whole card hoverable focusable button Enter/Space.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-59` — Article with actionable child links only.
- Fix: Provide focusable whole-card overview link, nested controls accessible.

## G2-9-016-081  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:525-537` — Whole card role button tabIndex0, Enter/Space and stopPropagation for dropdown.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:48-61` — Article semantics + child links, no keyboard card action.
- Fix: Reproduce keyboard overview action and dropdown event stop.

## G2-9-016-082  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:540-552` — Amber attention badge has title and aria-label with exact count.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:51-53` — Plain text n attention item(s), not badge.
- Fix: Use accessible badge aria-label and tooltip.

## G2-9-016-083  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:391-406` — Alert showIcon for error/success, accessible retry.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:15-17` — Plain no-attention paragraph and no retry.
- Fix: Add live region status and retry button.

## G2-9-016-085  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-26` — Attention labels Applications with no action in a week, Marked Interview nothing scheduled, Offered no letter, Closing soon low conversion.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:6-10` — Three labels same/close, missing Offered without letter.
- Fix: Restore exact fourth heading and punctuation.

## G2-9-016-087  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:594-600` — All drives (including N closed/draft) links archive.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:43-47` — Plain All drives without count.
- Fix: Add inactive count and RightOutlined.

## G2-9-016-030  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:560-565` — Deadline DD MMM, missing dash.
- vNext now: `src/components/placements/college-drive-attention-cards.tsx:54-55` — Intl medium en-IN IST, fallback Not specified.
- Fix: Match abbreviated date and missing em dash.
