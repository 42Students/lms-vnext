# Authentication forwarded-IP and rate-limit hardening — scoped engineering receipt

**Date:** 2026-11-04
**Branch:** `main`
**Scope:** Authenticated account context is *not* changed. This narrowly covers the unauthenticated login throttling and IP-derived audit/session address boundary.
**Security acceptance:** SOURCE FIX COMMITTED; LOCAL BEHAVIOR SMOKE PASSED; REPOSITORY AND DEPLOYMENT CERTIFICATION PENDING.

## Changes

- `src/auth/ip-rate-limit.ts`: an IP selected from `X-Forwarded-For` must be a valid address; different IPv6 textual spellings normalize to one key before IP throttling or auditing.
- When two or more hops are present, inspect the two trailing positions without first deleting empty entries. An empty or malformed client or proxy hop yields one shared `unknown` rate-limit bucket, not attacker-controlled bucket rotation. Limit forwarded-header work on unauthenticated requests to a 4 KiB input.
- In `NODE_ENV=production`, a lone `X-Forwarded-For` value is not trusted: the documented Google load balancer must append both a client and a proxy hop. Development's one-hop local verification behavior remains intact.
- `tests/unit/auth-ip-rate-limit.test.ts`: adds malformed-chain, IPv6 equivalence, shared unknown-key budget, and production single-hop negative regression checks. The existing 50,000-key saturation regression remains unchanged.
- `.github/workflows/authz-critical-boundary.yml`: includes auth IP-limit test changes in path filters; the existing focused job runs that test when execution is available.

## Changeset receipts

- [Forwarded-hop validation and canonicalization](https://github.com/42Students/lms-vnext/commit/ae7fd85455ed1d6b1dd4f2f1b9ab9a86ff79d709)
- [Malformed-chain and shared-quota regression coverage](https://github.com/42Students/lms-vnext/commit/bf235683908df1abe05ba1040905ef44c58caedb)
- [Production single-hop denial](https://github.com/42Students/lms-vnext/commit/0ccbad4e626c9f06332a6a1f68cd67c34741a5df)
- [Production negative regression test](https://github.com/42Students/lms-vnext/commit/c9484b7f6a2fe5f1e68daae42316f144ac708530)
- [Security workflow trigger coverage](https://github.com/42Students/lms-vnext/commit/cffc5c6a35d26eb396fae984ba0ac547fcef4770)

## Executed evidence and honest limits

A local Node 22 test used a standalone copy of the touched pure TypeScript decision logic and exercised five test groups: trusted second-to-last hop, malformed chains, IPv6 canonicalization, unknown-IP budget sharing, and production single-hop rejection. **5/5 passed locally**. This was **not** `npx vitest run` against a checked-out repository at an exact source revision, nor a PostgreSQL or deployed-edge test.

The GitHub Actions [CI run on the production-guard test commit](https://github.com/42Students/lms-vnext/actions/runs/41832636791) concluded failure with all jobs ending without populated step execution. Its result is **not passing security test evidence**. Confirm the precise infrastructure/billing blocker separately; do not infer a code failure or success from this result.

## Known remaining security boundaries

1. **Trust boundary:** IP-format checks do not prove a hop was inserted by the trusted ingress. A directly reachable app can still receive two syntactically valid attacker-selected addresses. Block direct origin access and establish trusted load-balancer forwarding at deployment; verify sanitized headers and any multiple-proxy variations.
2. **Distributed abuse:** The fast per-IP window is still process-local. Independently validate edge-wide per-IP limits, DB-backed per-contact and verification budgets, multi-replica traffic, unknown-IP abuse, and cost controls.
3. **Validation:** Run `npx vitest run tests/unit/auth-ip-rate-limit.test.ts`, the focused auth workflow, typecheck, and exact-revision security release checks in an approved test environment. Test both legitimate IPv4/IPv6 clients and malformed/spoofed requests through the real ingress.
4. **Rollout:** Confirm that production's `X-Forwarded-For` actually has the documented two appended hops before enabling traffic, otherwise legitimate clients share the coarse unknown bucket.

This work contributes evidence relevant to **SEC-08-015** (endpoint abuse), **SEC-08-017** (Origin/Host/proxy assumptions), and **SEC-17-013** (load-balancer header trust). **SEC-01-011** (distributed rate limits) remains an explicit open requirement. No control is marked VERIFIED or PARTIAL_EVIDENCE based on a code commit or standalone smoke check. The only status authority remains `docs/tracker.json`; update it after an executed exact-SHA repository test run with a valid run URL and independent deployed-config evidence as required.
