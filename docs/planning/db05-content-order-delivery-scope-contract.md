# DB-008 — class-specific lesson-content ordering: database scope

**Status:** source-only companion; NOT REGISTERED / NOT EXECUTED.  
**Owner:** Chat 6, DATABASE. **Integrator:** Chat 1.  
**Base W02 candidate:** `docs/planning/sql/db05-lesson-content-delivery-order-candidate.sql`.  
**New companion:** `scripts/sql/db05-content-delivery-order-scope.draft.sql`.  
**Source:** `src/db/schema/lesson-content-order-staged.ts`, `src/modules/courses/lesson-content-order-service.ts`, `src/modules/courses/delivery-service.ts`, `src/db/schema/courses.ts`, `src/db/schema/academics.ts`. No production table or application behavior changed.

## Source-confirmed service rules

- The writer `updateDeliveryLessonContentOrder` checks that the requested lesson's `offeringId` equals the delivery's `offeringId`, requires authorized delivery mutation and locks the delivery row `FOR UPDATE` for a transactionally complete reorder.
- Only lesson content from that lesson, not `ARCHIVED`, and either shared (`lesson_contents.delivery_id IS NULL`) or owned by the target delivery is eligible.
- The delivery service only permits an offering/section pairing with matching college, cohort and academic period.
- The `lesson_content_delivery_sequences` staged table currently has separate FKs to content and delivery, primary key `(lesson_content_id,delivery_id)` and a nonunique index `(delivery_id,sequence)`. These don't enforce the service's cross-table scope when SQL bypasses the service.

## Candidate database guard

The SQL companion checks the content's `course_lessons → course_learning_paths → course_offerings` path against the delivery's `course_section_deliveries → sections` path. It rejects independent-FK rows where:

1. the owning offering differs;
2. content is delivery-specific but the target delivery differs;
3. the course department, offering academic period and delivery section period disagree on college;
4. offering and section cohort or academic period differ; or
5. the lesson content is already archived.

An override for shared content can be valid in multiple deliveries of its *same offering*; a delivery-specific content record can only be overridden for its own delivery. Application role/access checks remain required separately.

## Unresolved database contract: uniqueness of visible sequence within one lesson

A nonunique `(delivery_id,sequence)` index is **not enough**. Reordering two distinct lessons within one delivery can legitimately assign each its first content sequence `0`. Therefore making `(delivery_id, sequence)` unique would be WRONG. But two distinct content records **of the same lesson** should not share sequence in one delivery. The current table does not persist `lesson_id`, so PostgreSQL cannot directly declare `UNIQUE(delivery_id,lesson_id,sequence)`.

Before promoting, decide whether to persist `lesson_id` with a composite content→lesson identity FK plus a partial/standard unique index, or another transactionally safe DB solution. Source writer's full-order transaction and delivery `FOR UPDATE` helps only service callers, not direct/bulk SQL.

## Required negative acceptance

- Same offering, period, cohort and college: shared content override succeeds for different valid deliveries.
- Delivery-specific content: only its own delivery may be used. Cross-offering/different-college/different-period/different-cohort rows must raise the intended database constraint error.
- Archived content must not gain an override; legitimate reordering after status transitions should preserve/cleanup history according to agreed retention rules.
- Concurrent reorder of one lesson/delivery: accepted sequences remain unique, complete and deterministic; race-safe validation must cover direct SQL and service writers.
- Changing a lesson's learning path, a content's lesson/delivery, an offering/section's cohort/period, or a department/academic period's college must not turn existing rows cross-tenant. A child-only INSERT/UPDATE trigger **does not** protect later upstream changes.
- Test a fresh PostgreSQL replay, rollback, constraint/index names, snapshot drift, and API/browser order readbacks on exact SHAs.

**No Node/PostgreSQL/CI acceptance was executed for this authored proposal. No source field was marked verified.**
