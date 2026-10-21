# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l11-u023-tpo-requests.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u023-tpo-requests.md

## G2-11-023-005  [P1] GAP  facet F03  effort M
- Legacy: Needs doing three conditional interactive chips incl Proof missing (RequestsPanel.js:120-124,418-427).
- vNext now: Two interactive links and one non-interactive 'May need proof review' span (requests/page.tsx:118-128).
- Fix: Make proof-missing chip actionable and backend-grounded rather than advisory.

## G2-11-023-008  [P1] MISSING  facet F04  effort M
- Legacy: RequestDetails displays choice, company+CTC LPA, corrected field, safe proof/offer URL or 'not a web link' (RequestsPanel.js:33-55).
- vNext now: Rows render reason, job/company only; no payload details/proof hyperlinks (requests/page.tsx:139-156).
- Fix: Render typed payload fields and safe URL links with invalid URL fallback.

## G2-11-023-009  [P1] MISSING  facet F04  effort M
- Legacy: Correction without link warns No proof attached (RequestsPanel.js:46-55).
- vNext now: Proof strip is unverified text-based approximation (requests/page.tsx:126-128).
- Fix: Evaluate proof per request and show exact missing-proof warning.

## G2-11-023-018  [P1] GAP  facet F05  effort M
- Legacy: TpoDataTable select rows and per-type bulk action (RequestsPanel.js:260-312,430-434).
- vNext now: Paged list, bulk decisions only on page and nested under disclosure (requests/page.tsx:162-176).
- Fix: Restore discoverable selection controls and safe cross-page selection behavior.

## G2-11-023-035  [P1] GAP  facet F12  effort M
- Legacy: Proof not attached prevents blind bulk approve but still allows per-item review (RequestsPanel.js:261-276).
- vNext now: Bulk receives only id/type, no proof presence (requests/page.tsx:163-166).
- Fix: Add proof missing flags and explicit skip/error handling to bulk preview.

## G2-11-023-049  [P1] MISSING  facet F23  effort M
- Legacy: Legacy single integrated table with proof links and grouped ActionsWindow (RequestsPanel.js:328-466).
- vNext now: Paged cards, nested disclosures and no visible proof payload (requests/page.tsx:131-190).
- Fix: Restore core request details and action discoverability, not only visual shell.
