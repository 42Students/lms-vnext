# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

## G2-7-012-014  [P2] GAP  facet F04  effort M
- Legacy: readiness.js:32-35 completed task status contains COMPLET or equals DONE
- vNext now: readiness-service.ts:93-95 counts exact DONE only
- Fix: Migrate/map legacy status aliases

## G2-7-012-039  [P2] GAP  facet F13  effort M
- Legacy: readiness.js:83-95 six-row skeleton retry and not-found
- vNext now: [projectId]/[section]/loading.tsx:1-10 generic directory loading
- Fix: Restore section-specific loading and retry

## G2-7-012-055  [P2] GAP  facet F20  effort M
- Legacy: readiness.js:30-38 COMPLET/DONE status normalization and nullable resolvedTasks
- vNext now: readiness-service.ts:93-95 strict DONE and no proof
- Fix: Map legacy statuses and empty rows
