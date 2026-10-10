# DB-008 classroom message persistence: immutable attribution, deletion and tenant scope

**Status:** staged candidate for Chat 1 migration registration; no runtime approval.  
**Owner:** Chat 6 / DB-008, global phase DATABASE.  
**Legacy backend evidence:** [`42Students/lms` @ `21bad59d`](https://github.com/42Students/lms/tree/21bad59d4dfaf2fa11fdeaf9353327ce105697d5).  
**vNext evidence:** `src/db/schema/discussions.ts`, `src/modules/courses/discussion-service.ts`.  
**Draft:** `scripts/sql/db05-classroom-chat-parity.draft.sql`. It is **not** a numbered migration.

## Verified source behavior (not verified running behavior)

1. Legacy `ClassroomMessage.java` stores `course_id`, `class_id`, `sender_id`, `sender_name`, `sender_role`, `message_text`, `is_pinned`. Its `BaseModel.java` superclass stores `is_deleted`.
2. Legacy `ClassroomMessageCreateDTO.java` deliberately **does not** accept sender metadata, pin state or deletion metadata from the caller. `ClassroomServiceImpl.createMessage` assigns sender ID, resolves sender name from trusted current principal, derives Faculty/Learner role, initializes pin false, then saves the message.
3. Legacy `ClassroomServiceImpl` deletes by `existing.setIsDeleted(true)` and `save(existing)`; a hard delete would lose moderation/audit history. Repeated deletion and retrieval semantics still require endpoint-specific review.
4. vNext `courseDiscussionMessages` contains sender membership, sender role and pin fields, but no stored sender-name snapshot or deletion marker. `listCourseDiscussionMessages` joins current `users.displayName`, so a user rename can change old attribution. `deleteCourseDiscussionMessage` calls `.delete(courseDiscussionMessages)` — an irreversible hard delete.
5. Existing vNext independent references from `course_discussion_messages` to `course_section_deliveries` and `college_memberships` do not enforce *matching* college. The draft checks three linked delivery paths: owning course's department college, offering period's college and section period's college, against sender membership's college.

All five points above are static source conclusions. No live DB introspection, API response comparison, SQL execution or role/tenant negative test is claimed.

## Proposed data contract

| Business concept | Candidate representation | Gate |
| --- | --- | --- |
| Trusted sender name as written | `sender_name_snapshot varchar(255)` nullable pending API/seed rollout | Persist from server-authorized identity at message creation; never accept the client-provided name |
| Soft delete/moderation retention | `deleted_at timestamptz` nullable | Default active; use `UPDATE` on deletion; exclude deleted rows from reads/pins; decide subsequent delete behavior |
| Query active ordered messages | Partial index on `(delivery_id, created_at, id) WHERE deleted_at IS NULL` | Run EXPLAIN and pagination tests; stable ordering for same timestamps |
| Sender and delivery same-college | Scoped trigger against course, offering, section and membership college | Execute wrong-college negative tests; ensure upstream reparenting cannot orphan an existing row |

**Do not conflate** this classroom chat with `lesson_content_discussions`; that is a *different* content-scoped stream under the separate DB05 draft.

## Exact API cutover requirements (later global API phase)

- Creation must resolve the display name under the authenticated college membership, persist a trusted snapshot, and return the same name. A subsequent profile rename must not rewrite history.
- Delete must preserve the record and permission decisions, record the trusted actor/timestamp when audit requirements demand it, and make subsequent reads hide it. Pin/unpin cannot reactivate deleted rows.
- Existing read/write mutations must only accept a delivery whose offering, section, parent course and sender membership belong to the intended college. Role and teacher-assignment access remain separate server checks.
- A direct DB insert/update with wrong-college references must fail even if the application forgot authorization.
- An upstream delivery/section/course/membership relocation must not create cross-college rows **after** insertion. The candidate child-table write trigger alone is insufficient; add upstream guards or prohibit unsafe reparenting.
- Confirm `sender_role` legacy serialized Faculty/Learner values versus vNext enum `LEARNER/FACULTY/ADMIN`. Do not silently break role display parity.

## Chat 1 registration checklist

1. Compare against the newest `main` schema and migration registry; verify no other worker already owns this exact pair of fields.
2. Plan nullable additive columns and rollback; agree on policies for greenfield rows already created with `sender_name_snapshot IS NULL`.
3. Execute the candidate on disposable PostgreSQL. Test valid write, each mismatched college path, no-membership actor, and immutable historical sender display on profile update.
4. Prove soft-delete read/pin/delete visibility, permission checks, return shape and concurrency in integration tests.
5. Guard sender-scope changes **and** upstream FK graph changes; review pin actor's college authorization.
6. Confirm all required app writers/readers and migration apply in one rollout; run `db:migrate`, `test:db`, lint, typecheck, unit tests and build on a recorded SHA.
7. Only after accepted evidence, change queue proof state. **Not complete / not verified here.**

No legacy records are being migrated; source is the business-behavior oracle for the greenfield vNext database.
