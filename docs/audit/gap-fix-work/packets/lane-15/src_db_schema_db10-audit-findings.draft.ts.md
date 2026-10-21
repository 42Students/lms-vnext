# Work packet: edit src/db/schema/db10-audit-findings.draft.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-066  [P1] MISSING  facet F21  effort M
- Legacy: `AuditFindingSyncService.java:140-150,307-316`: each sync run records repo commit, errors, file failures.
- vNext now: `db10-audit-findings.draft.ts:61-67`: only status/time/count/refusedFiles, no lastCommit/lastError.
- Fix: Extend audit_finding_syncs and status endpoint with repo/commit/lastError/lastSuccessAt; do not invent sync success.

## G2-16-001-067  [P1] GAP  facet F22  effort L
- Legacy: `AuditFindingSyncService.java:181-214`; `AuditFindingService.java:65-67`: string finding IDs; roles, reported severity, environment, file provenance.
- vNext now: `db10-audit-findings.draft.ts:9-35`: externalId+UUID, no roles, reportedSeverity, environment, original file commit.
- Fix: Add missing fields and preserve exact external ID while using internal UUID FK.

## G2-16-001-069  [P1] GAP  facet F22  effort M
- Legacy: `AuditFindingSyncService.java:253-258`: event type, from/to, note, commits, actor string, actor kind, source file.
- vNext now: `db10-audit-findings.draft.ts:46-59`: action, note, fromStatus/toStatus, actorUserId, no agent actor or source.
- Fix: Add actorKind/text, sourceFile, commit payload and generic from/to evidence to history.
