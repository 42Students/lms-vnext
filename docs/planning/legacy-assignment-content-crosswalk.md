# Legacy lesson-content assignments → vNext assignment curriculum crosswalk

Verification reference: G2-13-027-042. This is an import/validation contract, not a claim that a database migration has run. The current vNext editor intentionally stores assignments in `course_assignments` while other lesson media live in `lesson_contents`.

## Required identity and curriculum joins

| Old LMS `LessonContentsDTO` / source | vNext authoritative target | Constraint |
| --- | --- | --- |
| `lessonContentId` (integer) | `course_assignments.legacy_lesson_content_id` | Unique and nullable on native rows; never cast an old integer to UUID |
| `lessonId` (integer) | `course_assignments.lesson_id` → `course_lessons` | Resolve through a tenant-scoped legacy lesson map, not a bare numeric identifier |
| `courseId` / `courseSlug` | `course_lessons.learning_path_id` → `course_learning_paths.offering_id` → `course_offerings.course_id` | Verify that resolved legacy course and lesson belong to the same current offering |
| `classId` (optional integer) | `course_assignments.delivery_id` → `course_section_deliveries` | Null stays shared; a class maps only after its section, cohort, academic period and course offering have all been verified |
| `contentTitle` | `course_assignments.title` | Keep exact saved text; reject active same-lesson / same-delivery case-insensitive duplicates rather than overwrite |
| `sequence` | `course_assignments.sequence` | Preserve source integer when collision-free; record a deterministic within-lesson reorder when not |
| `points` | `course_assignments.max_points` | Validate integer range 0–10000; quarantine lossful conversions |
| `deadline` (LocalDateTime) | `course_assignments.due_at` (timestamptz) | Resolve with documented source campus timezone; do not assume UTC |
| `contentDataDTO`, including HTML/files/instructions | `description`, `course_assignment_resources`, and authorized file references | Sanitize rich text, verify file ownership and scan status before making resources available |
| `active`, `enabled` | Assignment publication/lifecycle policy | Do not equate a missing flag with published; retain source provenance and disclose unmapped states |

Legacy `contentType=ASSIGNMENT` routes to `/api/courses/assignments`, **not** generic `/api/courses/lesson-contents`. The latter remains the authority for RESOURCE, VIDEO, YOUTUBE and LIVE_CLASS. Do not insert the same historical assignment into both tables.

## Mixed lesson order and import gates

1. Build the offering and learning path, then resolve the lesson's own numeric identity and sequence. Establish each section delivery from the same offering and the historical class; do not infer a delivery from a same-college class alone.
2. Read **all** original lesson contents for each lesson (assignments and nonassignments), sorted by historical sequence followed by numeric `lessonContentId`. A duplicate sequence cannot silently drop an item.
3. Assign the corresponding vNext row its crosswalk ID. Store an ordered mixed-content projection keyed by original `lessonContentId`, `contentType`, target UUID and effective sequence. If the destination's per-kind unique sequence cannot represent a collision, allocate a deterministic new sequence and keep the original ordering in the migration ledger.
4. When presenting a mixed curriculum, merge the two stores by the verified sequence/crosswalk. Sorting only `course_assignments` and only `lesson_contents` independently does **not** prove combined curriculum parity. Shared and section-targeted items must be resolved for the selected delivery with no cross-offering leakage.
5. Reconcile source/destination counts, duplicate old IDs, lesson memberships, cross-kind order, due dates, publication visibility and linked submissions. Imported `student_assignment.lesson_content_id` must map to the newly created assignment UUID and the same verified learner membership and delivery.
6. Fail closed and quarantine unmapped lesson/course/class/actor IDs, conflicting sort positions, unsupported file types, and timezones without explicit provenance. Never mark import complete just because the schema has compatible columns.

The unique index `course_assignments_legacy_content_uq`, active lesson/delivery sequence constraints, and `course_assignments.lesson_id` FK provide source identity/one-kind order guards. They are **not** a replacement for the cross-kind ordering reconciliation above. The initial NSRIT mapping inventory in `docs/migration/nsrit-migration-plan.md` remains discovery only; cutover requires a separate verified import implementation and rollback plan.
