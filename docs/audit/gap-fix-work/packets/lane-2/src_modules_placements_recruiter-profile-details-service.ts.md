# Work packet: edit src/modules/placements/recruiter-profile-details-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-028  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:245-252 — Mobile optional, blank clears, validates 10-digit.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:22-26,66-72 — Digits extracted last10, may truncate long input rather than reject.
- Fix: Reject invalid extra-digit/malformed phone instead of slicing

## G2-10-025-033  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:249-251 — Bad phone returns INVALID_MOBILE + exact 10-digit message.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:22-26 — Slices last10 without matching error copy.
- Fix: Validate truly 10 digits and show source message

## G2-10-025-061  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:245-252 — Mobile may be cleared; invalid rejects.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:22-26,66-72 — Contact table optional, explicit clear, but input slices last10.
- Fix: Enforce original 10-digit semantics

## G2-10-025-031  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:233-235 — Blank firstName returns FIRST_NAME_REQUIRED.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:16-20 — New Zod input validation different error key.
- Fix: Map exact field error in profile editor
