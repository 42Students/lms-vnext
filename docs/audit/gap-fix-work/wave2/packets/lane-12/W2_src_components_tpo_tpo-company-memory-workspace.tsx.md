# Work packet (wave 2): edit src/components/tpo/tpo-company-memory-workspace.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy header has `Create drive` then primary `Add contact`; routes `/tpo/drives/new?company=` and `/tpo/recruiters?add=1&company=`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:104`
- vNext now: vNext name Memory header has Back, `+ New` dropdown (lead, drive, follow-up), separate company link/Team links, and uses `/tpo/placements/new?company=`. `src/components/tpo/tpo-company-memory-workspace.tsx:220`
- Fix: Restore two prominent buttons in correct order, and check destination parity on every legacy link.

## G2-11-007-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy five-number PageStrip appears immediately below heading, then left People/Year chart/Company link/Documents and right Drives/Team/Timeline cards. `docs/legacy-source/frontend/src/pages/tpo/companies.js:125`
- vNext now: vNext name view shows metrics, hiring chart, Team, then two columns People/Documents vs Drives/Timeline; Company link moved to UUID detail. `src/components/tpo/tpo-company-memory-workspace.tsx:250`
- Fix: Restore card/section order and column placement per original visual hierarchy.

## G2-11-007-007  [P2] GAP  facet F02  effort L
- Legacy: Legacy company content sections are AntD Cards `People`, `Students placed, by year`, `Company link`, `Documents`, `Drives`, `Team`, `Timeline`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:134`
- vNext now: vNext name view mostly flat border-bottom sections with Team and chart ahead of cards; company link is remote. `src/components/tpo/tpo-company-memory-workspace.tsx:279`
- Fix: Reintroduce Card surfaces, consistent radius/borders/padding and legacy head presentation.

## G2-11-007-008  [P2] GAP  facet F02  effort S
- Legacy: Legacy Row gutter `[16,16]` with `Col xs=24 lg=12`, left/right split at lg. `docs/legacy-source/frontend/src/pages/tpo/companies.js:131`
- vNext now: vNext grid uses `xl:grid-cols-2` and gap-4/xl:gap-6, splitting only at xl. `src/components/tpo/tpo-company-memory-workspace.tsx:299`
- Fix: Move two-column breakpoint to 992px and match 16px gutter.

## G2-11-007-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy summary is `PageStrip` five separate tiny summary items. `docs/legacy-source/frontend/src/pages/tpo/companies.js:126`
- vNext now: vNext metrics grid has 1-col base, 3 cols md, 5 cols xl with different border layout. `src/components/tpo/tpo-company-memory-workspace.tsx:250`
- Fix: Match legacy strip dimensions and responsive wrapping.

## G2-11-007-010  [P2] GAP  facet F02  effort L
- Legacy: Legacy company detail appears inside PageShell scroll-container with `.tpo-company-detail` styles. `docs/legacy-source/frontend/src/pages/tpo/companies.js:98`
- vNext now: vNext name view uses section spacing and generic CSS utility tokens. `src/components/tpo/tpo-company-memory-workspace.tsx:211`
- Fix: Port scoped paddings, max widths, fonts and shadows from legacy SCSS.

## G2-11-007-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy PageStrip labels `contacts · N active`, `drives that ran`, `students placed`, `years hiring`, `last activity <event>`; values are independent. `docs/legacy-source/frontend/src/pages/tpo/companies.js:124`
- vNext now: vNext combines contacts/active into one value, replaces years hiring with `Accepted-offer drives`, and last activity value includes type plus date. `src/components/tpo/tpo-company-memory-workspace.tsx:251`
- Fix: Restore all five labels and value placement exactly.

## G2-11-007-013  [P2] GAP  facet F03  effort M
- Legacy: Legacy People rows link to recruiter, show name/designation or email/recruiterActivity and StageTag. `docs/legacy-source/frontend/src/pages/tpo/companies.js:136`
- vNext now: vNext rows add Avatar, both designation and email, sign-in summary with different time phrasing, neutral Badge. `src/components/tpo/tpo-company-memory-workspace.tsx:308`
- Fix: Match name/description concatenation, activity text and StageTag color/spacing.

## G2-11-007-018  [P2] GAP  facet F03  effort M
- Legacy: Legacy Timeline `Nothing logged yet` Empty with AntD Timeline item `<b>person</b> · type: note` then date. `docs/legacy-source/frontend/src/pages/tpo/companies.js:178`
- vNext now: vNext ordered list with left border and near-identical content but date format shortened/altered. `src/components/tpo/tpo-company-memory-workspace.tsx:367`
- Fix: Reproduce legacy Timeline dot/line/icon and date line.

## G2-11-007-019  [P2] GAP  facet F03  effort M
- Legacy: Legacy company summary `years hiring` counts years where hired >0. `docs/legacy-source/frontend/src/pages/tpo/companies.js:125`
- vNext now: vNext name header omits years metric; separate chart paragraph says `Years hiring` using hiredPerYear length. `src/components/tpo/tpo-company-memory-workspace.tsx:281`
- Fix: Put number back into PageStrip, not just chart description.

## G2-11-007-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy people: `name`, `designation`, `email`, `stage`, recruiter invite/signin facts; display fallback designation \|\| email. `docs/legacy-source/frontend/src/pages/tpo/companies.js:137`
- vNext now: vNext displays name, designation plus email, joined/signin activity based on data from new CRM rows. `src/components/tpo/tpo-company-memory-workspace.tsx:316`
- Fix: Match fallback priority and exact missing-value glyph.

## G2-11-007-030  [P2] GAP  facet F04  effort S
- Legacy: Legacy recruiter invite status text uses `agoText` (just now/minutes/hours/days), and says `Opened the invite, not joined yet`. `docs/legacy-source/frontend/src/components/tpo/ui/recruiterActivity.js:6`
- vNext now: vNext name view Joined last login renders absolute `en-IN` date, and `Invite opened, not joined yet`. `src/components/tpo/tpo-company-memory-workspace.tsx:322`
- Fix: Port exact relative-time and invite-message wording; make time update safely.

## G2-11-007-053  [P2] GAP  facet F09  effort S
- Legacy: Legacy page has two flat header action Buttons; no dropdown. `docs/legacy-source/frontend/src/pages/tpo/companies.js:105`
- vNext now: vNext `+ New` Dropdown with recruiter, drive, follow-up links. `src/components/tpo/tpo-company-memory-workspace.tsx:219`
- Fix: Restore two direct actions and remove/dropdown into approved overflow if needed.

## G2-11-007-068  [P2] GAP  facet F12  effort S
- Legacy: Legacy hiring percent bar max is max of per-year hired or 1, width = count/max*100. `docs/legacy-source/frontend/src/pages/tpo/companies.js:149`
- vNext now: vNext MetricBar uses same max but uses component sizing/labels. `src/components/tpo/tpo-company-memory-workspace.tsx:287`
- Fix: Match bar track, fill, percentage width and spacing.

## G2-11-007-069  [P2] GAP  facet F12  effort S
- Legacy: Legacy `repeatRelationship` true if drives.length>1 or yearsHiring>1. `docs/legacy-source/frontend/src/pages/tpo/companies.js:70`
- vNext now: vNext uses drivesRan>1 or hiredPerYear.length>1 (not all drives). `src/components/tpo/tpo-company-memory-workspace.tsx:214`
- Fix: Compute repeats against `drives.length` as original, including historic draft jobs.

## G2-11-007-072  [P2] GAP  facet F13  effort M
- Legacy: Legacy error PanelError `Company not found` with Retry; initial DetailSkeleton `Loading company details`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:99`
- vNext now: vNext GracefulPageLoading `Loading Company Memory…`, ErrorState title and Retry+Back. `src/components/tpo/tpo-company-memory-workspace.tsx:190`
- Fix: Match skeleton rows/layout and exact spinner/labels.

## G2-11-007-073  [P2] GAP  facet F13  effort M
- Legacy: Legacy missing contact `No contacts yet`; missing drive `No drives yet`; documents `Nothing shared yet`; Timeline `Nothing logged yet`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:136`
- vNext now: vNext name view preserves core empty words with added CTAs. `src/components/tpo/tpo-company-memory-workspace.tsx:303`
- Fix: Suppress extra inline actions/periods for strict exact empty-state parity.

## G2-11-007-082  [P2] GAP  facet F16  effort S
- Legacy: Legacy below lg(992) sections become stacked; People/Drives at full width. `docs/legacy-source/frontend/src/pages/tpo/companies.js:131`
- vNext now: vNext splits only xl (1280), so 992–1279 remains single-column. `src/components/tpo/tpo-company-memory-workspace.tsx:299`
- Fix: Match 992 two-column breakpoint.

## G2-11-007-088  [P2] GAP  facet F18  effort M
- Legacy: Legacy header exactly `Create drive` and `Add contact`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:106`
- vNext now: vNext `+ New`, `New recruiter lead for ...`, `New drive for ...`, `Follow-up`. `src/components/tpo/tpo-company-memory-workspace.tsx:220`
- Fix: Restore literal header action strings.

## G2-11-007-109  [P2] GAP  facet F23  effort M
- Legacy: Legacy PageStrip doesn't show `accepted-offer drives` but does show years hiring. `docs/legacy-source/frontend/src/pages/tpo/companies.js:125`
- vNext now: vNext name page swaps that metric and adds verification status, extra alias and Team links. `src/components/tpo/tpo-company-memory-workspace.tsx:254`
- Fix: Choose exact legacy summary slots; move extras outside primary strip.

## G2-11-007-090  [P3] GAP  facet F18  effort S
- Legacy: Legacy absent links message `No contacts yet`; empty docs `Nothing shared yet`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:136`
- vNext now: vNext uses `No contacts yet. Add contact` and `Nothing shared yet.`. `src/components/tpo/tpo-company-memory-workspace.tsx:304`
- Fix: Match punctuation and secondary CTA placement.
