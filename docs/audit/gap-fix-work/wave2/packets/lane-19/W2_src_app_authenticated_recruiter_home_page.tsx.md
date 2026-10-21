# Work packet (wave 2): edit src/app/(authenticated)/recruiter/home/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-home.md, docs/audit/gap2/lane-9/recruiter-colleges-index.md

## G2-13-002-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy `/recruiter/home` has Redux active menu `home` (`docs/legacy-source/frontend/src/pages/recruiter/home.js:20-29`)
- vNext now: Alias exports canonical `/hr/home` page (`src/app/(authenticated)/recruiter/home/page.tsx:1-1`)
- Fix: Keep legacy URL/menu active, with redirects preserving college context.

## G2-9-021-001  [P2] GAP  facet F01  effort S
- Legacy: Retired /recruiter/colleges automatically replaces URL with /recruiter/home using effect `docs/legacy-source/frontend/src/pages/recruiter/colleges/index.js:4-12`
- vNext now: Server redirect /hr/home `src/app/(authenticated)/recruiter/colleges/page.tsx:1-3`; recruiter/home is an alias for same HR home `src/app/(authenticated)/recruiter/home/page.tsx:1`
- Fix: Redirect to /recruiter/home before alias resolution if URL and router history must exactly match; otherwise explicitly approve two-hop semantic equivalence.
