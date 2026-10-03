# Courses quizzes architecture

## C4B scope

C4B introduces multiple-choice quizzes as a first-class assessment model beside C4A Assignments.

Quiz definitions belong to a Lesson and may be:

- generic to the whole Course Offering (delivery_id = null) — College Admin / scoped Super Admin authored
- targeted to one exact Section Delivery — authored and managed by an actively assigned Course teacher or an admin

Learner and faculty scope always resolves through the exact Course Section Delivery. Client-supplied course, class, faculty or learner ownership is never trusted.

## Lifecycle

Quizzes use:

- DRAFT
- PUBLISHED
- CLOSED
- ARCHIVED

DRAFT is editable and accepts no attempts.

PUBLISHED is learner-visible and accepts attempts until its deadline or attempt limit.

CLOSED is learner-visible for history but accepts no new attempts.

ARCHIVED removes the quiz from active learning surfaces while preserving attempt history.

Results may only be published after the quiz is CLOSED. This prevents answer-key disclosure while any learner can still submit an attempt.

## Question model

C4B supports:

- SINGLE_CHOICE — exactly one correct option
- MULTIPLE_CHOICE — at least one correct and at least one incorrect option

Question and option order are explicit and database-unique within their parent.

Quiz creation/update validates:

- non-empty prompts/options
- unique question sequence
- unique option sequence
- case-insensitive unique option text per question
- correct-answer cardinality
- per-question and total point bounds

Question/option replacement is permitted only while the quiz is DRAFT and has no attempts. After the first attempt, the assessment key is frozen.

## Attempt model

Quiz attempts are atomic submissions rather than mutable in-progress rows.

Each attempt stores:

- exact Quiz + Section Delivery + learner Membership
- monotonically numbered attempt
- score and maximum score snapshot
- submission timestamp
- one immutable answer snapshot per question

Each answer snapshot stores:

- original question prompt/type/points
- selected option ids
- the full option set and correctness as it existed at submission time
- correctness and points awarded

This prevents later metadata edits or even accidental live answer-key changes from rewriting historical grading.

## Attempt concurrency

The service calculates the next attempt number, then PostgreSQL enforces unique:

Quiz + Membership + Attempt Number.

If two final attempts race, only one can commit. The second request is converted to an attempt-limit/conflict error after rechecking the persisted count.

Attempt row + answer snapshots are written in one database transaction, so a partial attempt cannot be persisted.

## Scoring and privacy

Scoring is server-side only.

- submitted question ids must belong to the Quiz
- selected option ids must belong to that question
- SINGLE_CHOICE rejects multiple selected options
- an answer receives points only when its selected option set exactly matches the canonical correct set
- omitted questions score zero

Learners never receive correct-answer flags from an open quiz.

Scores, correctness and answer keys become learner-visible only when:

1. the quiz is CLOSED,
2. results have explicitly been published, and
3. the learner has at least one attempt.

Faculty/admin review endpoints always use exact delivery authorization and may inspect the full scoring snapshot.

## PostgreSQL integrity

The database enforces:

- active generic Quiz title/sequence uniqueness per Lesson
- active delivery-specific Quiz title/sequence uniqueness per Lesson + Delivery
- Quiz attempt/point/sequence bounds
- Question sequence uniqueness and point bounds
- Option sequence uniqueness
- one Attempt number per Quiz + Membership
- score <= max score and non-negative score
- one answer snapshot per Attempt + Question
- answer points <= question points

## Deferred from C4B

- randomized question/option presentation
- manual/descriptive quiz questions
- assessment aggregation into Continue Learning
- quiz UI
- notifications/activity events
