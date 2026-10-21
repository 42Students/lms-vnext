# Work packet (wave 2): edit src/components/placements/placement-employer-relationships.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md

## G2-9-004-008  [P2] GAP  facet F03  effort M
- Legacy: Company avatar logo 32px and Verified by 42 tag (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:266-282`)
- vNext now: Text name, Verified by 42 + Trusted badges, no avatar (`src/components/placements/placement-employer-relationships.tsx:194-212`)
- Fix: Restore company 32px avatar and proper tag hierarchy.

## G2-9-004-009  [P2] GAP  facet F03  effort M
- Legacy: Industry and joined domains below company name (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:273-279`)
- vNext now: Domains string and industry in one line (`src/components/placements/placement-employer-relationships.tsx:215-223`)
- Fix: Recreate two-line muted metadata hierarchy.

## G2-9-004-010  [P2] GAP  facet F03  effort M
- Legacy: History/Edit/Delete action icons (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:314-321`)
- vNext now: Save/Archive/Restore row buttons (`src/components/placements/placement-employer-relationships.tsx:304-330`)
- Fix: Restore History, Edit company details and Delete controls subject to authorization policy.

## G2-9-004-011  [P2] GAP  facet F03  effort M
- Legacy: Deleted rows opacity 0.55 and Deleted badge (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:399-414`)
- vNext now: Deleted badge but no dimmed row styling (`src/components/placements/placement-employer-relationships.tsx:205-209`)
- Fix: Dim archived rows visually.

## G2-9-004-013  [P2] GAP  facet F04  effort M
- Legacy: Company name plus avatar, industry, domains (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:265-286`)
- vNext now: Name, verification/trust, domains, industry; no logo (`src/components/placements/placement-employer-relationships.tsx:197-222`)
- Fix: Port avatar and separate industry/domain layout.

## G2-9-004-015  [P2] GAP  facet F04  effort M
- Legacy: Website link labeled Visit plus GlobalOutlined (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:292-305`)
- vNext now: Open employer website → link (`src/components/placements/placement-employer-relationships.tsx:224-240`)
- Fix: Use icon and Visit wording, target behavior as old.

## G2-9-004-016  [P2] GAP  facet F04  effort M
- Legacy: Drives count sortable numeric column (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:306-315`)
- vNext now: Drives rendered in paragraph (`src/components/placements/placement-employer-relationships.tsx:217-224`)
- Fix: Restore sortable Drives column.

## G2-9-004-044  [P2] GAP  facet F09  effort M
- Legacy: Restore Popconfirm 'It will reappear across job postings.' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:308-321`)
- vNext now: Restores college relationship with preserved history (`src/components/placements/placement-employer-relationships.tsx:345-369`)
- Fix: Match warning copy and clarify company vs relationship restoration.

## G2-9-004-055  [P2] GAP  facet F12  effort M
- Legacy: Only selected deleted row restores (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:151-164`)
- vNext now: Only archived relationship can restore unless canonical company archived (`src/components/placements/placement-employer-relationships.tsx:154-173`)
- Fix: Clarify global archived identity/college link recovery rights.

## G2-9-004-059  [P2] GAP  facet F13  effort M
- Legacy: No companies yet — add one... vs No companies match... (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:410-432`)
- vNext now: No companies yet. for both states (`src/components/placements/placement-employer-relationships.tsx:181-188`)
- Fix: Restore filtered-empty and virgin-empty copy.

## G2-9-004-067  [P2] GAP  facet F16  effort M
- Legacy: Desktop six-column Ant Table, horizontal x:max-content (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:395-433`)
- vNext now: Responsive row grid 1.2fr/1fr (`src/components/placements/placement-employer-relationships.tsx:188-342`)
- Fix: Rebuild dense table and mobile horizontal scroll.

## G2-9-004-070  [P2] GAP  facet F17  effort M
- Legacy: Action icon buttons History/Edit/Delete accessible within row (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:315-320`)
- vNext now: Save/Archive/Restore buttons accessible (`src/components/placements/placement-employer-relationships.tsx:303-340`)
- Fix: Make named actions and labels per company.

## G2-9-004-074  [P2] GAP  facet F18  effort M
- Legacy: Website link text Visit (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:300-306`)
- vNext now: Open employer website → (`src/components/placements/placement-employer-relationships.tsx:224-239`)
- Fix: Restore Visit with globe icon.

## G2-9-004-075  [P2] GAP  facet F18  effort M
- Legacy: Last active absent says Never posted (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:304-314`)
- vNext now: Absent says Not recorded (`src/components/placements/placement-employer-relationships.tsx:216-224`)
- Fix: Restore Never posted.

## G2-9-004-080  [P2] MISSING  facet F20  effort M
- Legacy: Detail stale request id checked before populating (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:244-268`)
- vNext now: No history detail race because missing (`src/components/placements/placement-employer-relationships.tsx:184-341`)
- Fix: If restoring history, cancel stale requests when switching companies.
