# DB01 tenant-domain DNS diagnostics contract

**Task:** DB-004 · **Worker:** Chat 2 · **State:** staged only, not runtime-active

Legacy tenant-domain verification persists the most recent DNS TXT values into `tenant_domain.last_found_values` and bounds the joined diagnostic string to **500 characters**. vNext already stores `last_check_result` and `last_checked_at`, but the active Drizzle schema has no equivalent diagnostic field.

The staged contract in `docs/planning/sql/db01-tenant-domain-diagnostics-staging.sql` adds only `tenant_domains.last_found_values varchar(500)`. It deliberately does **not** change `is_verified`, `verification_token`, host uniqueness, primary-domain rules, or tenant authorization behavior. The value is untrusted operational metadata: admin-scoped, bounded, and never an authorization signal.

Promotion requires Chat 1 to register the final Drizzle migration and schema change, then execute clean PostgreSQL replay plus lifecycle tests. Required behavior includes preserving an already verified domain on a failed recheck unless the explicit lifecycle says otherwise, invalidating proof when the host changes, rejecting unverified hosts during resolution, and preventing diagnostics from leaking into public tenant bootstrap.

**Evidence status:** source-backed staging only. PostgreSQL replay and runtime lifecycle verification are still required before DB-004 can be completed or marked DONE_VERIFIED.
