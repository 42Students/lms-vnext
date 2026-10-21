# Work packet: edit src/modules/academics/college-term-mapping-service.ts (part 2 of 2)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-5-025-065  [P1] GAP  facet F23  effort M
- Legacy: Legacy standalone staffing gap report per class and course. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- vNext now: vNext adds real active delivery staffing warning but changes scope. `src/modules/academics/college-term-mapping-service.ts:97-132`
- Fix: Retain source-equivalent report and useful active-delivery warning.

## G2-5-025-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy credits 0..30, courseOrder>=1, checks course exists. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-48`
- vNext now: vNext credits 1..10, course must be ACTIVE and belong to acting college. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/modules/academics/college-term-mapping-service.ts:143-148`
- Fix: Document deliberate stricter credit range; flag old 0,>10 mappings.

## G2-5-025-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy cross-college course add returns forbidden with exact college message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:346-357,399-407`
- vNext now: vNext filters active course in college and returns COURSE_NOT_FOUND. `src/modules/academics/college-term-mapping-service.ts:143-148,300-305`
- Fix: Show harmless but informative same-college error while hiding foreign IDs.

## G2-5-025-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy empty mappingIds gives `mappingIds is required`; missing/foreign gives 400/403. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:566-585`
- vNext now: vNext position invalid leads TERM_COURSE_POSITION_INVALID, no list payload. `src/modules/academics/college-term-mapping-model.ts:15-21`, `src/modules/academics/college-term-mapping-service.ts:176-207`
- Fix: Expose expected full-list reorder errors/validation UI.
