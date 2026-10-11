# DB-057 — Recruiter notification read watermark integrity

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Global phase:** DATABASE  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Active legacy contract

The final recruiter-era table `recruiter_notification_read` stores one row per recruiter + college with a single `read_through` timestamp.

The live legacy `RecruiterNotificationService` treats this value as a **watermark**:

- first visit reads from a bounded historical default;
- `markAllRead` upserts `read_through = NOW()`;
- feed items are new only when their timestamp is after the watermark;
- the value is scoped to exactly one recruiter and one college.

Therefore this is not arbitrary editable timestamp state.

## Gap

The staged vNext table already has the correct primary key and a grant-scope trigger, but the prior trigger allowed direct SQL to:

1. set `read_through` far into the future, suppressing future notifications indefinitely;
2. move the watermark backward, making previously-read items unread again;
3. rewrite the recruiter/college key to a different active grant.

Those transitions are outside the source producer contract.

## Staged correction

`db09_assert_recruiter_read_scope` now also:

- rejects `read_through > statement_timestamp()`;
- rejects UPDATE that changes recruiter or college identity;
- rejects UPDATE where the new watermark is less than the old watermark;
- runs for every INSERT/UPDATE, not only key-column updates.

The existing active recruiter-grant check remains mandatory.

## Required PostgreSQL witnesses after registration

- valid ACTIVE recruiter/college insert at database-now succeeds;
- inactive/revoked/wrong-college recruiter fails;
- future watermark fails;
- backward update fails;
- same-value idempotent update succeeds;
- forward update to current database time succeeds;
- recruiter/college identity rewrite fails even if the destination grant is active;
- concurrent mark-all-read updates converge to a nondecreasing value.

**Gate:** staged/source implementation only. No migration registration, Node test, PostgreSQL execution or runtime/API certification is claimed by DB-057.
