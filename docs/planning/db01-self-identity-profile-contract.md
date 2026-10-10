# DB01 self identity profile contract

**Owner:** W01 / issue #21  
**Primary consumer:** W05 / issue #25  
**State:** SOURCE CONTRACT + STAGED PERSISTENCE; NOT ACTIVE / NOT DATABASE-VERIFIED

## Decision

Do not derive first and last name by splitting `users.display_name`.

Legacy recruiter Profile edits First Name and Last Name independently, and the same distinction is useful across Learner/Faculty/other people surfaces. Display-name parsing is lossy for single-name users, initials, multi-part family names and many non-Western naming conventions.

W01 therefore defines these canonical shared user fields:

- `users.given_name varchar(120)`
- `users.family_name varchar(120)`
- `users.identity_profile_version integer NOT NULL DEFAULT 1`

`display_name` remains the presentation/cache form and is derived on a successful canonical-name write. Existing greenfield/dev rows may keep canonical names NULL until edited; there is no production legacy-data migration requirement.

Source contract:

- `src/modules/people/person-name.ts`
- `src/modules/people/identity-profile.staged.ts`
- `docs/planning/sql/db01-person-name-staging.sql`
- `scripts/verify-db01-promotion.mjs`

## Authorization

`identity.self.manage` is a distinct platform permission.

It applies to any ACTIVE platform user, including:

- Super Admin
- College Admin
- TPO
- Learner
- Faculty
- Mentor
- recruiter/HR users without a college membership

It is an **own identity record** permission, not a tenant-resource management permission.

The persisted-actor guard supports `actorLock: "update"`, letting an identity mutation lock and recheck the actual `users` row before saving. A stale session cannot save after platform disable.

## Optimistic concurrency

Every identity-profile mutation uses `identity_profile_version`.

The client supplies the version it read. A successful name write increments it. Competing stale writes fail rather than silently overwriting each other.

## Email decision

Legacy recruiter Profile directly edits Email. vNext will **not** implement that as `UPDATE users SET email=...`.

`users.email` is also a login/identity contact. A DB-only edit could diverge from Firebase Identity Platform and create account takeover/confusion risk.

Required vNext behavior:

1. user requests a new email;
2. Identity Platform verifies/owns the new address and enforces provider uniqueness;
3. only after provider verification is confirmed does vNext reconcile `users.email`;
4. collisions fail closed;
5. the old identity remains usable according to the chosen provider verification/change semantics until the verified switch completes;
6. audit/security event is recorded.

Until this verified provider flow exists, email may be shown read-only rather than pretending parity with an unsafe local write.

This is an explicit security redesign permitted by `AGENTS.md`, not a silent missing feature.

## Provider display-name synchronization

The existing `IdentityDirectory` already exposes `updateUser(uid, { displayName })`. The staged DB adapter intentionally does not make the API active by itself. Activation must coordinate provider display name and PostgreSQL canonical names so they do not silently diverge.

A failed cross-system synchronization must be observable/retryable; Firebase and PostgreSQL do not share an ACID transaction.

## Promotion gate

`npm run db01:promotion:verify` remains `STAGED_READY` while the canonical Drizzle user columns are absent. Once W01 promotes them, the gate requires exactly one matching generated journal entry, SQL migration and snapshot.

Runtime activation still requires:

- generated Drizzle schema/migration/snapshot;
- empty/latest PostgreSQL replay;
- optimistic-write race tests;
- platform-disable race test;
- provider display-name synchronization test;
- verified provider email-change workflow before enabling Email edit;
- CI runner availability.

No source-only test is runtime proof.
