# Legacy LessonContents import crosswalk — G2-19-002-092 / G2-19-002-094

This is the required **import mapping contract**, not evidence that any legacy rows were migrated. Importers must use source-college-scoped, audited old-integer → UUID mappings and quarantine unresolved or lossy rows. Never grant learner access merely because the old `enabled` flag was true.

| Old LMS `LessonContents` field | vNext destination and import rule |
| --- | --- |
| BaseModel numeric id | `legacy_id_map` keyed by source, source college, table and numeric ID; never cast to UUID or reuse another college's key |
| `lessonId` | resolve to `courseLessons.id` through scoped lesson crosswalk; unresolved/removed parent → quarantine |
| `courseId`, `courseName` | verify `courses.id` and offering agree with parent lesson; keep old name as audit/provenance only |
| `classId` | resolve to a college-scoped section and matching `courseSectionDeliveries.id`; null only when old content was genuinely course-wide |
| `facultyId` | resolve source faculty to the same-college membership and save `lessonContents.legacyFacultyMembershipId`; this is not `createdByUserId` |
| `sequence` | `lessonContents.sequence`, with deterministic source-ID tie breaking and collision quarantine |
| `contentTitle` | `lessonContents.title`, preserving exact source copy |
| `contentType` | keep verbatim in `legacyContentType`; normalize according to subtype table below |
| `contentDataDTO` | `legacyContentData` verbatim JSON; validated URL/notes/duration/storage fields separately; never authorize a public URL as a signed storage read |
| `active`, `enabled`, BaseModel deletion | `legacyActive`, `visibleToStudents` and deletion/status gates independently; inactive/disabled/deleted items are not published or actionable |
| `points` | integer `points` only after numeric-range validation; quarantine overflow or unsupported negatives |
| `deletedWithLesson` | `deletedWithLesson` plus deletion tombstone; never automatically restore independently deleted items |
| `deadline` | `deadlineLocal` as India-local wall clock, **not UTC**; for dedicated assignment set its due-at instant after explicit Asia/Kolkata conversion, preserving original local value for audit |
| `version`, timestamps | row-version and imported timestamps under source timezone validation, never substitute version for an auth permission |

## Historical content kind routing

| Source `contentType` (case-insensitive) | Route |
| --- | --- |
| `video` | `VIDEO` lesson content; validate asset and duration separately |
| `youtube` | `YOUTUBE` lesson content; validate approved external URL |
| `lecture`, `live_class`, `live` | `LIVE_CLASS` lesson content with retained raw session metadata |
| `ppt`, `pptx`, `pdf`, `resource`, `file`, `document` | `RESOURCE` lesson content; preserve MIME, file identity and private-file migration review |
| `assignment` | dedicated assignment entity and its section/course audience, attempt/points/deadline semantics; preserve source content JSON and ID in import provenance; create content navigation only when backed by that entity |
| `quiz` | dedicated quiz entity with stable source-question/option maps and scoring rules; preserve source content JSON and ID in provenance |
| Unknown or ambiguous strings | quarantine for review, retaining raw `legacyContentType` and `legacyContentData`; do **not** reinterpret as a safe public resource |

Import order: source identity/college → course/class and delivery crosswalk → faculty membership → lesson → typed content/assignment/quiz → materials and file keys → learner progress. For every row, validate source organization, parent ownership, version, visibility, source timestamps, and the destination's unique constraints before release. Content with no verified scope, deleted parents, unresolved file ownership, or invalid dedicated assessment payload cannot be published. Duplicate imports must be idempotent on the complete scoped legacy identity.

Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:23-65`; source authoring kinds `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:92-109`. Destination: `src/db/schema/courses.ts:451-495` and dedicated assignment/quiz models.
