# Courses learner progress architecture

## C3 scope

C3 adds learner-facing Course discovery, one exact-delivery learning workspace and passive lesson-content progress on top of the C1/C2 graph.

The learner never supplies a trusted Course/Section relationship. Every read/write resolves through the active membership -> Program enrollment -> Section enrollment -> Course Section Delivery chain.

## Learner Course discovery

`listLearnerCourseDeliveries` returns only active Course Deliveries attached to the learner's active Section placement for the matching Academic Period.

A learner cannot discover a sibling Section's Course Delivery merely because the Offering and Course are the same.

## Learning workspace

The learner workspace is one server-composed payload for one exact Course Delivery:

- Course + Offering + Delivery identity
- published Learning Path
- active Lessons in sequence order
- PUBLISHED generic Offering content
- PUBLISHED content for the exact requested Section Delivery
- learner progress joined to each visible content item
- aggregate progress summary
- next incomplete content for Continue Learning

The UI should consume this domain output instead of stitching together several weakly-related API calls.

## Progress model

`learner_content_progress` has one row per learner College Membership + Lesson Content.

Progress is monotonic:

- video/YouTube resume position never moves backwards
- completion is never cleared by a later stale update
- concurrent first writes are protected by the database uniqueness constraint

For VIDEO and YOUTUBE, completion is calculated from the authored content duration. Learner-supplied duration is never trusted.

- authored duration is required for timed content
- learner sends only playback position
- >= 90% marks the content complete
- an explicit learner `completed: true` is rejected for timed content

RESOURCE content may be explicitly marked complete by the learner.

LIVE_CLASS may be explicitly marked complete only after its configured end time. Attendance semantics remain a separate future capability.

## Integrity

PostgreSQL enforces:

- one progress row per Membership + Lesson Content
- non-negative persisted resume position
- authored duration bounds for timed content
- content-type/duration shape compatibility

Service-level authorization additionally enforces:

- active LEARNER membership
- active Program + Section enrollment
- exact Course Delivery access
- PUBLISHED Learning Path
- PUBLISHED Lesson Content
- exact delivery targeting for section-specific content

## C4C assessment aggregation

C4C extends the learner workspace without introducing another progress table.

Assessment completion is derived from the assessment's canonical transactional record:

- Assignment is COMPLETED once the learner has a persisted submission.
- Quiz is COMPLETED once the learner has at least one persisted attempt.
- An unsubmitted Assignment whose deadline has passed is MISSED.
- An unattempted Quiz is MISSED when its deadline has passed or it is CLOSED.

MISSED assessments remain visible in the workspace and count as incomplete in overall progress, but Continue Learning skips them because the learner can no longer act on them.

Each Lesson now exposes:

- contents
- assignments
- quizzes
- a deterministic combined items list

Combined ordering is sequence-first. When different item kinds intentionally share the same sequence, the stable tie-breaker is CONTENT, then ASSIGNMENT, then QUIZ, then id.

The workspace keeps the legacy-compatible nextContent field and adds nextItem for the true cross-assessment Continue Learning target.

Summary counters now cover content, assignments, quizzes, completed items and missed items. Overall percent is the average completion percentage across all visible learning items.

## Deferred after C4C

- assignment file upload transport / Cloud Storage receipts
- randomized quiz presentation
- manual/descriptive quiz grading
- learner/faculty/admin Course UI
- attendance-derived Live Class completion
- configurable completion threshold if product evidence requires it

## Historical C3 deferred list

- assignments/quizzes, attempts, submissions and grading
- actual Cloud Storage upload/signing
- learner/faculty/admin Course UI
- attendance-derived Live Class completion
- configurable completion threshold if product evidence requires it
