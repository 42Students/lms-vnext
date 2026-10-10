# Contact-flexible identity provisioning

**Owner:** W01 / issue #21  
**Primary consumer:** W05 recruiter invite acceptance

Use `provisionPlatformIdentityWithRuntime(rawInput)` from
`src/modules/people/runtime.ts`.

Accepted input:

```ts
{
  email?: string;
  phoneE164?: string;
  displayName: string;
}
```

At least one of `email` or `phoneE164` is required. Email is normalized
case-insensitively and phone uses the shared E.164 validation.

Return contract:

```ts
{
  userId: string;
  identityUid: string;
  existed: boolean;
  platformStatus: "ACTIVE" | "DISABLED";
}
```

## Collision and lifecycle rules

- The external identity directory resolves by every supplied contact and refuses
  to merge email and phone when they already belong to different identities.
- Firebase uniqueness handles concurrent external identity creation; on a
  conflict the resolver re-reads the winning identity.
- PostgreSQL checks identity UID, phone and case-insensitive email together
  inside one transaction. Unique-index races are retried by re-reading the
  winning row and are accepted only when all supplied contacts still resolve
  to the same canonical user.
- Provisioning may fill a previously missing contact and update display name.
  It never replaces a different existing contact.
- Provisioning **never reactivates** a disabled platform user. Callers must
  explicitly decide whether a disabled account may proceed.
- Firebase and PostgreSQL cannot participate in one distributed ACID
  transaction. The contract therefore uses independent uniqueness guarantees
  plus idempotent retries rather than pretending there is a cross-system 2PC.

This contract provisions only the platform user. Recruiter-company grants,
college consent, membership creation and invite-token consumption remain
separate domain transactions and must not be inferred from identity existence.

Unit and PostgreSQL integration regressions are authored. Until a functioning
runner executes them, they are NOT runtime-verified.
