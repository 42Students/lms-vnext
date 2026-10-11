# DB-066 — placement cross-parent relational integrity contract

**Worker:** Chat 3  
**Phase:** DATABASE  
**Date:** 2026-10-12  
**Status:** source/staging complete candidate; not registered or PostgreSQL-verified

## Why this task exists

The current vNext placement services already assume several parent identities agree:

- an application role option belongs to the application's job;
- a round result's application belongs to the round's job;
- a round-reschedule request's round belongs to the request application's job;
- an offer-extension request's offer belongs to that exact application;
- a persisted round exception is the approved schedule override for that exact application, round and reschedule request.

The current Drizzle schema stores these IDs with independent foreign keys. Independent valid UUIDs can therefore be combined by direct SQL into a relationally impossible row even though normal service code rejects the same combination.

DB-066 turns those service assumptions into database invariants without changing product behavior.

## Frozen source observations

### Application → role option

`application-service.ts::resolveApplicationRoleOption` filters `placement_job_role_options` by both option ID and requested job ID. The transactional write re-locks the role and rejects it when `liveRole.jobId !== job.id`.

The database currently stores both `placement_applications.job_id` and `role_option_id`, but the role-option FK proves only that the role exists, not that it belongs to the stored job.

### Round result → application

`result-service.ts::loadApplicationForRound` explicitly rejects when `application.jobId !== round.jobId`.

The database currently stores only independent `round_id` and `application_id` in `placement_round_results`.

### Learner request → round / offer

`request-service.ts::validateRequestTarget` rejects a reschedule when `round.jobId !== application.job.id`, and rejects an offer extension when `offer.applicationId !== application.application.id`.

The database target-shape CHECK correctly controls which nullable target is present, but independent FKs do not prove target ownership.

### Round exception → exact request

A round exception is the materialized schedule override for a `ROUND_RESCHEDULE` request. Its current independent FKs do not prove that the request belongs to the same application+round. The first DB-066 draft also failed to preserve the request type after migration: a parent request could be mutated away from `ROUND_RESCHEDULE` while IDs remained unchanged.

The corrected candidate carries `request_type` as an integrity discriminator on the exception and uses a four-column composite FK to the parent request.

## Proposed relational design

Canonical staged SQL:
`docs/planning/sql/db08-cross-parent-consistency-candidate.sql`

### Parent superkeys

The final registered shape needs these parent keys exactly once:

- `placement_job_role_options(id, job_id)`
- `placement_applications(id, job_id)` — expected from shared DB09 parent-key integration or equivalent
- `placement_job_rounds(id, job_id)` — expected from shared DB09 parent-key integration or equivalent
- `placement_offers(id, application_id)`
- `placement_learner_requests(id, application_id, round_id, request_type)`

Do not register duplicate alternate-order UNIQUE constraints if an equivalent parent key already exists.

### Child constraints

1. `placement_applications(role_option_id, job_id)` → role option `(id, job_id)`.
2. Add canonical `job_id` to `placement_round_results`, then bind both round and application to that same job.
3. Add canonical `job_id` to `placement_learner_requests`; bind application and optional round to that job, and optional offer to the exact application.
4. Add canonical `job_id` and `request_type` to `placement_application_round_exceptions`; bind application and round to one job and bind `(request, application, round, request_type)` exactly.
5. Round exceptions CHECK `request_type = 'ROUND_RESCHEDULE'`.

The duplicated child `job_id` / `request_type` values are integrity discriminators, not independently editable business state. Runtime writers should derive them from canonical parents.

## Migration safety

The candidate deliberately begins with a fail-fast data preflight. Any existing cross-parent row must be reconciled before constraints/backfill are added. For a non-empty live database, W01 must lock or otherwise fence concurrent writers during backfill/constraint registration; a simple UPDATE followed by ALTER is only safe in the current greenfield/disposable case.

DB-066 does not edit `drizzle/**` or `src/db/schema/index.ts`. Chat 1 owns final Drizzle column/FK registration and migration ordering.

## Acceptance witnesses

The authored test contract must prove at least:

1. cross-job role option on an application is rejected;
2. cross-job round/application result is rejected;
3. reschedule request cannot name a round from another job;
4. offer-extension request cannot name an offer from another application;
5. round exception cannot bind an unrelated request/application/round tuple;
6. round exception cannot bind a non-`ROUND_RESCHEDULE` request;
7. parent request type cannot be mutated after an exception references it;
8. application job cannot be reparented while dependent result/request rows exist;
9. role-option job and round job cannot be reparented around existing children;
10. same-job valid rows still succeed;
11. candidate preflight rejects already-corrupt persisted rows before ALTERs;
12. a two-session parent-reparent/child-insert race cannot commit an inconsistent pair.

## Evidence classification

Source inspection and candidate SQL are valid DATABASE-phase evidence. Authored Node/PostgreSQL tests are not execution evidence until their commands actually run against an approved disposable target.

**No DATABASE → API promotion is implied by this task.**
