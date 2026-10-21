# Inbound mail migration and provider cutover — lane chat-5

This is a cutover plan, not an assertion that historical mail was migrated. The vNext `drizzle/0068_inbound_mail_messages.sql` schema is separate from the old MySQL `V225__inbound_mail_inbox.sql` ALTER. No data migration is assumed for deployments that have no active old-LMS users.

## Source and destination contract
- Freeze a source inventory (old `inbound_email` table and provider payload IDs) with count, date window, tenant/recipient routing, triage status, subject/body sizes, duplicate provider IDs and retention/deletion flags. Do not infer unknown columns.
- Destination `inbound_mail_messages` has UUID id, unique `source_message_id`, optional validated college UUID, from/to addresses, subject, plain body, NEW/TRIAGED/RESOLVED status, received_at timestamptz and nonnegative version. Destination has received-at and college/status indexes.
- Define a reviewed and deterministic legacy-status map. Unmapped routing/outbound-posted outcomes must be preserved in a protected migration ledger, not relabelled as RESOLVED. Unknown college/organization must stay unmapped until verified; never write a guessed tenant UUID. Legacy numeric identifiers require an approved crosswalk.
- The existing Super Admin inbox is global-only; do not make migrated private messages visible from college or organization role scopes.

## Import rehearsal and verification
- Perform a read-only source export over a bounded date range with a stable watermark and record an immutable export digest in a private operator log. Treat message content and addresses as sensitive; encrypt in transit and at rest and minimize retention.
- Dry-run destination validation, length constraints, timestamp conversion, unique source keys and foreign-key college references in isolated staging. Report rejected rows by stable ID and reason without exposing full email bodies.
- Import with idempotent upsert keyed on verified provider source ID; on duplicate IDs whose content differs, quarantine rather than overwrite. Import in bounded batches, record counts, checksums and rerunnable checkpoints. Never mark a batch complete before DB commit.
- Compare source/export/import counts for unique message keys, status totals, date buckets, earliest/latest receivedAt, mapped tenants and quarantined rows. Manually sample sanitized records after comparing hashed data; require owner sign-off for deletions/PII handling.

## Signed provider transition
- Inventory the existing inbound-mail webhook provider, canonical endpoint, payload semantics and signature scheme before rotating DNS or webhook routing.
- Deploy signature verification, bounded timestamp tolerance, replay-id dedupe and raw-body integrity checks before enabling live writes. Reject unsigned/invalid or wrong-destination requests and keep request logs PII-safe.
- Run a restricted shadow receive period with no duplicate user-facing action. Choose one writer per source message ID; roll provider routing atomically with controlled failback.
- Monitor verified accepted/rejected webhook counts, duplicate rates, routing/unmapped failures, queue latency and audited triage transitions; require observed nonzero signed events and verified inbox display before declaring cutover.
- Rollback returns provider routing to the old verified sink, pauses new writer and retains already committed import rows for reconciliation. Do not delete imported messages to achieve rollback.

## Release gates
- Database migration registered/deployed and independently verified; provider signature verification tested with valid, invalid and replayed payloads; authorized global-only reads; idempotent backfill verified; tenant mapping reviewed; recovery procedure rehearsed; owner signs off. None of these gates is claimed complete by this plan.
