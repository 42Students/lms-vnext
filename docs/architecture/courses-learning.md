# Courses learning architecture

## C2 model

C2 builds learning structure on the C1 Course Offering / Section Delivery graph.

- `course_learning_paths` — one current learning path per Course Offering.
- `course_lessons` — ordered lessons inside the learning path.
- `lesson_contents` — generic Offering content or exact Section Delivery content.

A generic content row has `delivery_id = null` and is shared by every Section Delivery of the Offering. A section-specific row stores the exact `course_section_deliveries.id`.

No caller-provided course/section/faculty combination is trusted as authorization evidence.

## Access model

### College Admin / scoped Super Admin

May:
- create/update/publish/archive the shared Learning Path
- create/update/archive shared Lessons
- create/update/publish/archive generic content
- manage section-specific content when needed

### Faculty

Faculty learning access requires an active `course_teaching_assignments` row for the exact Section Delivery.

Faculty may:
- read the shared Learning Path and Lessons for that delivery
- read generic content plus content for that exact delivery
- create/update/publish/archive content for that exact delivery

Faculty may not:
- mutate the shared Learning Path or Lesson structure
- create or edit generic content
- access another delivery merely because it is the same Course or College

### Learner

Learner learning access requires:
- active Program enrollment
- active Section enrollment
- that Section to be the Section of the requested Course Delivery

Learners only see:
- PUBLISHED Learning Paths
- active Lessons
- PUBLISHED generic content
- PUBLISHED content for their exact Section Delivery

Draft/archived content is never returned to learner reads.

## Content types

The generic lesson-content pipeline contains only:

- `RESOURCE` — plain notes, an HTTPS link, an internal storage key, or a combination
- `VIDEO` — internal storage key; upload/storage transport is a later Cloud Storage concern
- `YOUTUBE` — HTTPS youtube.com / youtu.be URL
- `LIVE_CLASS` — HTTPS meeting URL with valid start/end timestamps

Assignments and quizzes are deliberately excluded. They require their own attempt/submission/grading lifecycle and must not be disguised as passive lesson content.

Rich HTML is also deliberately excluded from C2. `notes` is plain content at this boundary; a future rich-text feature must add an explicit sanitization contract.

## Integrity

PostgreSQL enforces:
- at most one non-archived Learning Path per Offering
- active Lesson name uniqueness within a Learning Path
- active Lesson sequence uniqueness within a Learning Path
- non-negative Lesson and content sequence values
- content-type column-shape invariants
- referential integrity to Offering, Section Delivery, Lesson and creator User

The service layer additionally enforces:
- delivery belongs to the Lesson's Offering
- exact Faculty teaching scope
- exact Learner enrollment scope
- tenant boundary checks
- HTTPS / YouTube URL validation
- storage-key traversal rejection
- Live Class end time after start time

## Deferred from C2

- actual Cloud Storage upload/signing workflow
- assignments/quizzes
- learner progress/completion
- learning UI and drag/drop reorder UX
- copying/templates between Offerings

Those should build on this model rather than weakening its scope rules.
