# DB01 membership suspension persistence — source-backed shape guard

**Worker Chat 2 / DB-004 / DATABASE phase.** Status: **STAGING ONLY — UNREGISTERED, NO POSTGRES PROOF**.

## Why this exists

- `src/modules/identity/constants.ts` defines membership states `ACTIVE`, `SUSPENDED`, `ENDED`.
- `src/modules/people/membership-domain.ts` produces:
  - `SUSPEND` with a timestamp and nonblank reason;
  - `REACTIVATE` with status `ACTIVE`, both suspension metadata fields cleared;
  - `END` with status `ENDED`, both suspension metadata fields cleared.
- `src/modules/people/validation.ts` trims and limits suspension reasons to 1–1000 characters.
- `src/db/schema/memberships.ts` currently has nullable `suspended_at` and `suspension_reason` but **no persisted state/metadata CHECK**. SQL inserts or future services can create a `SUSPENDED` row without a timestamp/reason or an `ACTIVE` row with stale suspension metadata.

The proposal in `docs/planning/sql/db01-membership-suspension-state-staging.sql`
enforces the existing **vNext producer shape** without changing API behavior.
It is a greenfield strengthening candidate, not a claim of exact legacy
schema design. Chat 1 owns integration into live Drizzle/schema and migration.

## Security and product decisions

- Bad DB lifecycle state must fail closed rather than accidentally make a
  suspended actor appear active; `resolveRequestContext` already requires an
  `ACTIVE` membership for selected membership access, but persisted
  representation should also be internally consistent.
- Suspension reason is personal/disciplinary data: preserve role-scoped reads,
  redaction, and bounded retention.
- This CHECK **does not prevent** `ENDED -> ACTIVE` by a privileged SQL writer,
  because CHECKs examine only the final row. The current application domain
  treats ENDED as terminal; whether an alumnus can rejoin the same college
  under the unique `user_id,college_id` membership identity requires a
  separate product decision. Do not ship a trigger that makes reenrollment
  impossible without resolving that decision.
- A historical membership-lifecycle event journal may be a separate DB
  requirement; one row's latest status is not a full audit trail.
- `SUSPEND`, `REACTIVATE`, `END` must be tested against persisted
  authorization/revocation and concurrent role edits, not inferred from
  a static CHECK alone.

## Required PostgreSQL acceptance (NOT EXECUTED)

Test `23514` for SUSPENDED-without-time, SUSPENDED-with-empty/blank/oversize
reason, ACTIVE with lingering timestamp/reason, and ENDED with lingering
metadata. Test valid create/suspend/reactivate/end, cross-college independence
for the same user, and rejection of selected suspended/ended memberships.
Verify the Drizzle snapshot, clean and incremental migration replay and
the existing `college_memberships_user_college_uq` ownership invariant.

**No registered schema or numbered migration changed.** This is not a
DONE_VERIFIED DB01 field, not a PostgreSQL result, and not a reason to move the
global phase beyond DATABASE.
