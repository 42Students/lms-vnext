# DB04 active qualification / learner-image peer review — Chat 5

**Date:** 2026-10-11  
**Reviewed task:** DB-007, owned by Chat 3. No claim transfer.  
**Global phase:** DATABASE  
**Legacy BE:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Status:** source-contract corrections only; no migration/runtime verification.

## 1. Qualification: grade contract is stricter than the staged SQL

Current legacy profile writes are explicit in
`LearnerProfileServiceImpl.validateGradeAndMaxGrade`:

- grading type is required;
- grade is required;
- max grade is required;
- both add and update call that validator.

The current profile UI independently requires the same three fields before
calling the granular education endpoints. The supported selector values come
from the backend and are currently `CGPA`, `Percentage`, `Grade`, `GPA`.

The DB04 candidate SQL currently declares:

- `grading_type varchar(64)` nullable;
- `grade varchar(100)` nullable;
- `max_grade varchar(100)` nullable;
- no trim/nonblank checks.

That is a source-confirmed direct-SQL gap if
`profile_education_entries` becomes the canonical relation.

**Recommended migration contract:** on greenfield rows, make all three non-null
and nonblank. Do not add a hard enum CHECK merely from the UI selector unless
the API contract is deliberately narrowed: the legacy service itself validates
presence, not a closed enum.

## 2. Currently-pursuing + end-year semantics need an explicit choice

There are two current source behaviors:

1. Current React profile UI always sends
   `endYear = null` when `isCurrentlyPursuing=true`.
2. Legacy `QualificationValidator` is broader: it allows a pursuing
   qualification to have a null/empty **or future** end year and rejects only a
   past numeric end year.

Therefore the staged contract statement
“currently pursuing requires end year IS NULL” matches the **current UI
producer**, but is stricter than the broader legacy validation utility.

Do not label that strict DB rule as an exact legacy database invariant. Record
one of these decisions:

- **CURRENT_UI_CANONICAL:** require NULL for pursuing rows; API clients are
  intentionally normalized to the current profile UI behavior; or
- **LEGACY_API_COMPATIBLE:** allow a stored expected/future end year.

Avoid a CHECK using `current_date` to require “future forever”; a row that is
valid today would become logically invalid as time passes without being
rewritten. If expected graduation year is retained, its temporal interpretation
belongs in a writer/policy transition rather than a non-monotonic static CHECK.

## 3. Year types are strings in the active source

Both `Qualification` and `EducationDTO` carry `startYear` /
`endYear` as strings. The current React UI converts them with `Number(...)`
for display/ranking but sends them as the form values.

The SQL candidate's `varchar(16)` representation is therefore closer to
literal source parity than the design document's illustrative `smallint`.
If DB04 intentionally normalizes years to integers, record it as a redesign and
prove all accepted API payloads are canonicalized before persistence.

## 4. `is_recent_education` is not currently the profile UI's source of truth

The current React profile:

- auto-derives “Most Recent” from a pursuing qualification, otherwise max
  numeric `endYear`;
- initializes new qualification `isRecentEducation=false`;
- does not present a manual recent-education toggle in the reviewed profile
  flow;
- clears/saves granular education entries without computing that persisted
  flag.

The backend still sorts rows by persisted `isRecentEducation`, and a separate
`QualificationValidator` requires exactly one primary/recent qualification
for a qualification-set workflow. These are not sufficient evidence that the
granular profile CRUD currently guarantees exactly one true row.

Therefore do **not** add an “exactly one recent row” database invariant to the
profile relation without identifying the owning writer. Preferred vNext
direction may be to derive “most recent” from canonical dates/pursuing state and
retire the redundant flag, but that requires an explicit API/UI disposition.

## 5. Legacy `student_image` is active backend code but not current profile UI

The pinned backend still contains:

- `StudentImage`;
- `StudentImageRepository`;
- `StudentImageServiceImpl`;
- `StudentImageController` under `/api/v1/learner-images`.

The service stores a JSON list of
`{imageId,imageUrl,active}` and has create/get/deactivate behavior.

However the pinned current profile frontend instead:

- uploads a single `profile-images` object;
- calls learner/faculty **header** update with `profileImage`;
- updates the Redux profile image;
- deletes the old object asynchronously.

No current frontend reference to `/api/v1/learner-images`,
`getImageDataByLearnerId`, or
`deactivateImageByImageIdAndLearnerId` was found. A connected
organization-wide 42Students code search also found no consumer for those
endpoint/service names.

This means `student_image` is **not equivalent to current profile-image UI
behavior**. It is an active legacy API implementation with no demonstrated
current client.

## 6. The old image persistence itself is internally weak

`createStudentImages` inserts a new `StudentImage` row on every create,
while `StudentImageRepository.findByLearnerId` expects a single result and
there is no demonstrated database unique constraint on learner id in the
reviewed source. Repeating create can therefore create ambiguous source state.

Also, `deactivateImage` returns true whenever the learner row exists even when
the requested imageId was not found in its JSON list.

Do not clone those weaknesses for “exact parity.”

### Recommended vNext disposition

Choose explicitly between:

- **REDESIGN_TO_CANONICAL_SINGLE_PROFILE_IMAGE** — current LMS UI behavior is
  canonical; store one receipt-backed profile image/header reference and retire
  the unused gallery API in the later API parity phase; or
- **RETAIN_GALLERY_API** — keep normalized `profile_image_entries` as staged,
  but define append/replace semantics, missing-image deactivation result,
  stable ordering, same-owner receipt rules, and concurrency before
  registration.

The second option should only be chosen if an external consumer is identified
or product scope explicitly requires the gallery.

## 7. Receipt hardening remains correct but incomplete

Moving from arbitrary client URLs to private object receipts is a sound
security redesign. Existing candidate SQL correctly stages same-owner composite
FKs. Before registration it still needs executable proof for:

- receipt purpose `MARKSHEET` vs `PROFILE_IMAGE`;
- CLEAN/non-revoked/non-expired status;
- object key/digest/generation constraints;
- cross-tenant direct SQL;
- revocation/use race;
- canonical writer ownership so aggregate profile JSON cannot diverge.

## Suggested DB-007 source disposition updates

1. Qualification grading type/grade/max-grade: **ACTIVE_REQUIRED**.
2. Pursuing/end-year NULL rule: **CURRENT_UI_BEHAVIOR / stronger-than-generic-validator decision required**.
3. `is_recent_education`: **ACTIVE_READ_COMPATIBILITY, canonical write semantics unresolved**.
4. `student_image`: **ACTIVE_BACKEND_LEGACY_API / NO_CURRENT_CONNECTED_CONSUMER**;
   redesign/retirement decision required, not automatic preservation.
5. Historical `student_registration` and `approver_id_card`: see separate
   Chat 5 retirement peer review.

No Node, PostgreSQL, browser, or external consumer test was executed in this
peer review.
