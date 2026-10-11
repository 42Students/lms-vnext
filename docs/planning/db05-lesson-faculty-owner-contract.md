# DB-008 — Preserve faculty ownership separately from lesson-content creation

**Owner:** Chat 6 · **Global phase:** DATABASE · **State:** SOURCE-SUPPORTED UNREGISTERED DRAFT, NOT VERIFIED.  
**Legacy BE oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (`prod-2026`).  
**vNext source:** `src/db/schema/courses.ts`, `src/db/schema/memberships.ts`, `src/modules/courses/lesson-content-service.ts`, `src/modules/courses/learning-access.ts`.  
**SQL companion:** `scripts/sql/db05-lesson-content-faculty-owner.draft.sql`. Chat 1 is the only migration registrar. No existing writer/reader uses this new field.

## Material business behavior found

Legacy `LessonContents.java` persists a **nullable `faculty_id`**. In `LessonContentsServiceImpl.createLessonContents`, a normal authenticated faculty creator is assigned their own ID instead of any different ID supplied in the request; an admin-faculty can assign another faculty. `setLessonContents` persists the designated owner. `updateLessonContent` and `deleteLessonContent` compare `faculty_id` with the authenticated faculty identity and deny non-admin changes by a different faculty member. They also separately enforce that a non-admin faculty member is actually assigned to teach the content's course/class. Null faculty owner denotes shared/generic content, **not** permission for any faculty to edit it.

Current vNext stores `lesson_contents.created_by_user_id`, set to `context.user.id` during creation and left untouched on content edits. It authorizes non-generic scoped edits through `requireDeliveryContentMutation` (teaching assignment) but does not persist an owner distinct from the creator. **Created-by and owner are different concepts.** For example, an administrator can create content for a teacher: the administrator is the recorded creator, but the teacher is the designated owner.

## Proposed normalized contract

| Concept | Candidate field | Invariant |
| --- | --- | --- |
| Audit creator | Existing `created_by_user_id` | Immutable producer provenance; not overwritten when content owner changes |
| Designated teacher | New nullable `faculty_owner_membership_id` | FK to college membership; same college as actual owning course and academic period, and same college/offering as optional delivery |
| Generic content | Owner NULL | Independent mutation permissions remain required |
| Active faculty assignment | Active membership with `FACULTY` role at the moment of first assignment/change | Cannot assign a learner-only, unknown or suspended member as faculty owner |
| Historical owner | Retained owner if faculty later loses role/is suspended | Keep provenance without retaining edit permission; active teaching/role checks remain service responsibility |

The unregistered SQL companion adds the nullable FK/index and an insert/update guard. A direct raw-SQL update cannot assign a faculty member from a different college, another offering/section, or a non-faculty membership. The guard checks both **course.department.college_id** and **offering.period.college_id**, not just a foreign-key target's existence. A signed-in faculty member cannot spoof another owner: the later application writes must take trusted role, teacher assignment, and admin context, never blindly accept a client-sent membership ID.

This is not a license to require ownership of every resource. Legacy generic content exists, and a faculty member may still have teaching scope but be blocked by a different explicit owner. API integration must preserve both conditions.

## API transition gate (for the later global API phase)

- **Create as faculty:** set owner to authenticated faculty membership; verify same college and active teaching assignment. Do not accept caller-supplied owner overriding the actor.
- **Create as college admin:** allow an explicitly authorized assignment to a faculty membership in the **same scoped college**. A generic null owner is allowed. Creator remains the admin user.
- **Edit/delete as faculty:** require active teaching scope and, when owner is not null, matching owner membership; a content ID from another delivery cannot bypass the current scope. Admin exemption remains tenant/role-scoped, not universal.
- **Reassign owner:** only trusted admin (or explicitly approved business policy) may assign another faculty. Preserve created-by audit history.
- **Delete owner role/suspend faculty:** retain the historical owner FK, but deny editing after loss of active role/teaching scope.
- **No owner:** generic content is still protected by course/delivery mutation authorization.
- **Concurrent operations:** protect against owner reassignment racing with learner publication, teaching-scope revocation, membership suspension, college/dept/period reparent or owner deletion.

## Disposable PostgreSQL acceptance matrix — NONE EXECUTED

1. `faculty_owner_membership_id = NULL` is accepted for generic content.
2. Same-college active FACULTY membership with matching lesson and optional delivery succeeds.
3. Different college membership is rejected with `23514`.
4. Course department college and offering period college mismatch is rejected with `23514`.
5. Delivery offering differs from lesson's offering: rejected with `23514`.
6. Delivery section belongs to another college: rejected with `23514`.
7. Active learner-only membership, suspended membership, or faculty-role absence on initial assignment is rejected with `23514`.
8. Existing assigned owner later loses role: persisted history remains. Application edit still rejects missing permissions.
9. Attempting faculty owner reassignment through an untrusted client request fails authorization; admin reassignment is audited.
10. Updating the owner must not modify `created_by_user_id`, and changing lesson/delivery scope revalidates the owner relation.
11. Check upstream path/membership reparenting: the row-write trigger alone does **not** protect prior content ownership. A separate safety policy / upstream guard is required.
12. Test two-session membership owner suspension/role removal and competing reassignment; the owner guard does not yet lock role changes, so no concurrency success claim is permitted.
13. Replay a clean, *new vNext* database with Chat 1's numbered migration and Drizzle schema changes. Do not connect to or migrate legacy production data.
14. Execute Node, API/permission negative, real PostgreSQL, typecheck and build tests on the accepted commit SHA.

## Ownership and verification boundary

This file plus SQL are **staging evidence**, not proof that the migration runs or behavior is present. The authoritative `docs/planning/db05-unresolved-semantic-decisions.json` item `lesson_contents.faculty_id` remains OPEN; the 92-field verified count remains **zero**. W01 must integrate the additional candidate field in the canonical schema at a single migration point, and the subsequent API phase must implement and test its server-authorized writer/reader.

Do not mark DB-008 complete or change the global phase without executed acceptance evidence.
