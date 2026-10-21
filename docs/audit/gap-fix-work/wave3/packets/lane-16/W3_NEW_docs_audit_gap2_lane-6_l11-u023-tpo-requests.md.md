# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-6/l11-u023-tpo-requests.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u023-tpo-requests.md

## G2-11-023-016  [P1] MISSING  facet F05  effort L
- Legacy: Filter panel group Request (kind, urgent, status, waiting since, proof, drive), Student (branch, registration) (RequestsPanel.js:95-109).
- vNext now: Advanced has request kind, drive, pageSize, age, order; missing proof, branch, registration (requests/page.tsx:99-115).
- Fix: Restore filters for proof, branch, after-college and correct waiting buckets.
