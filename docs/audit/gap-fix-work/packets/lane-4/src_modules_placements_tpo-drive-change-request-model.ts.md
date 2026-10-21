# Work packet: edit src/modules/placements/tpo-drive-change-request-model.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md, docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-16-025-005  [P1] GAP  facet F03  effort M
- Legacy: DriveChangeRequestService.java:49-54 10 field labels Role title, Description, Location, Job type, Mode, Deadline, CTC, Stipend, Minimum CGPA, Branches, Other.
- vNext now: tpo-drive-change-request-model.ts:3-5 only DEADLINE,PAY,ELIGIBILITY,LOCATION,ROUNDS,OTHER.
- Fix: Restore individually addressable legacy fields, mapping PAY vs CTC/STIPEND and ELIGIBILITY vs CGPA/BRANCHES.

## G2-16-025-014  [P1] GAP  facet F06  effort M
- Legacy: DriveChangeRequestService.java:103-107 OTHER always ASK, no proposed value; note required.
- vNext now: tpo-drive-change-request-model.ts:3-5 ANY field requires proposedValue>=2 and reason>=3.
- Fix: Allow OTHER ask with explanatory note but no proposed value, do not force invented replacement.

## G2-16-025-016  [P1] MISSING  facet F06  effort M
- Legacy: DriveChangeRequestService.java:117 multiple role CTC/STIPEND proposals disallowed.
- vNext now: tpo-drive-change-request-model.ts:3-5 has PAY aggregated, no multi-role guard.
- Fix: Prohibit ambiguous multi-role pay changes, show exact fallback suggestion.

## G2-16-025-034  [P1] GAP  facet F12  effort M
- Legacy: DriveChangeRequestService.java:103-105 OTHER always ASK; ASK no proposed value required.
- vNext now: tpo-drive-change-request-model.ts:3-5 required proposedValue even ASK.
- Fix: Treat ASK as prompt-only, never applied until recipient answers.

## G2-5-023-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy ASK hides proposed input; OTHER hides mode and requires note; normal note is optional. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:185-193`
- vNext now: vNext requires proposedValue length>=2 AND reason length>=3 for every mode/field. `src/modules/placements/tpo-drive-change-request-model.ts:2-9`, `src/components/placements/tpo-drive-change-requests.tsx:67-76`
- Fix: Make ASK/OTHER text required in correct conditional field; make note optional for non-OTHER.

## G2-5-023-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy kind values `PROPOSE
- vNext now: ASK` and always nonempty proposedValue, reason mandatory max1000. `src/modules/placements/tpo-drive-change-request-model.ts:2-9`
- Fix: Align request-kind enum and per-field defaults while handling stored vNext SUGGEST.

## G2-5-023-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy answers use special DatePicker/Mode/Job type selection and Decline max1000; answer max2000. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:196-214`
- vNext now: vNext single free-text note >=3 for Accept, Answer, Decline and Withdraw (max2000). `src/components/placements/tpo-drive-change-requests.tsx:94-107`, `src/modules/placements/tpo-drive-change-request-model.ts:6-9`
- Fix: Use typed Answer editor and separate decline rationale; allow Accept without mandatory note.

## G2-5-023-025  [P1] GAP  facet F07  effort L
- Legacy: Legacy validates deadline future, pay nonnegative/CTC<=1000, CGPA<=10, role-title 3–255, location<=255, type<=100, branches nonblank. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:358-389`
- vNext now: vNext validates generic string lengths and enum only; no field-specific value validation. `src/modules/placements/tpo-drive-change-request-model.ts:2-9`
- Fix: Recreate field-specific normalized validations with exact errors.

## G2-5-023-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy exact errors `This one asks for a detail: answer it instead`, `Type the answer`, `Type a reason`, and settled/over checks. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:156-158,175-178,199-204`
- vNext now: vNext allows any recipient decision regardless of kind; generic invalid state and min3 note. `src/modules/placements/tpo-drive-change-request-service.ts:131-145`, `src/modules/placements/tpo-drive-change-request-model.ts:6-9`
- Fix: Validate action against ASK/PROPOSE and preserve distinct error feedback.

## G2-5-023-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy OTHER always ASK and ASK can't be accepted; only PROPOSE can be accepted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:102-105,154-158,173-191`
- vNext now: vNext does not constrain `mode+field+action` relationship. `src/modules/placements/tpo-drive-change-request-model.ts:2-9`, `src/modules/placements/tpo-drive-change-request-service.ts:138-149`
- Fix: Enforce mode/field transition matrix at UI and service.

## G2-5-023-046  [P1] GAP  facet F12  effort M
- Legacy: Legacy numeric equivalence uses BigDecimal; deadlines parsed and checked against now in UTC. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:330-355,358-389`
- vNext now: vNext has no numeric/date interpretation; raw text stored. `src/modules/placements/tpo-drive-change-request-model.ts:3-9`
- Fix: Implement decimal and date canonicalization with timezone-safe parsing.

## G2-16-025-019  [P2] GAP  facet F07  effort S
- Legacy: DriveChangeRequestService.java:119 `Give the new value, or ask for it instead`.
- vNext now: tpo-drive-change-request-model.ts:3-5 strict mode with proposedValue always required.
- Fix: Allow asking for a detail and show mode-specific message.

## G2-5-023-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy exact errors: `Pick what should change`, `Say what should change`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:102-107`
- vNext now: vNext Zod generic validation with `Could not save change request.`; UI omits field-level details. `src/modules/placements/tpo-drive-change-request-model.ts:3-5`, `src/components/placements/tpo-drive-change-requests.tsx:35-51`
- Fix: Show exact field-specific errors under controls, preserving legacy wording.

## G2-16-025-017  [P3] GAP  facet F07  effort S
- Legacy: DriveChangeRequestService.java:102 `Pick what should change`.
- vNext now: tpo-drive-change-request-model.ts:3-5 Zod field enum, generic error.
- Fix: Use exact selector validation message.

## G2-16-025-018  [P3] GAP  facet F07  effort S
- Legacy: DriveChangeRequestService.java:107 `Say what should change`.
- vNext now: tpo-drive-change-request-model.ts:3-5 proposed/reason both required.
- Fix: Validate OTHER note with legacy wording.
