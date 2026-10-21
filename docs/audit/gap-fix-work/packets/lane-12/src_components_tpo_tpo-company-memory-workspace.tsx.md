# Work packet: edit src/components/tpo/tpo-company-memory-workspace.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-015  [P1] GAP  facet F03  effort L
- Legacy: Legacy company link card visible only if `companyId`, with Trust switch, domain editor, link status. `docs/legacy-source/frontend/src/pages/tpo/companies.js:155`
- vNext now: vNext name view shows navigation button `Company link and trusted settings`; canonical detail contains link/trust. `src/components/tpo/tpo-company-memory-workspace.tsx:233`
- Fix: Embed existing TpoPublicJoinLinkCard and trust control at legacy location or provide exact in-page parity.

## G2-11-007-017  [P1] GAP  facet F03  effort L
- Legacy: Legacy Team card is always in right column, one company conversation. `docs/legacy-source/frontend/src/pages/tpo/companies.js:174`
- vNext now: vNext requires canonicalCompanyId to show embedded Team; otherwise displays `Link this company...`. `src/components/tpo/tpo-company-memory-workspace.tsx:295`
- Fix: Match legacy name-keyed Team availability or supply migration-safe name-to-company bridge.

## G2-11-007-023  [P1] GAP  facet F04  effort M
- Legacy: Legacy total `studentsHired` is facts.hired(companyJobs) honoring placement rules. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:408`
- vNext now: vNext company memory uses companyPlacedCount and shows `Verification pending` when unverifiable; canonical shows joined learners instead. `src/components/tpo/tpo-company-memory-workspace.tsx:254`
- Fix: Use one policy-aware consistent count with documented null/unknown behavior.

## G2-11-007-070  [P1] GAP  facet F12  effort L
- Legacy: Legacy distinct placed by year groups by creation year and `Facts.placedByJob`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:412`
- vNext now: vNext canonical groups confirmed joined by joining year; name chart also documented as JOINED. `src/components/tpo/tpo-company-memory-workspace.tsx:282`
- Fix: Define exact KPI data rule on page and align output, not just words.

## G2-11-007-074  [P1] GAP  facet F13  effort M
- Legacy: Legacy counts failures produce warning alert and stale cells; failure in load company shows PanelError. `docs/legacy-source/frontend/src/pages/tpo/companies.js:111`
- vNext now: vNext count source has no name-page Retry counts UI, and schema-pending 503 branch different. `src/components/tpo/tpo-company-memory-workspace.tsx:129`
- Fix: Restore optional warning and granular retry actions.

## G2-11-007-108  [P1] GAP  facet F23  effort M
- Legacy: Legacy name page has CompanyLinkCard in same detail when companyId exists. `docs/legacy-source/frontend/src/pages/tpo/companies.js:155`
- vNext now: vNext deliberately externalizes it to company UUID detail, which can be unavailable to orphan recruiter lead. `src/components/tpo/tpo-company-memory-workspace.tsx:233`
- Fix: Restore in-place link/trust for canonical case, safe missing ID state for orphan.

## G2-11-007-042  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing company on name route: redirects to Recruiter Companies if no name; actual backend not found becomes `Company not found` with Retry. `docs/legacy-source/frontend/src/pages/tpo/companies.js:41`
- vNext now: vNext name view has `Company not found`, plus Back; canonical UUID detail uses notFound. `src/components/tpo/tpo-company-memory-workspace.tsx:194`
- Fix: Align missing/malformed route states; use one visible Retry/Back decision.
