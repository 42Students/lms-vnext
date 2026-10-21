# Independent audit findings synchronization

This is a deployment contract, not a claim that synchronization is active.
The importer reads only 42Students/lms-findings main inbox/ and never accepts
a caller-supplied repository, branch, owner ID, or source path.

## Preconditions

- Register and replay an additive migration implementing the table in
  src/modules/bug-tracker/independent-audit-inbox-ledger-schema.ts, including
  its unique source/path/blob/action attempt index, FK, result checks and
  checked-at indexes. Migration ownership is lane 15.
- Verify registered DB10 audit finding tables and SYNC_AGENT actor schema;
  set DB10_AUDIT_FINDINGS_READY=DB10_VERIFIED and
  DB10_AUDIT_FINDINGS_LEDGER_READY=LEDGER_VERIFIED only after successful
  replay and targeted acceptance checks. Both gates fail closed by default.
- Configure either AUDIT_FINDINGS_GITHUB_APP_ID,
  AUDIT_FINDINGS_GITHUB_INSTALLATION_ID and
  AUDIT_FINDINGS_GITHUB_PRIVATE_KEY (PKCS#8), or a local tightly-scoped
  AUDIT_FINDINGS_GITHUB_TOKEN. The GitHub App must be installed only on the
  findings repository with Contents read. The generated installation token
  requests repository lms-findings with Contents read-only.
- Privileged manual status is GET /api/tracker/audit-findings/sync. Manual
  trigger is POST at the same URL with a same-origin active, unscoped
  Super Admin with persisted platform permission. No sync runs on page load.
- Configure GCP Cloud Scheduler to GET
  /api/internal/audit-findings/sync every five minutes, using the explicit
  five-minute schedule 0/5 * * * * in Asia/Kolkata. Start the initial run
  only after deployment has stabilized for one minute. Supply
  Authorization: Bearer via a managed dedicated secret matching
  AUDIT_FINDINGS_CRON_SECRET. Never put secrets in URLs, git or browser props.
- Competing triggers use a PostgreSQL transaction-scoped exclusive advisory
  lock with a 230-second SQL timeout. Max new files per run is 40; a partial
  run indicates that additional passes are needed. Never widen that limit
  without DB lock, file-size, provider-timeout and transaction review.

## Invariants and acceptance

An accepted immutable file is never re-imported when changed or deleted.
Instead append TAMPERED/DELETED attempts and audit events while retaining the
original finding. A refused file can be retried after its blob changes.
A validated agent fixed update merges nonduplicate commit hashes and only
promotes open, fixable statuses to FIXED_DEV; verified and closed findings are
never reopened automatically.

The provider refuses truncated GitHub trees and blobs over 32KB. Every new
record must pass a strict schema, ID, filename, foreign-reference, sensitive
data and date check. Store only sanitized refusal reasons. A successful run
receipt is written in the same SQL transaction as its imported rows and
events. Provider/read failures publish FAILED if metadata storage is available;
never infer success from an empty board.

Before enabling the gates, replay idempotency, corrected refusals, duplicate
IDs, invalid related IDs, tampering, deletion, truncated tree, concurrent
manual/cron calls, unauthorized user, missing bearer, expired credentials
and rollback-on-error scenarios on a disposable database. Until those checks
pass, the UI must say synchronization is not ready.
