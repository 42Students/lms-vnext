# Academic API body and selector hardening — 2026-11-04

**Repository:** `42Students/lms-vnext` / `main`  
**Owner/lane:** separate academic API input-boundary hardening; do not claim this closes another security lane's RBAC, RLS, or secret work.  
**Current proof level:** **SOURCE COMMITTED + TESTS AUTHORED + CI WORKFLOW CONFIGURED. PASSING CI NOT YET CONFIRMED.** This file is not the live tracker or production certification.

## Implemented defense: 19 academic write methods

All listed routes now parse JSON using the existing shared `readBoundedJsonBody(request, 16_384)` before the relevant academic mutation service. This enforces a hard **16 KiB actual incoming UTF-8 byte limit**, not a trust in `Content-Length`. Oversized payloads return 413, malformed JSON/UTF-8 returns 400, with `private, no-store` on new reject responses. The previous origin guard, authenticated context and domain service authorization were retained; they are not newly proved by this refactor.

**Prior implementation in this lane (4 methods):**
- `POST /api/academics/programs`
- `PATCH /api/academics/programs/[programId]`
- `DELETE /api/academics/programs/[programId]`
- `PUT /api/v1/new-program/update/[programId]` (and the existing `/api/v1/program` re-export)

**New collection/service-write implementation (9 methods):**
- `POST /api/academics/periods`
- `POST /api/academics/cohorts`
- `POST /api/academics/enrollments`
- `POST /api/academics/sections` (preserves typed `SELECT` event)
- `POST /api/academics/semesters`
- `POST /api/academics/elective-slots`
- `POST /api/academics/schedule-events` (preserves `classId` compatibility translation)
- `POST /api/academics/search/batches`
- `POST /api/v1/class/create`

**New detail/transition implementation (6 methods):**
- `PATCH /api/academics/periods/[periodId]` (update vs lifecycle transition)
- `PATCH /api/academics/cohorts/[cohortId]` (update vs lifecycle transition)
- `PATCH /api/academics/sections/[sectionId]`
- `PATCH /api/academics/enrollments/[enrollmentId]`
- `POST /api/academics/section-enrollments` (section assignment)
- `PUT /api/v1/class/update/[sectionId]`

The *bodyless* section-archive DELETE was deliberately not given a body parser. No approval policy, RBAC role matrix, resource relationship, transaction, database privilege, or RLS rule was changed in this slice.

## Implemented defense: 6 academic GET methods reject ambiguous query scopes

- `GET /api/academics/periods`: reject duplicate `collegeId`.
- `GET /api/academics/cohorts`: reject duplicate `programId`.
- `GET /api/academics/enrollments`: reject duplicate `programId` or `cohortId`.
- `GET /api/academics/schedule-events`: reject duplicate `sectionId` or `classId`, retaining the existing incompatible-alias rejection.
- `GET /api/academics/search/batches`: reject duplicate query keys before `Object.fromEntries` can collapse them.
- `GET /api/academics/section-enrollments`: reject repeated `sectionId` / `learnerEnrollmentId` and the ambiguous request presenting both roster and learner-history selectors.

These are *request-shape* guarantees. They do not replace persisted college/resource entitlement checks.

## Authored regression suites and enforcement

| Test file | Authored test cases | Focus |
|---|---:|---|
| `tests/unit/security-academic-program-bounded-body.test.ts` | 9 | Program create/update/archive and v1 adapter, oversize, malformed, CSRF and positive paths |
| `tests/unit/security-academic-collection-bounded-body.test.ts` | 38 | Nine collection writes, forged `Content-Length`, invalid UTF-8, SELECT compatibility, positive and negative paths |
| `tests/unit/security-academic-query-ambiguity.test.ts` | 10 | Five GET endpoints, conflicting query args vs valid single selectors |
| `tests/unit/security-academic-detail-bounded-body.test.ts` | 31 | Six detail writes, positive lifecycle routing, ambiguous roster/history GET rejection |
| **Total authored** | **88** | **Not yet equivalent to 88 passing tests** |

The dedicated workflow `.github/workflows/security-academic-program-json.yml` is now named **Security - academic API input boundaries**, watches `src/app/api/academics/**`, the relevant legacy class/program adapters, both shared body parsers, all four suites and its own workflow file. It installs dependencies, asserts the exact `GITHUB_SHA`, executes the four Vitest suites, and runs full TypeScript typecheck. The latest workflow-update commit for this slice is [`e3df6af`](https://github.com/42Students/lms-vnext/commit/e3df6af46d6a1bbf011d85bdd7b1e265247d8697).

Important later commits in this slice include [`d6c6887`](https://github.com/42Students/lms-vnext/commit/d6c6887821f8f0616d32d41de9e94b1062482f71) (detail route tests), [`8181838`](https://github.com/42Students/lms-vnext/commit/81818383aa38c567d2e81abe639d5ed8497b04e7) (query ambiguity tests), and [`556823c`](https://github.com/42Students/lms-vnext/commit/556823c60c9e144b319ae254e0e073594b42112e) (section roster selector hardening).

## Control linkage and release limitations

**Relevant programme requirements:** `SEC-08-013` (maximum request body sizes), `SEC-08-011` (bounded validated inputs, partial), `SEC-08-021` (less-obvious autocomplete/roster endpoints, partial), `SEC-08-024` (sensitive method negative tests, partial). Existing origin checks are preserved; do not mistake that for newly proved `SEC-08-016` CSRF deployment behavior.

**Not verified here:** full exact-SHA passing CI, real PostgreSQL permission/RLS or tenant isolation, authenticated browser/network tests, all other API routes, throughput/pagination/rate limits, edge reverse-proxy body limits, penetration testing, production settings, or complete controls in the 493-ID security catalogue.

**Handoff to security orchestrator:**
1. Observe a full successful *exact-SHA* workflow for **Security - academic API input boundaries**; debug failures without removing the positive or negative assertions. If CI is blocked by Actions billing/installation, preserve an explicit `BLOCKED` evidence status rather than reporting pass.
2. On verified success, link the run and exact SHA in the existing canonical `docs/tracker.json -> security.controls` entries, respecting concurrent writers. Do not create a second live tracker.
3. Continue a method-level API census for remaining unbounded JSON, query ambiguity and object-level authorization, and test with restricted runtime PostgreSQL roles before high-assurance release.
