# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/privacy-policy.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/privacy-policy.md

## G2-20-007-017  [P1] GAP  facet F04  effort S
- Legacy: Data storage text explicitly MySQL; Cloudflare R2 for files; `docs/legacy-source/frontend/src/pages/privacy-policy.js:109-118`
- vNext now: Static says PostgreSQL, R2 and more conditional upload language; `public/assets/static/privacy-policy-view.html:80-89`
- Fix: Resolve legal data-store wording to actual vNext architecture (PostgreSQL) and preserve owner-approved policy content, not obsolete MySQL.
