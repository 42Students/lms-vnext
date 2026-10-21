# Attendance legacy-to-vNext identity and semantics map (lane 13)

**Status:** design and compatibility reference only. The vNext owner has confirmed no legacy learners or data require migration. This document does not authorize production import or public-file fallback.

## Identity crosswalk (never derive from raw string similarity)

| Old LMS (MySQL) | vNext (PostgreSQL) | Trusted mapping requirement |
|---|---|---|
| Attend.id INT / BaseModel metadata | attendanceRecords.id UUID | Separate immutable legacy source+row map; retain createdAt/updatedAt/isDeleted/revival chronology, do not reuse an old number as UUID |
| Attend.student_id VARCHAR | collegeMemberships.id UUID | Match a verified canonical user and ACTIVE or explicitly historical membership in the **same college**, then check course/section enrollment at historical time; reject missing/ambiguous identifiers |
| Attend.class_schedule_id INT | sectionScheduleEvents.id UUID | Join verified legacy class, course, faculty and term to an unambiguous sectionScheduleEventCourses.deliveryId and sectionScheduleEvents.sectionId; reject duplicate/foreign mappings |
| Legacy course/class/faculty IDs | courseSectionDeliveries.id / courseTeachingAssignments | Map college + academic period + delivery, never search solely by title/class number or faculty display name |
| class_schedule.attendance_marked_at | attendanceSessions.markedAt and status MARKED | Only trusted explicit marker proves full session attendance; absence-row emptiness alone NEVER implies all-present |
| marked_by nullable | attendanceRecords.markedByUserId required | A historical UNKNOWN/system audit principal or nullable staging provenance requires a separately approved migration. Do not attribute unknown actions to arbitrary Faculty |

## Status and correction semantics

Legacy Attend.attendance_status NULL is an unexplained **ABSENT** exception; non-null EXCUSED, MEDICAL, LATE remain their specific exception type. Legacy soft-delete marks previously removed absences and allows revival. The vNext live model instead stores absence exceptions plus a separate MARKED session. Correcting to PRESENT removes the current exception row, while an activity event records previous/new status and correction note. A historical importer must preserve source row ID, deletion/revival times, original reason and who made each change in an immutable append-only history rather than losing them on current-state replay.

The vNext Faculty bulk endpoint is PATCH /api/attendance/faculty/sessions/{scheduleEventId}, with deliveryId, absentMembershipIds and presentMembershipIds covering the full ACTIVE roster, expectedMarkedAt for CAS corrections, and a reason. This is atomic **all-or-none**, not legacy POST /api/v1/attendance/bulk and its partial-success/failed-IDs response. On uncertain outcome, read current state and CAS token before attempting retry.

College Admin corrected attendance is a separate scoped operation, may correct old held sessions outside the faculty window but must not mark a class before its start. The Admin receiver, college, delivery, event, enrollment and membership are revalidated before write. Learner view is read-only.

## Reporting policy and privacy

New reported attendance excludes unmarked classes from the denominator. The legacy historical report sometimes counted all held schedules; parity reports must explicitly label both definitions rather than silently changing old percentages or eligibility. Always distinguish unmarked, upcoming, no class, absent and excused. Historical contact or identity records must not be exposed by merely possessing a schedule/legacy learner ID. Never silently import raw Aadhaar, phone, alternate contacts or notes into public events.

## Required operator checks before any migration

Validate tenant source, learner identity collision handling, course term and schedule association, ambiguous historical enrollment, nullable markedBy provenance, soft-delete timeline, status transforms and per-schedule markedAt. Generate an exception report for unresolved rows and quarantine them. The archived source is not an authorization credential; only new scoped vNext IDs may enter live services.
