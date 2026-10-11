# DB05 delivery-specific lesson content ordering — scoped uniqueness

**Task:** DB-008 · **Worker:** Chat 6 · **Global phase:** DATABASE  
**Status:** implementation staged (unregistered SQL + staged Drizzle model + disabled writer). NOT PostgreSQL verified.  
**Source oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (lesson/class content sequence)  
**vNext evidence:** `src/db/schema/lesson-content-order-staged.ts`, `src/modules/courses/lesson-content-order-service.ts`  
**Companions:** `scripts/sql/db05-content-delivery-order-scope.draft.sql` and `scripts/sql/db05-content-delivery-order-unique.draft.sql`  
**Registration:** Chat 1 must fold both into the staged base table migration, after consumer/collision checks.

## Correct uniqueness scope

A delivery (one offering to one section) may contain many course lessons. Each **lesson** legitimately starts at sequence 0. A global `UNIQUE(delivery_id, sequence)` rejects this correct data. The base table's `PRIMARY KEY (lesson_content_id, delivery_id)` only prevents a single content row from having two overrides in one delivery; it **does not prevent two different contents** in that same lesson from sharing position 0.

The requirement is exactly **`UNIQUE(delivery_id, lesson_id, sequence)`**.

Because legacy source content identity is `lesson_contents.id` and the owning lesson is `lesson_contents.lesson_id`, the DB must not trust a client-supplied `lesson_id`. The companion draft:

1. Adds `lesson_id uuid` to `lesson_content_delivery_sequences`.
2. Derives it from `lesson_contents.lesson_id` for any seed rows, then marks it NOT NULL.
3. Adds parent key `UNIQUE(lesson_contents.id, lesson_contents.lesson_id)` solely to support a composite FK (the existing single-column PK remains).
4. Enforces `FOREIGN KEY(lesson_content_id, lesson_id) REFERENCES lesson_contents(id, lesson_id) ON UPDATE RESTRICT ON DELETE CASCADE` to prohibit mismatched witnesses and unsafe content-to-lesson reparenting.
5. Enforces **DEFERRABLE INITIALLY IMMEDIATE** uniqueness on `(delivery_id, lesson_id, sequence)` using a PostgreSQL table constraint; the current full-delete+reinsert writer operates with immediate checking.

The Drizzle staged schema adds a `lessonId` column but deliberately does **not** invent independent FK equivalence. The service writer now inserts the lesson ID from the already-authorized `input.lessonId`, after validating every ordered content belongs to that lesson. `DB05_CONTENT_ORDER_READY` remains required to activate the path. This is not a release toggle flip.

## Executable PostgreSQL acceptance matrix for Chat 1

| Scenario | Expected result |
| --- | --- |
| Lesson A and lesson B, same delivery, both sequence 0 | ACCEPT |
| Two distinct contents of lesson A, same delivery, both sequence 0 | REJECT `23505` |
| Same content+delivery repeated | REJECT original PK `23505` |
| Override has content of lesson A but inserted lesson ID B | REJECT composite FK `23503` |
| Move content to lesson B while order override still references lesson A | REJECT FK `ON UPDATE RESTRICT` |
| Same lesson position across **different deliveries** | ACCEPT |
| Override lesson offering does not equal delivery offering | REJECT separate scope trigger `23514` |
| Content is scoped to delivery X but override points to delivery Y | REJECT separate scope trigger `23514` |
| Correct same-college, cohort and academic-period path | ACCEPT |
| Wrong college/cohort/period on either edge | REJECT separate scope trigger `23514` |
| Reorder all contents transactionally while holding delivery `FOR UPDATE` | ACCEPT, no duplicate positions persisted |
| Two concurrent competing reorders of one delivery | Serialize; no bad committed order |
| Existing seed overrides before DDL | Backfill authoritative `lesson_id`, reject orphan/wrong-parent rows |
| Move learning path to another offering/section after overrides | MUST stay blocked until upstream guard / immutability enforced |

**Additional gate:** canonical draft uses a deferrable PostgreSQL unique constraint, not a plain unique index. Chat 1 must inspect `pg_constraint.condeferrable` and `pg_constraint.condeferred`, the Drizzle SQL export, schema drift, and concurrent reorder behavior. If in-place swaps are introduced, they must explicitly defer the constraint transactionally; the current complete-delete+reinsert writer does not need to defer it.

## Source-level test versus actual executed proof

`tests/db05-content-delivery-order-unique.test.mjs` statically checks witnessed lesson ID, composite FK shape, constraint scope, the writer's inserted lesson ID, and that the independent same-college/offering guard was not replaced. These tests are only **authored** until `node --test` executes against the checked-out exact commit. Static checks are not PostgreSQL proof.

The existing child scope trigger does not guard later upstream moves to a different offering, college, cohort, period, course department, or section. The witness FK only blocks content changing its own `lesson_id`. Chat 1 must register an upstream policy/guard or prove these references immutable. Do **not** mark DB05 ordering as verified because the unique constraint was drafted.

Greenfield only: no legacy data migration or legacy DB connection is required; any backfill in this draft is for *vNext-only* dev/seed rows.

## Cutover sequence

1. Review and reconcile staged base table + lesson witness + scope guard at current `main`, and ensure no conflicting constraint/trigger names.
2. Update the base schema/journal exactly once (Chat 1), preserving composite FK and deferrable uniqueness semantics.
3. Verify the disabled writer inserts `lessonId`, and read path accepts only complete visible order.
4. Run disposable PG integration tests, including malformed raw SQL and concurrent sessions, at a recorded SHA.
5. Run Node tests, typecheck, and relevant service tests from an independently available runner; GitHub Actions billing is **not** a prerequisite.
6. Accept the DB05 readiness gate only with actual evidence, never with a source-only claim.
