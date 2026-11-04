# 2026-11-04 — Academic program JSON request boundary

**Repository:** `42Students/lms-vnext` — `main`  
**Scope:** academic program mutation APIs, including the historical v1 compatibility alias  
**Status:** Code and negative/positive tests committed. **CI result and production verification NOT yet observed.** This is implementation evidence, not security-program certification.

## Changes committed

- [`f0d0469`](https://github.com/42Students/lms-vnext/commit/f0d046976aa90d60637e50da6312b3729a072a15): canonical `POST /api/academics/programs` parses no more than 16,384 UTF-8 bytes.
- [`b6a81a7`](https://github.com/42Students/lms-vnext/commit/b6a81a78c7f6f762d242dd8f2525d5f8c0df5da6): canonical `PATCH` and `DELETE /api/academics/programs/[programId]` use the same cap before mutation.
- [`835916b`](https://github.com/42Students/lms-vnext/commit/835916ba6db2cf1cbeb3499fb41d1507ac0f6d0a): legacy `PUT /api/v1/new-program/update/[programId]` uses the same cap. The historical `/api/v1/program` re-export shares this behavior.
- [`0004b47`](https://github.com/42Students/lms-vnext/commit/0004b47b8323735403de4a1b54be3fcd379e3ddd): nine Vitest checks authored in `tests/unit/security-academic-program-bounded-body.test.ts`.
- [`b4d0110`](https://github.com/42Students/lms-vnext/commit/b4d01101d32791fe4edfd753d25eafc340d3c676): dedicated push/PR workflow with exact-source SHA assertion, scoped Vitest and full TypeScript typecheck.

All routes reuse the existing shared `src/lib/bounded-json-body.ts` parser. No redundant body-reading utility was introduced. The parser counts actual streamed bytes, not caller-supplied `Content-Length`. Oversize JSON receives HTTP 413; malformed JSON/UTF-8 receives 400. These rejects return no-store responses and do not invoke program mutations. Existing origin validation, authenticated context, college resource ancestry, and service-layer permission checks were left intact.

## Authored adversarial regression cases

- A forged small `Content-Length` must not bypass the byte limit.
- Malformed JSON is rejected without a server error.
- Oversized program create, update, archive and legacy update are rejected before mutation.
- Ordinary, valid authorized create/update/archive requests still reach the original service.
- Cross-site origin rejection precedes context or mutation work.

## Verification limitations and handoff

The nine tests were **authored and committed but not executed in this connector session**; the workflow was committed, but its run/conclusion was not available here. Do not mark them passing in `docs/tracker.json` before collecting an actual exact-SHA CI receipt. Production PostgreSQL RLS, restricted roles, college-isolation regression, CSRF ingress configuration, per-route rate limits, and all other HTTP methods remain separate security assurance work.

Suggested next action for the security orchestrator: verify the `Security - academic program JSON boundaries` workflow conclusion for `b4d0110` or a later descendant, fix any failures without weakening assertions, and attach the verified run URL to the appropriate **existing** entries in the canonical `docs/tracker.json` security object. Avoid editing the shared security tracker in parallel with other lanes.
