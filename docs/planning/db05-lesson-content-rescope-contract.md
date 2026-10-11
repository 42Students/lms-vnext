# DB-008 — Legacy class scope mutation versus vNext course delivery identity

**Owner:** Chat 6 · **Global phase:** DATABASE · **Status:** source-backed contract, not accepted.  
**Legacy source:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, `LessonContents.java`, `LessonContentsDTO.java`, `LessonContentsServiceImpl.java`.  
**vNext source:** `src/db/schema/courses.ts`, `src/modules/courses/lesson-content-service.ts`, `src/modules/courses/validation.ts`.  
**SQL candidate:** `scripts/sql/db05-lesson-content-delivery-scope.draft.sql`.

## Semantics that must not disappear silently

Legacy `lesson_contents.class_id` is an optional *class* association, while `course_id` is a separately persisted parent snapshot. vNext models the corresponding targeting as optional `lesson_contents.delivery_id` linked to an explicit `course_section_deliveries` (offering + section). **Legacy `class_id` is not equivalent to one delivery UUID without checking course offering, academic period and cohort.**

Legacy source behavior differs for create versus edit:

| Legacy request | Create `setLessonContents` | `updateLessonContent` | vNext parity decision |
| --- | --- | --- | --- |
| `classId` absent or zero | Saves **NULL** class scope | **Does not change** existing class scope | Create shared content / update absent means no-op |
| Positive `classId` | Validates class existence; saves positive ID | Validates class and current course audience, saves new ID | Resolve a matching offering+section delivery. Reject arbitrary delivery from another offering/tenant |
| Negative `classId` | Saves NULL | Explicitly **clears** class scope | Explicit clear action must be authorized, logged, and reconciled with existing students' content/progress |
| Class change by ordinary faculty | Teaching-scope check for course/class | Requires current teaching assignment for new scope; owner authorization also applies | Non-admin cannot bypass assigned-delivery guard |
| `courseSlug` set | Resolves course by slug ahead of a numeric course ID | Content parent course not automatically changed by update path | Slug-based course lookup is a domain/API concern; never equate slug to canonical `courses.code` |

`LessonContentsServiceImpl.enforceCurrentCourseAudienceForNewScope` requires that a class belongs to the **current course audience**. Merely matching college, or having individually valid course and class foreign keys, is insufficient to grant new content targeting.

## vNext actual state

`createLessonContent` verifies `delivery.offeringId === lesson.offeringId` and calls `requireDeliveryContentMutation` for delivery-scoped content. It permits admin-managed generic content. `updateLessonContentInputSchema` currently has title, notes, links/storage, times/duration and sequence, **but no deliveryId, lessonId, or courseId update input**. The update service retains the existing `lessonId` and `deliveryId` while merging edits. Thus there is currently **no vNext class/delivery reassignment feature**, which is a parity gap unless explicitly redesigned and approved.

This is distinct from a database corruption issue: forbidding reparenting is safer than permitting unsafe moves, but user-visible rescope functionality must be reproduced or explicitly dispositioned before release.

## Required DATABASE-phase invariants and later API behaviors

1. A lesson-content row with delivery scope must belong to the same offering, cohort, period and college as the delivery's section. The staged SQL enforces this on direct row writes, including raw SQL.
2. Updating a delivery should be performed as an **explicit transition**, not as a hidden side-effect of a generic edit. Define `SET_DELIVERY`, `CLEAR_DELIVERY`, and no-op semantics rather than overloading numeric zero/negative client inputs in the new UUID API.
3. A faculty owner is not the same as the creator; on edit/reassignment enforce both owner restriction and teaching assignment on the **target** delivery.
4. Verify learner content progress, discussions, materials, submissions, private files and delivery-specific order overrides before changing content targeting. Decide whether to prohibit moves once downstream records exist or version/copy content explicitly.
5. Enforce current course audience eligibility before assigning a section; faculty must be actively assigned to teach. Admin privileges must be college/organization scoped.
6. Handle two-session reparent versus order write and reparent versus learner progress update on disposable PostgreSQL. The current staged direct scope guard and order ancestor guard do **not** guard every downstream table.
7. Preserve stable content identity, avoid silent enrollment/grade visibility regressions, and audit all approved moves.

## Negative/positive test matrix (NONE RUN)

- Create shared content: nullable delivery; regular faculty without an assigned class cannot bypass scope for new generic content.
- Create delivery-specific content on a valid matching offering+section: success.
- Delivery from wrong offering, college, cohort, or academic period: reject `23514`.
- Update with absent class/delivery: do not move content.
- Request an authorized clear of delivery scope: require explicit command and safe downstream policy.
- Request reassignment into another active delivery in same course offering: teaching scope and downstream reference checks required.
- Faculty editor not owner or not assigned to target delivery: reject.
- Admin from different college: reject.
- Raw SQL content reparent when prior order override exists: block until authorized atomic reset.
- Source class ID `0`, `-1`, positive and null behavior accounted for in API parity tests.
- Clean Drizzle migration and repeated full replay: no duplicate FK/index/trigger registration.

**DB-008 remains IN_PROGRESS; the 92 legacy field mappings are not formally verified.**
