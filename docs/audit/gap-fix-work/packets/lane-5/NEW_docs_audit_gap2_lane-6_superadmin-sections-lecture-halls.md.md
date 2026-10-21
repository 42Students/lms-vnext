# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

11 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

## G2-6-030-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy unscoped Super Admin can GET all lecture halls and choose College in Create form (LectureHalls.js:68-82,311-325; LectureHallController.java:80-101).
- vNext now: vNext no college scope renders Select a college to continue instead of data and create form (admin/lecture-halls/page.tsx:26-33).
- Fix: Decide whether global all-college view is retained; if not document intentional safety change and route to scope picker.

## G2-6-030-029  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit cancel dirty snapshot confirmation, Discard edits to ‘name’? Your unsaved changes will be lost (LectureHalls.js:20-27,166-186).
- vNext now: vNext Cancel immediately closes editing state with no dirty check (lecture-hall-manager.tsx:250-260).
- Fix: Add dirty form snapshot and precise Discard edits confirmation for Cancel, Escape, backdrop.

## G2-6-030-038  [P1] GAP  facet F09  effort M
- Legacy: Legacy cancel edit dirty prompts discard confirmation (LectureHalls.js:173-186).
- vNext now: vNext cancel hides Dialog immediately even if dirty (lecture-hall-manager.tsx:250-260).
- Fix: Add nested confirm flow and preserve edit state if declined.

## G2-6-030-046  [P1] GAP  facet F12  effort M
- Legacy: Legacy unique name case-insensitive across all rows in same college; no DB unique index (LectureHallServiceImpl.java:76-86).
- vNext now: vNext DB partial unique index only ACTIVE names, so archived same name can coexist (lecture-halls.ts:17-18).
- Fix: Confirm expected name reuse after archive and prevent duplicate active restore conflicts with clear error.

## G2-6-030-048  [P1] GAP  facet F12  effort M
- Legacy: Legacy delete blocked if any class schedule, regardless future/past (LectureHallServiceImpl.java:143-152).
- vNext now: vNext archive blocked when upcoming scheduled class only, historical schedules remain (lecture-hall-service.ts:289-307).
- Fix: Document archive-only future guard and historical usage rule; verify retention and reporting.

## G2-6-030-050  [P1] GAP  facet F13  effort M
- Legacy: Legacy departments error warns assignment unavailable but create still allowed without department, with Retry button (LectureHalls.js:306-310,328-336).
- vNext now: vNext Promise.all listDepartments rejects entire render if directory fails (admin/lecture-halls/page.tsx:44-58).
- Fix: Make department optional dependency recoverable, keep room create/edit usable.

## G2-6-030-064  [P1] GAP  facet F20  effort M
- Legacy: Legacy cancel edit checks dirty snapshot before closing, blocks during saving (LectureHalls.js:20-27,173-186).
- vNext now: vNext Dialog onOpenChange closes even dirty; pending guard only (lecture-hall-manager.tsx:250-263).
- Fix: Add snapshot-based unsaved-change protection and concurrent save denial.

## G2-6-030-067  [P1] GAP  facet F21  effort M
- Legacy: Legacy room service checks classScheduleRepository.countByLectureHallId across all schedules before physical delete (LectureHallServiceImpl.java:143-152).
- vNext now: vNext references sectionScheduleEvents future status/endsAt and schedule conflict helper (lecture-hall-service.ts:289-307).
- Fix: Audit class schedule/integration dependency and historical delete/restore semantics.

## G2-6-030-030  [P2] GAP  facet F07  effort S
- Legacy: Legacy required errors Please select college, Please enter room name, Select a room type (LectureHalls.js:316,343,354).
- vNext now: vNext generic Banner Enter a name. and programmatic type default, selected-college gate (lecture-hall-manager.tsx:109-113,267-272).
- Fix: Show exact inline messages for required fields and no invisible default.

## G2-6-030-032  [P2] GAP  facet F07  effort S
- Legacy: Legacy duplicate name exact A lecture hall named "X" already exists in this college (LectureHallServiceImpl.java:76-87).
- vNext now: vNext generic Another active hall in this college already has that name. (lecture-hall-manager.tsx:58-76).
- Fix: Restore exact duplicate text including name, or document active-only uniqueness shift.

## G2-6-030-035  [P2] GAP  facet F08  effort S
- Legacy: Legacy create error Could not create the room. Try again.; update Could not save the room. Try again.; delete Could not delete the room. Try again. (LectureHalls.js:140-147,206-225).
- vNext now: vNext default Something went wrong. Please try again. and network Could not save the hall. Check your connection and retry. (lecture-hall-manager.tsx:58-76,135-148).
- Fix: Use exact operation-specific fallback toasts, preserving actionable structured codes.
