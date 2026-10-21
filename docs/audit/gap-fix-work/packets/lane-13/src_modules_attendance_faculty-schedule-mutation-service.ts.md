# Work packet: edit src/modules/attendance/faculty-schedule-mutation-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-007  [P1] GAP  facet F05  effort L
- Legacy: ClassScheduleServiceImpl.java:335-370 checks faculty/class/hall overlap.
- vNext now: faculty-schedule-mutation-service.ts:68-80 only section/faculty overlap.
- Fix: Add lecture-hall conflict and global hall lock.

## G2-16-027-010  [P1] GAP  facet F06  effort M
- Legacy: ClassScheduleServiceImpl.java:57-82 booking grace default5 minutes configurable.
- vNext now: faculty-schedule-mutation-service.ts:33-38 bounds academic period, no past-start check here.
- Fix: Reject past starts beyond 5-minute configurable grace.

## G2-16-027-025  [P1] GAP  facet F12  effort M
- Legacy: ClassScheduleServiceImpl.java:309-314 past booking 5-minute grace.
- vNext now: faculty-schedule-mutation-service.ts:33-38 no past cutoff.
- Fix: Enforce configurable near-now cutoff.

## G2-16-027-027  [P1] GAP  facet F12  effort L
- Legacy: ClassScheduleServiceImpl.java:335-370 hall/class/faculty conflicts.
- vNext now: faculty-schedule-mutation-service.ts:68-80 section/faculty only.
- Fix: Add hall availability preflight and transaction lock.

## G2-16-027-031  [P1] MISSING  facet F15  effort M
- Legacy: ClassScheduleServiceImpl.java:381-418 sends class-targeted notice titled supplied title or `New class scheduled`, body `A class has been scheduled for EEE, d MMM at h:mm a.`, best-effort; failures logged only.
- vNext now: faculty-schedule-mutation-service.ts:107-118 records activity event only; no class-targeted notification.
- Fix: Emit college/section-scoped learner notice after commit with identical title, time rendering, and failure isolation.

## G2-16-027-036  [P1] GAP  facet F20  effort L
- Legacy: ClassScheduleServiceImpl.java:335-346 locks hall,faculty,class during creation.
- vNext now: faculty-schedule-mutation-service.ts:39-45 locks faculty and section only.
- Fix: Serialize across halls shared by sections.

## G2-16-027-013  [P2] GAP  facet F07  effort S
- Legacy: FacultyClassScheduleController.java:55-56 Valid class and faculty are required.
- vNext now: faculty-schedule-mutation-service.ts:22-32 scoped delivery error.
- Fix: Show class/faculty validation where ownership is invalid.

## G2-16-027-016  [P2] GAP  facet F07  effort M
- Legacy: ClassScheduleServiceImpl.java:363-369 distinct batch/hall conflict messages.
- vNext now: faculty-schedule-mutation-service.ts:68-80 generic SCHEDULE_EVENT_CONFLICT.
- Fix: Return class/faculty/hall conflict-specific causes.

## G2-16-027-012  [P3] GAP  facet F07  effort S
- Legacy: FacultyClassScheduleController.java:52-54 Faculty access required.
- vNext now: faculty-schedule-mutation-service.ts:25-32 emits FACULTY_TEACHING_SCOPE_REQUIRED.
- Fix: Map typed denial to friendly exact wording.

## G2-16-027-014  [P3] GAP  facet F07  effort S
- Legacy: FacultyClassScheduleController.java:69-70 You may schedule only your own actively assigned course and class.
- vNext now: faculty-schedule-mutation-service.ts:29-32 generic teaching-scope error.
- Fix: Use legacy actionable permission copy.
