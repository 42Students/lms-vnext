# Work packet: edit src/app/api/lecture-halls/error-response.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-4-027-032  [P2] GAP  facet F08  effort S
- Legacy: Not found hall returns 404 envelope `Lecture hall not found` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:132-143`)
- vNext now: JSON `{error:'HALL_NOT_FOUND'}` 404 (`src/app/api/lecture-halls/error-response.ts:4-17`)
- Fix: Translate code into original message in compatibility response.
