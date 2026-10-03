# Courses assignments architecture

## C4A scope

C4A introduces written/link assignments without folding assessment state into passive Lesson Content.

Assignment definitions belong to a Lesson and may be:

- generic to the whole Course Offering (`delivery_id = null`) — College Admin / scoped Super Admin authored
- targeted to one exact Section Delivery — authored and managed by an actively assigned Course teacher or an admin

This mirrors the C2 audience model without reintroducing legacy `classId` / `facultyId` mixing.

## Lifecycle

Assignments use:

- DRAFT
- PUBLISHED
- ARCHIVED

Learners see and submit only PUBLISHED assignments inside a PUBLISHED Learning Path.

Publishing is rejected when the configured deadline has already passed.

Assignments with existing submissions keep their original maximum points. Metadata such as title, description, due date and sequence may still be corrected without rewriting submitted work.

## Submission model

C4A intentionally supports secure TEXT and HTTPS LINK submissions.

- exactly one submission per learner Membership + Assignment
- learner identity comes from request context, never request payload
- the submitted Delivery is resolved against the learner's active Program/Section enrollment
- exact-delivery assignments reject sibling Section Deliveries
- duplicate concurrent submissions are rejected by a PostgreSQL unique constraint

FILE submissions are deliberately deferred until the Cloud Storage upload-receipt/signing workflow exists. A raw client-provided storage key is not accepted as proof of an upload.

## Grading model

A submission stores:

- points awarded
- optional feedback
- grading status
- grade-published state
- authenticated grading user
- grading timestamp
- integer version

Faculty grading requires an active Teaching Assignment for the submission's exact Section Delivery. College Admin and scoped Super Admin may grade inside their tenant scope.

Learners never see points, feedback or grading metadata before publication.

Every grade or publication mutation uses an expected version. Stale writes fail with a conflict instead of silently overwriting a newer grade. Regrading automatically hides the grade again until it is republished.

## PostgreSQL integrity

The database enforces:

- active generic Assignment title/sequence uniqueness per Lesson
- active delivery-specific Assignment title/sequence uniqueness per Lesson + Delivery
- Assignment points and sequence bounds
- one Submission per Assignment + Membership
- TEXT vs LINK payload shape
- non-negative awarded points
- non-negative grading version
- grading lifecycle consistency

The service layer additionally enforces points awarded <= Assignment max points.

## Deferred from C4A

- file upload transport / upload receipts
- quiz definitions, attempts and answer snapshots
- assignment/quiz integration into the C3 Continue Learning aggregate
- assignment UI
- notifications/activity events
