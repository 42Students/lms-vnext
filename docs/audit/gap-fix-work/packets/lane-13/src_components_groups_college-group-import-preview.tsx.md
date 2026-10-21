# Work packet: edit src/components/groups/college-group-import-preview.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-012  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:163-183`
- vNext now: `src/components/groups/college-group-import-preview.tsx:16-110`
- Fix: Legacy bulk add accepts manual learnerIds/rollNumbers and CSV source up to2000 in one operation; VNext import is 500-row email-only validation and performs NO membership writes. Restore bounded confirmed import.

## G2-3-024-016  [P1] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:195-200`
- vNext now: `src/components/groups/college-group-import-preview.tsx:84-110`
- Fix: Legacy partial bulk add returns requested/added/results/errors per learner; VNext CSV preview shows ready/blocked but cannot confirm import. Add final actionable summary with durable results.

## G2-3-024-021  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:168-201`
- vNext now: `src/components/groups/college-group-import-preview.tsx:64-110`
- Fix: Legacy per-learner partial success allows unaffected members to be added; VNext CSV preview-only cannot persist even valid rows. Add transactional bounded batch with per-row partial results.

## G2-3-024-029  [P1] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-201`
- vNext now: `src/components/groups/college-group-import-preview.tsx:16-110`
- Fix: Legacy member CSV bulk operation writes to group; VNext file picker only parses .csv client and calls dry-run. Implement confirmed import endpoint and safe downloadable errors.

## G2-3-024-047  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-201`
- vNext now: `src/components/groups/college-group-import-preview.tsx:64-110`
- Fix: Legacy operational bulk membership addition by CSV/roll number is omitted from active VNext import preview; no exception documented. Restore confirmed workflow.

## G2-3-024-015  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:163-183`
- vNext now: `src/components/groups/college-group-import-preview.tsx:64-109`
- Fix: Legacy errors source MANUAL or CSV, at most2000, learner not found per roll; VNext dry-run has max500 and status error CSV only. Map imported rows and cap semantics.
