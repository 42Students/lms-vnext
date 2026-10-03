# Privileged authentication policy

This document locks the authentication policy for platform-level privileged access.

## Decision

Production `SUPER_ADMIN` access requires multi-factor authentication.

The initial regular-user login direction remains phone OTP, but phone authentication must not be the only authentication factor for a production `SUPER_ADMIN` identity.

Identity Platform does not support phone authentication itself as an MFA-capable first factor. Therefore the live Identity Platform configuration must provide an MFA-capable first factor for privileged identities before production Super Admin access is enabled.

The exact MFA-capable first factor can be selected when the real project/provider configuration is available. It must support verified ownership and Identity Platform MFA. Do not weaken this requirement to preserve phone-only privileged login.

## Enforcement boundary

When browser authentication is implemented:

1. the browser completes the configured Identity Platform authentication flow
2. the server verifies the resulting ID token
3. the canonical vNext user is resolved from the Identity UID
4. if that user has the `SUPER_ADMIN` system role, the login flow must prove the configured MFA requirement before a privileged server session is accepted
5. the existing server session cookie, revocation checks and centralized authorization remain authoritative after sign-in

Do not encode `SUPER_ADMIN` authorization only in browser state or client-controlled claims. The database-backed vNext system role remains the authorization source of truth.

## Regular college users

Regular `LEARNER`, `FACULTY`, `COLLEGE_ADMIN`, `MENTOR` and `TPO` users may continue with the selected initial phone OTP provider unless product/security requirements later justify another provider.

This policy does not require every college user to use MFA at launch.

## Development/bootstrap

The secure operator bootstrap may create the first privileged identity while the development project is being configured, but public application routes must never self-bootstrap a Super Admin.

A development convenience must not be interpreted as approval for phone-only production Super Admin access.

## Still account-bound

The following remain blocked until the real Identity Platform project exists:

- enabling the MFA-capable first factor
- enabling the chosen second factor
- browser enrollment/challenge UX
- recovery policy for a lost second factor
- test identities and region/provider configuration

Those are implementation/configuration tasks. The production policy decision itself is now fixed.


## Browser E2E authentication harness

Authenticated Playwright coverage uses a deliberately narrow test-only identity harness while the live Identity Platform project remains account-bound.

The harness:

- is unconditionally disabled when `NODE_ENV=production`
- requires `E2E_AUTH_ENABLED=true` plus a secret of at least 32 characters
- receives the secret and test Identity UID only through HttpOnly first-party cookies
- substitutes only the externally verified Identity UID
- still resolves the canonical vNext User, active Membership, roles, tenant and Admin scope from PostgreSQL
- leaves every existing service authorization check authoritative
- uses a fresh random secret in CI rather than committing one

It is not a login endpoint, does not create users or roles, and cannot be used as a production authentication fallback. Live Identity Platform session verification remains the only production path.
