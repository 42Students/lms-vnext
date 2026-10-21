# Work packet (wave 2): edit src/app/(authenticated)/recruiter/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-index.md

## G2-13-003-001  [P2] GAP  facet F01  effort S
- Legacy: Entry path /recruiter redirects temporary to /recruiter/home (`docs/legacy-source/frontend/src/pages/recruiter/index.js:2-4`)
- vNext now: SSR getServerSideProps redirects to /hr/home (`src/app/(authenticated)/recruiter/page.tsx:1-3`)
- Fix: Restore legacy target /recruiter/home or approve visible URL change.

## G2-13-003-020  [P2] GAP  facet F18  effort S
- Legacy: Legacy destination URL literal /recruiter/home (`docs/legacy-source/frontend/src/pages/recruiter/index.js:1-8`)
- vNext now: New destination URL literal /hr/home (`src/app/(authenticated)/recruiter/page.tsx:1-3`)
- Fix: Match literal old path; avoid URL drift in user-visible links.
