# Work packet (wave 2): edit src/app/(authenticated)/hr/company/reports/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-052  [P2] GAP  facet F12  effort S
- Legacy: Legacy does not suppress stages other than zero-count Assessment (`docs/legacy-source/frontend/src/pages/recruiter/company.js:117-118`)
- vNext now: New funnel renders all six stages, even Assessment count 0 (`src/app/(authenticated)/hr/company/reports/page.tsx:202-209`)
- Fix: Hide zero Assessment stage only, or document deliberate new behavior.

## G2-13-001-059  [P2] GAP  facet F13  effort S
- Legacy: Reports with zero drives show `Reports appear once you have a drive with applicants.` (`docs/legacy-source/frontend/src/pages/recruiter/company.js:114-115`)
- vNext now: New `No matching drives` state with additional filter guidance (`src/app/(authenticated)/hr/company/reports/page.tsx:301-307`)
- Fix: Use legacy sentence for unfiltered true-empty and retain filter-specific guidance separately.

## G2-13-001-067  [P2] GAP  facet F17  effort S
- Legacy: Legacy `ReloadOutlined` icon visually labels retry (`docs/legacy-source/frontend/src/pages/recruiter/company.js:47-48`)
- vNext now: Page uses ErrorState with link resets, not same reload icon (`src/app/(authenticated)/hr/company/reports/page.tsx:68-87`)
- Fix: Use explicit retry/reset action with matching icon and accessible label when data fetch fails.

## G2-13-001-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy reports is a `Reports` tab under `Company & Team` (`docs/legacy-source/frontend/src/pages/recruiter/company.js:159-165`)
- vNext now: Standalone reports heading is `Company Reports` (`src/app/(authenticated)/hr/company/reports/page.tsx:165-170`)
- Fix: Use same page-level title within Company & Team tabs if clone requires exact heading.
