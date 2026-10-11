# DB-008 — Enforce lesson-content delivery scope at the database boundary

**Chat:** 6 · **Phase:** DATABASE · **State:** staged source-only companion; no executed PostgreSQL acceptance.  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; `LessonContents` persists a `lesson_id`, `course_id` and optional `class_id`.  
**vNext oracle:** `src/db/schema/courses.ts` (`lesson_contents.lesson_id`, optional `delivery_id`).  
**Proposed companion:** `scripts/sql/db05-lesson-content-delivery-scope.draft.sql`.  
**Related:** `scripts/sql/db05-lesson-content-faculty-owner.draft.sql`, `scripts/sql/db05-content-delivery-order-scope.draft.sql`, `scripts/sql/db05-content-order-upstream-reparent.draft.sql`.

## Data-integrity defect

There are two individually valid PostgreSQL foreign keys on the vNext `lesson_contents` table:

- `lesson_contents.lesson_id → course_lessons.id`
- `lesson_contents.delivery_id → course_section_deliveries.id` (optional)

Neither key proves that the delivery serves the **same offering** as the lesson's learning path. They also do not enforce that the offering's **cohort**, **academic period**, and **course/college** match the delivery's section. A direct SQL/seed/bulk insert could associate a lesson from course/college A with a class delivery from course/college B, even if application handlers normally validate matching IDs.

Current vNext `createLessonContent` does compare `delivery.offeringId` to `lesson.offeringId` and requires course/delivery mutation permission. That is necessary but insufficient database protection: the relational invariant must hold for every writer, including raw SQL and future imports.

## Proposed guarded write behavior

`db05_lesson_content_delivery_scope_guard()` executes before INSERT or UPDATE of either `lesson_id` or `delivery_id`. It derives the authoritative owner offering from `course_lessons → course_learning_paths → course_offerings → courses → departments` and compares its college against the offering's `academic_periods.college_id`.

When `delivery_id` is **NULL**, the content is shared at the lesson level; the owning offering/course/period must still agree on college. No faculty-owner identity is required for the generic content case.

When `delivery_id` is set, it additionally requires the delivery's offering, section cohort, section academic period and section college all to match the lesson offering. An invalid match fails `23514`, even if both FK identifiers exist independently.

This guard is distinct from the optional faculty owner guard. Content without an owner still receives complete relational scoping. It shares transaction advisory key **605008003** and READ COMMITTED behavior with the order child/ancestor guards, so a concurrent lesson delivery move and order override insertion cannot bypass one another without waiting for the coordinated lock (subject to actual multi-session verification).

## Critical acceptance matrix for Chat 1 (none executed)

| Candidate database operation | Required outcome |
| --- | --- |
| Shared generic content with valid owning offering/course/period | ACCEPT |
| Delivery-specific content with matching offering, cohort, period, college | ACCEPT |
| Delivery offering mismatches lesson offering | REJECT `23514` |
| Delivery section cohort mismatches offering cohort | REJECT `23514` |
| Delivery section period mismatches offering period | REJECT `23514` |
| Owning course department college mismatches offering period college | REJECT `23514` |
| Delivery section belongs to another college | REJECT `23514` |
| Missing lesson/delivery relation or parent graph | REJECT FK or fail-closed `23514` |
| Update existing content to incompatible delivery | REJECT `23514` |
| Content delivery update vs full order write on two sessions | Cannot commit inconsistent offering/delivery association |
| Content creation while offering or section is reparented | Must be serialized or rejected; upstream guard is not yet implemented for all parent rows |
| Unsupported isolation level | REJECT `25001` pending executed isolation policy proof |
| All valid updates following content/lesson/term and permission checks | ACCEPT |
| Full fresh DB Drizzle journal replay | PASS only after W01 integrates once |

## Explicitly not closed by this SQL

A **child-row guard does not retroactively revalidate rows** when `departments.college_id`, `academic_periods.college_id`, `course_offerings.cohort_id`, `course_learning_paths.offering_id` or `sections.academic_period_id` changes. The separate order ancestry guard protects only graphs with an **order override** attached. Other content, progress, discussions or private receipts can still depend on an ancestor with no order override.

Chat 1 must reconcile broader upstream constraints (including DB02), membership scope and retention policy and run two-session PostgreSQL races. Do not promote the source ledger or enable the runtime feature until those proofs are complete.

This candidate does not add a registered migration, change the schema barrel, modify runtime API permissions, migrate legacy data, or certify any of the 92 DB05 fields. **DB-008 remains IN_PROGRESS**.
