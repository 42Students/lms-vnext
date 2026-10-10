# DB-008 — lesson-content points/deadlines versus assignment grading

**Worker:** Chat 6 · **Phase:** DATABASE · **Status:** source reconciliation only, unresolved.  
**Legacy BE:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (`prod-2026` inspected).  
**vNext:** `42Students/lms-vnext` at branch snapshot on 2026-10-11.  
**Canonical ledger:** `docs/planning/db05-chat06-source-semantic-review.json`.  
**No new migration or API changes in this review.**

## Why direct field-name matching would lose behavior

| Legacy persisted contract | Source evidence | Current vNext candidate | Still unproven |
| --- | --- | --- | --- |
| `lesson_contents.points` | Java entity `long points`. DTO `long points` with `@Min(0)`. Create and update normalize negative to zero, **zero valid**. | `course_assignments.max_points` is PostgreSQL `integer NOT NULL` with **1..10000** check. | Field scope, type/range, zero handling, how an assignment relates to the original content ID and order. |
| `lesson_contents.deadline` | Entity/DTO use `LocalDateTime`, nullable; no explicit zone. `LessonContentsServiceImpl.createLessonContent` applies `clearDeadline=true` or a non-null deadline. | `course_assignments.due_at` is `timestamptz` and `lesson_contents.ends_at` represents a live-class schedule. | Source timezone, due-date vs visibility cutoff, whether content is an assignment and update semantics. |
| `content_data.dueDate` | `ContentDataDTO.java` has a separate **String dueDate** field inside heterogeneous `content_data` JSON. | No proven corresponding per-content dueDate raw field. | Is this a user-facing scheduled due date or obsolete display field? Which producer and consumer owns precedence? |
| `lesson_contents.course_name` | Create `setCourseName(fetchCourse(courseId).getCourseName())` saves a snapshot; some read paths `populateCourseAndLessonNames` replace it from current course name. | vNext resolves a course name through normalized relationships. | Read endpoint-by-endpoint: preserved snapshot vs current-name projection; neither blanket rule is safe. |

## High-impact source-path finding: deadline edits

The legacy `LessonContentsDTO` explicitly defines `clearDeadline` because a null `deadline` is treated as absent, not a request to clear. In `LessonContentsServiceImpl` **create** path lines 469–475, this flag is applied. The separately inspected `updateLessonContent` method lines 770–981 updates many fields but does **not** reference `getDeadline()` or `getClearDeadline()`. This indicates a likely create/update behavior mismatch; treat it as a **source-observed gap**, not evidence that the live endpoint successfully supports clearing a deadline.

vNext `updateCourseAssignment` builds `dueAt` only when input is not `undefined`; a supplied explicit `null` clears it. Thus vNext's assignment edit contract is different in two ways: it acts on a distinct assignment entity and accepts a null-clear operation. The later API wave must decide and test the intended observable parity, documenting intentional fixes rather than silently treating these as equal.

## Required normalized-data decisions before migration registration

1. **Entity identity.** Is a legacy assignment-type lesson-content represented by `course_assignments`, a separate content row, or a stable association? A conversion must preserve order, content ID references, progress and class-specific ownership, not just title/points.
2. **Zero and large values.** Current `course_assignments.max_points` excludes zero and values >10000; legacy `long points` allows zero and can represent larger nonnegative values. Decide if these fields really denote the same business quantity. Do not blindly clamp to 1..10000.
3. **Time zone.** `LocalDateTime` has no offset; a `timestamptz` value cannot be derived without an explicit origin zone and DST policy. Never assume UTC or Asia/Kolkata solely from deployment region.
4. **Deadline precedence.** Decide if entity `deadline`, nested JSON `dueDate`, and `course_assignments.due_at` are alternatives, distinct concepts or an inconsistent legacy pair. Check all producers and UI readers first.
5. **Creation/edit.** Preserve an absent field as no-op; handle an explicit clear only under an agreed contract. Test create, edit, clear, re-edit, publication, late submission, clock-boundary behavior and cross-college authorizations.
6. **Course name.** Saved `course_name` must be interpreted in context of the endpoint. An entity-level snapshot exists, but some reads refresh from the current canonical course name.
7. **Grading vs availability.** `lesson_contents.starts_at/ends_at` is a live class schedule and must not silently become an assignment submission deadline.

## Gate matrix for Chat 1 and later phases

| Gate | State |
| --- | --- |
| Java entity/DTO and create/update source inspected | SOURCE CHECKED |
| Assignment grading schema and update code inspected | SOURCE CHECKED |
| All corresponding DB05 rows mapped to a proven normalized representation | OPEN |
| Active FE read/write endpoints and assignment/content identity reconciled | OPEN |
| Timezone, zero-points, deadline-clear policy approved and tested | OPEN |
| Disposable PostgreSQL structural and negative tests executed | NOT RUN |
| Integration/unit/browser tests executed on an exact commit | NOT RUN |
| Migration registered by Chat 1 | NOT REGISTERED |

**No field was marked VERIFIED, no numbered migration was added, and DB-008 remains IN_PROGRESS.**
