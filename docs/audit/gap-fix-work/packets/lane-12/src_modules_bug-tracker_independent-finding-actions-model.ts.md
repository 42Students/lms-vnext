# Work packet: edit src/modules/bug-tracker/independent-finding-actions-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-027  [P1] GAP  facet F07  effort M
- Legacy: `AuditFindingService.java:133-147,155-188`: exact server messages for unknown status, duplicate, same value, reason, assignee length, SHA.
- vNext now: `independent-finding-actions-model.ts:4-15`; `independent-finding-actions.tsx:39-54`: generic friendly error, 4-char reason, strict UUID.
- Fix: Map per-case validation to legacy wording while retaining conflict/version handling; show API reason field to user.

## G2-16-001-043  [P1] GAP  facet F12  effort S
- Legacy: `AuditFindingService.java:165-170`: free-form assignee max 100 or blank to clear.
- vNext now: `independent-finding-actions-model.ts:10-12`; `independent-finding-actions.tsx:75-76`: 2-150 nonempty or null.
- Fix: Support legacy one-character names up to 100; permit clearing to null.

## G2-16-001-044  [P1] GAP  facet F12  effort S
- Legacy: `AuditFindingService.java:184-193`; `auditFindingsModel.js:31`: repo enum `lms`, `lms2-fe`, `both`, `infra`, `other`, lowercase SHA.
- vNext now: `independent-finding-actions-model.ts:13`; `independent-finding-actions.tsx:22,86-90`: full `42Students/...` repo string, SHA case-insensitive.
- Fix: Restore repo dropdown enum, default `lms2-fe`, and lowercase SHA rule for old data.
