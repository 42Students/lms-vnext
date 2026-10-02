# Tenant domain model

Tenant domains map verified DNS hostnames to active vNext colleges.

## Ownership and authorization

- each mapping belongs to exactly one college
- host uniqueness is global and case-insensitive
- management requires the centralized `college.manage` permission for the mapping's stored college
- tenant ownership is resolved server-side; clients cannot move a domain between colleges
- cross-college management is denied

## Host normalization

Configured hosts are stored as lower-case fully-qualified DNS hostnames without a trailing dot, scheme, path, credentials or port.

Examples:

- `College.Example.edu.` -> `college.example.edu`
- `https://college.example.edu` -> rejected as a configuration value
- `localhost` and IP addresses -> rejected

Incoming HTTP `Host` values may contain a port; the resolver strips the port before matching.

## Verification

Creating a mapping generates a cryptographically random verification token.

The college publishes this TXT record:

```text
Name:  _lms-vnext.<host>
Value: lms-vnext-verification=<token>
```

The verification action performs a DNS TXT lookup. A successful exact match marks the mapping verified and clears the stored token. Failed/missing lookups record the latest check result without granting tenant resolution.

The first successfully verified domain for a college becomes primary automatically.

## Primary-domain semantics

- at most one primary domain may exist per college
- a primary domain must be verified
- the database enforces both invariants
- an admin may promote another verified domain to primary
- deleting a primary mapping is allowed and may intentionally leave the college without a primary domain until another is selected

## Request resolution

Host resolution returns a tenant only when:

- the domain mapping is verified
- the college is active
- the parent organization is active

Unverified mappings never route tenant context.

## Deferred decision

Cross-domain authentication/session handoff remains intentionally deferred until the login/UI phase proves it is needed. Domain verification and tenant routing do not require inventing that architecture now.
