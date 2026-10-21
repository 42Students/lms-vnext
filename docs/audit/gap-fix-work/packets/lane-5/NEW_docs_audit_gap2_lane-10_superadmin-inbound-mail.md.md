# Work packet: NEW / MISSING items from docs/audit/gap2/lane-10/superadmin-inbound-mail.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md

## G2-10-009-120  [P1] GAP  facet F22  effort L
- Legacy: `drizzle/0068_inbound_mail_messages.sql:1-19` registered PG 0068 schema includes source unique/check/index
- vNext now: `docs/legacy-source/backend/src/main/resources/db/migration/V225__inbound_mail_inbox.sql:4-12` legacy MySQL ALTER existing inbound_email; no automatic migration in file
- Fix: Plan import and signed provider cutover, not just schema table creation
