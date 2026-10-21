# Work packet (wave 2): edit src/components/placements/college-drive-pipeline-overview.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-9-011-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11` — Breadcrumb Drives then company/job; tabs Overview Applications Schedule Settings
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:16-20` — Quick actions Schedule and Shortlisted shown after metric tiles, no full tab strip
- Fix: Move tab navigation above content with exact labels and tab order

## G2-9-011-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:151-170` — Warning icon and grouped attention counts, learner links with small right chevrons
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:32-41` — Plain attention heading/links and candidate(s) summary
- Fix: Display grouped counts, warning icon and learner-level chevron links

## G2-9-011-021  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11` — Primary level-two navigation is Overview/Applications/Schedule/Settings
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:16-20` — Quick-actions nav only Schedule and Shortlisted
- Fix: Replace shortcuts with legacy level-two tab strip; keep Shortlisted as extra

## G2-9-011-048  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:151-183` — Attention row signals are shown visually; clicking only navigates, no candidate notification
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:32-40` — Attention notices are listed as aggregate navigation without notification dispatch
- Fix: Surface each candidate alert with correct count and deep link

## G2-9-011-051  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:28-45` — DriveSubNav keyboard active tabs and safe returnTo plus modal if dirty
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:16-20` — Anchor quick action nav, no role-aware current tab focus indicator
- Fix: Expose active tab aria and focus visible underline on level-two nav

## G2-9-011-052  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:151-172` — Warning links include learner name and small chevron with click target
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:35-40` — Category link text and count only
- Fix: Restore labelled candidate links with robust 44px target mobile

## G2-9-011-054  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:229-229` — Heading Pipeline
- vNext now: `src/components/placements/college-drive-pipeline-overview.tsx:23-24` — Heading Application pipeline plus current-stage methodological text
- Fix: Use Pipeline as primary section title, retain methodology note below
