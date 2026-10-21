# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md

5 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md

## G2-2-001-036  [P1] MISSING  facet F10  effort L
- Legacy: LC:53-68 GET /sync status and POST /sync now
- vNext now: NS:133-154 reads sync row; NP:114-124 says manual sync unavailable
- Fix: Implement secure importer status and privileged POST trigger; do not fabricate results.

## G2-2-001-039  [P1] MISSING  facet F10  effort L
- Legacy: LI:217-238 agent updates append event; fixable status promotes to fixed and merges commits
- vNext now: NS:12-14,133-154 readiness/read only, no importer
- Fix: Implement importer processing agent update files with audited status transitions and commits.

## G2-2-001-060  [P1] MISSING  facet F19  effort L
- Legacy: LI:64-71 scheduled every 5 min after 60 sec, 4-min exclusive lock
- vNext now: NS:133-154 stored sync read only, no periodic job
- Fix: Add scheduled lock-protected importer with durable progress ledger.

## G2-2-001-063  [P1] MISSING  facet F20  effort L
- Legacy: LI:74-75 synchronized sync; 102-129 no re-import, detect tampering/deletion
- vNext now: NS:136-154 sync-state read only
- Fix: Restore immutability ledger, retry rejected edits, tamper/delete events and idempotent sync.

## G2-2-001-065  [P1] MISSING  facet F21  effort L
- Legacy: LG:25-32 GitHub App/token for 42Students/lms-findings and API; LI:64-75 cron
- vNext now: NS:133-154 no provider client or cron, only persisted summary
- Fix: Implement GitHub App scoped-read client, sync job and credential checks.
