# Independent audit brief - central route security (2026-11-07)

Give this file to the reviewer with read access to the repository at commit `4958c315e4` or later. The reviewer must not have seen the author's reasoning. Report findings only; do not edit code.

## What changed (read these first)

- `src/security/route-core.ts`, `route.ts`: the `route()` pipeline. Order: origin (writes) -> duplicate query keys -> authentication -> permission -> step-up -> rate limit -> body -> handler inside the actor's database scope. The resolved actor is offered to the handler (`offerRequestValue`) so a handler that still calls `getCurrentRequestContext()` gets the same actor once.
- `src/modules/permissions/policy.ts`: `requireActorPermission` (permission checked against the actor's own selected scope).
- `src/security/internal-route-core.ts`: machine credential check (min 32, max 256 bytes, no whitespace, constant time).
- `src/lib/bounded-request-json.ts`: replaces every raw `request.json()` (381 call sites).
- `scripts/codemod-shim-wrap.cjs`, `scripts/codemod-route-wrapper.cjs`: how ~1,000 routes were converted. Handler bodies were NOT rewritten by the first script.
- `scripts/security-central-rules.mjs`, `scripts/security/api-method-inventory.mjs`, `docs/security/central-security-baseline.json`: the ratchet and the method census (note `REVIEWED_EVIDENCE_MOVES` and `STEP_UP_EXEMPT`).

## Questions to answer, with file:line evidence

1. **Public routes.** About 60 routes run as `auth: "public"` with `csrf: false` or default origin enforcement (list: `grep -rl 'auth: "public"' src/app/api`). For each: can it be reached without the credential its handler expects? Does any of them touch a user's data without a session check inside the handler? Is the written `publicReason` true?
2. **Wrongly public / wrongly private.** Any route that should require a signed-in user but is public, or a public flow (unsubscribe link, share token, OAuth callback, client error report, college logo) that the central wrapper would now block.
3. **Permission names.** Every `permission: "<name>"` (not `service-enforced`/`actor-owned`): is the name correct for EVERY role that legitimately calls that route? A wrong name locks a role out (this already happened on learner submit routes and was reverted). Also check `can()` for the permission with the actor-scope helper: does any role that the service allows fail the central gate?
4. **Order changes.** `route()` authenticates before the handler validates input. Any route where that change exposes a different information leak (for example 401 vs 404 existence oracle) or breaks an idempotent public call?
5. **Query handling.** `route()` rejects duplicate query keys unless `repeatableQuery` lists them. Any route whose handler reads repeated values (`getAll`) that is not listed?
6. **Step-up.** Routes with `stepUp: true` and the four `STEP_UP_EXEMPT` entries. Anything sensitive missed (secrets, integrations, role/permission changes, user disable/delete, tenant settings, bulk import/export)?
7. **Internal and webhook routes.** The ten `internalRoute()` routes and the bespoke ones that kept their own checks: constant-time compare, Origin rejection, replay handling, behaviour when the secret is unset.
8. **Body limits.** Default 2 MiB, 8 MiB on paths containing import/bulk/upload. Any route that legitimately needs more, or any that should be far smaller?
9. **Tenant scope and RLS.** Routes that use `getDb` directly (52) and run inside `runInScope`: can any query bypass the actor scope? Review migrations 0333, 0334, 0336 and the shared store (0335).
10. **Census and ratchet integrity.** Can a route pass `security:central` or the method census while being unguarded (for example a public wrapper credited as authenticated, an alias that points at an unguarded handler)?

## Output format

For each finding: severity (critical/high/medium/low), file and line, a concrete request that demonstrates it, and the smallest fix. Then a short list of things that were checked and found sound. Do not report style issues.
