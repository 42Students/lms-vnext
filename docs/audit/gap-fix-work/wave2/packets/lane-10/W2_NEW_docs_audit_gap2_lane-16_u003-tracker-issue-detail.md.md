# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-070  [P2] GAP  facet F19  effort M
- Legacy: `[issueId].js:63-82`: three independent GETs with shared AbortController and per-request error handling.
- vNext now: `admin-service.ts:221-275`: SQL report plus concurrent paginated optional relations; server render.
- Fix: Maintain bounded relation reads without losing independent failure handling.
