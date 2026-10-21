# Work packet (wave 3): edit src/db/schema/db10-audit-findings.draft.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-014  [P1] MISSING  facet F04  effort L
- Legacy: `AuditFindingService.java:65-75`: items include reportedSeverity, roles, environment and duplicateOf; original severity retained.
- vNext now: `independent-audit-findings-service.ts:50-64`; `db10-audit-findings.draft.ts:9-35`: environment, roles and reportedSeverity absent from new record.
- Fix: Add fields to registered migration, Drizzle schema and import mapper; present in table/detail.

## G2-16-001-038  [P1] MISSING  facet F10  effort L
- Legacy: `AuditFindingSyncService.java:102-110,217-238`: track changed/deleted imported files; agent update may mark fixed and link commits.
- vNext now: `db10-audit-findings.draft.ts:9-67`: no file ledger, importer/agent events or update pipeline.
- Fix: Create audit_finding_file ledger and safe import/update transactions retaining tamper history.

## G2-16-001-062  [P1] MISSING  facet F20  effort L
- Legacy: `AuditFindingSyncService.java:74-110`: one-file idempotence by path/blob SHA, skip unchanged, reject changed accepted files.
- vNext now: `db10-audit-findings.draft.ts:61-67`: sync summary only, no file hash ledger.
- Fix: Persist exact source blob SHA and processing result; handle retries and tamper/deletion under transactions.

## G2-16-001-068  [P1] MISSING  facet F22  effort L
- Legacy: `AuditFindingSyncService.java:91-110,266-284`: `audit_finding_file` path, blob_sha, result, errors, record_id, checked time, run metadata.
- vNext now: `db10-audit-findings.draft.ts:46-67`: events and sync metadata but no file ledger.
- Fix: Add immutable file ledger schema, indexes and importer-safe dedupe/tamper constraints.
