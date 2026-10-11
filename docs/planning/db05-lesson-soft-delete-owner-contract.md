# DB05 — lesson deletion, restore, and content ownership source contract

**Task:** DB-008 / Chat 6 / global DATABASE phase  
**Status:** SOURCE-RECONCILED, DDL UNREGISTERED, runtime acceptance **NOT VERIFIED**  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**vNext:** `42Students/lms-vnext/main`; Chat 1 is the sole Drizzle migration journal/schema-barrel owner.

## Why a status enum is insufficient

Legacy `Lesson` and `LessonContents` inherit `BaseModel.isDeleted`, independent of `active`/`enabled`. The current vNext `course_lessons.status` and `lesson_contents.status` instead carry lifecycle values. A row can be archived without having been deleted, or deleted independently of publication. An `ARCHIVED` flag cannot prove or safely emulate restore provenance.

Legacy `LessonServiceImpl.deleteLesson` is transactional: it soft-deletes a lesson and **cascades the soft-deletion to every content row**. It registers destructive R2 cleanup only *after* commit. `restoreLesson` restores **only** the lesson; content deliberately stays deleted, because content deleted independently earlier is indistinguishable from deletion caused by its lesson and private objects may no longer exist.

Legacy `LessonContentsServiceImpl.deleteLessonContent` sets `isDeleted=true`, `enabled=false`, `active=false`. It preserves the database row for submissions/progress/audits. It may destroy a backed R2 file. A separate restore operation must not blindly resurrect a deleted file, references, or visibility.

**Staged proposal:** `scripts/sql/db05-lesson-content-soft-delete-cascade.draft.sql` adds separate nullable `legacy_deleted_at` tombstones on `course_lessons` and `lesson_contents`. The proposed AFTER UPDATE trigger adds tombstones to still-live contents during a lesson deletion in the same transaction but **never restores children** when the parent is restored. This is a candidate transformation of legacy Boolean semantics; no historical deletion timestamp is asserted.

## Exact state transition matrix

| Action | Lesson deleted? | Content deleted? | Content active/enabled? | Source-backed expectation |
| --- | --- | --- | --- | --- |
| New lesson and content | false | false | true/true by default on normal content create | Newly authored, access still depends on course and publication |
| Individually delete content C | false | true | false/false | Tombstone C; do not erase references; private object may become unrecoverable |
| Delete parent lesson L | true | all children true | Existing child flags may stay unchanged in legacy lesson cascade | Atomic parent/child tombstone, preserving earlier individual deletion |
| Restore lesson L | false | **unchanged** | unchanged | NEVER cascade restore contents, even if already deleted by parent |
| Update content under deleted lesson | true | usually true | unchanged | **BLOCK** until explicit child/ancestor and storage restore policy exists |
| Archive published lesson in vNext | not necessarily | not necessarily | independent | Archive and soft-delete remain different decisions |

## Owner is not creator

Legacy `LessonContents.facultyId` is nullable and a **mutable ownership/permission field**, not just an audit author. `LessonContentsServiceImpl` on faculty creation stamps the principal's faculty ID. Update/delete require either the matching owner or authorized admin, including faculty-type ADMIN. Generic owner-null content still requires valid teaching-assignment scope. Users cannot escape this requirement by supplying a different class/course in the edit payload.

vNext `lesson_contents.created_by_user_id` is an audit identity; it does not model this separate permission relationship. A super-admin/college admin can author content for another faculty. In greenfield multi-college vNext the candidate field is nullable `faculty_owner_membership_id`, referring to `college_memberships.id` and **not** using a global numeric faculty ID or automatically equating creator and owner.

**Staged proposal:** `scripts/sql/db05-lesson-content-faculty-owner.draft.sql` adds this FK and rejects different-college ownership based on actual course department, offering period and optional delivery's offering/section cohort/period/college. A generic owner-null row remains legal. The canonical companion checks active FACULTY role on new/reassigned ownership while preserving historical ownership on later role loss; it does not grant permission to edit or prove a current teaching assignment.

## Release and integration blocking cases

1. Source-authorized content owner from same college, matching delivery, can be stored; mismatched owner membership/department/offering college must reject.
2. Offering mismatch, section cohort mismatch, academic-period mismatch and section-college mismatch must reject even when all independent FKs exist.
3. A real teaching-assignment check (not merely a shared college) guards owner-null content and owner mismatch; admin exception remains explicit and permission-scoped.
4. Direct parent lesson delete is atomic with child tombstones, including content with prior independent deletion. Restore lesson does not restore any child.
5. Content deletion never erases submissions, progress, audit evidence or parent history; R2 cleanup only after DB commit.
6. Private receipts and playback references cannot be reused as if assets survived a deletion; source Resource semantics must remain honored.
7. Learner/faculty/mentor/course-card reads filter tombstones with published/active/enabled gates; a deleted parent or course may never leak a published child.
8. Direct SQL inserting or moving content into a deleted lesson must fail; this is **not enforced by the present draft** and requires upstream immutability/child guard.
9. Upstream department, membership, offering, academic-period, cohort, section, lesson/content moves and two-connection races must not strand a cross-college ownership FK.
10. Complete disposable PostgreSQL replay including SQLSTATE negative cases, optimistic CAS, rollback, restore and concurrent owner assignment. Record actual commands, results, git SHA and PostgreSQL version.
11. API contracts must change atomically with migrations. Merely adding `legacy_deleted_at` is unsafe because current vNext learner read paths filter only `PUBLISHED` and not the tombstone.
12. Drizzle schema barrel and numbered journal are integrated **only by Chat 1**; these companions are **not** standalone eighth/ninth migrations.

## Verification and ownership

**Current:** No numbered migration registered; no PostgreSQL tests/Node suite/CI/typecheck/build accepted for these proposals. `tests/db05-lesson-delete-restore-and-owner.test.mjs` contains seven **authored** static guards, not executed regression proof. `docs/planning/db05-migration-readiness-manifest.json` retains explicit blocked gates. Source fields `lesson.is_deleted`, `lesson_contents.is_deleted` and `lesson_contents.faculty_id` remain formally unverified until runtime acceptance.

**Do not mark DONE_VERIFIED** or promote global phase based on an SQL draft, source-only tests, or the age of an issue.

## Course-level nondeleted-descendant guard (source extension)

Legacy `CourseServiceImpl.deleteCourse` refuses a course deletion if either `LessonContentsRepository.countByCourseId` or `LessonRepository.countActiveByCourseId` is positive. **Both repository queries exclude `is_deleted=true` rows**. That distinction matters: a course whose lesson rows have already been soft-deleted must be deletable without destroying past learner progress or forcing hard deletion of its historical children. Restoration in `CourseServiceImpl.restoreCourse` verifies the requested authorized college and clears **only the course tombstone**; it does not re-enable lessons, restore individually deleted contents, or recreate an R2 object.

**Companion:** `scripts/sql/db05-course-soft-delete-guard.draft.sql` adds `courses.legacy_deleted_at` distinct from `courses.status` and rejects course tombstone writes while a live lesson or content exists beneath any course offering/learning path. It also locks the ancestor course `FOR SHARE` when creating or moving a lesson so an in-flight course tombstone cannot miss a concurrently inserted live lesson.

These are source-backed proposals rather than registered/enabled features. Existing offering/path reparent operations can bypass the child insertion lock; W01 must coordinate their transitions and write tests for a new lesson while a course delete commits, restore across colleges, existing archived offerings, and orphan-free historical audit records. `tests/db05-course-soft-delete-guard.test.mjs` contains five *authored but unexecuted* static cases.

**No nested restore:** Course restore changes course tombstone only. Lesson restore changes lesson tombstone only. An individual content restore is independent and must prove its private storage object still exists, with no automatic in-place reclamation of a deleted receipt. This source lifecycle is more granular than a single `ACTIVE/ARCHIVED` enum on each row.


## W06 direct lesson restoration under deleted course — 2026-10-12

**Source-confirmed integrity gap:** the unregistered `db05_live_lesson_parent_course_guard` previously fired on INSERT and `learning_path_id` UPDATE only. A deleted lesson could be restored with `UPDATE course_lessons SET legacy_deleted_at = NULL` without moving its learning path. That UPDATE bypasses the parent's `FOR SHARE` check, allowing a **live lesson under a tombstoned course** despite the intent of the existing guard.

**Updated unregistered draft:** `scripts/sql/db05-course-soft-delete-guard.draft.sql` now triggers on `INSERT OR UPDATE OF learning_path_id, legacy_deleted_at`. It checks and locks the owning course **only when `NEW.legacy_deleted_at IS NULL`**. This rejects in-place restore or live insert/move under a deleted course, yet permits archived/historical tombstoned lesson repair and deletion without unintentionally resurrecting children. Existing lesson→content cascade is intentionally NOT reversed on restore. The independent tombstone-version trigger must still be installed before any live rollout.

**Native actual test:** Node 22.16.0 `node --test /mnt/data/db008-check/tests/db05-lesson-restore-parent-reference.test.mjs` executed a pure policy reference test, 10/10 PASS. Exact local `git hash-object` SHA equals GitHub test blob `e95168a6a11bff101a0a9215a0899a36f1567848`. This is a pure function model, NOT SQL. Source test `tests/db05-lesson-restore-parent-guard.test.mjs` is authored but **not executed**. Full 12-case `LR-01..LR-12` PostgreSQL negative/two-session matrix remains NOT_RUN, with explicit manifest gate `DB05_LESSON_RESTORE_PARENT_LIVE_PG_NEGATIVE`.

**Integration owner:** Chat 1 exclusively registers/executes a numbered migration. Verify trigger creation order against lesson delete cascade, version guard and parent archive child guards; verify WITH two PostgreSQL sessions that course tombstone versus lesson restore cannot both commit inconsistent live child state. Keep DB-008 IN_PROGRESS, global DATABASE ACTIVE; no runtime semantic fields verified by this source batch.
