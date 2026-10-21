# Work packet: edit src/modules/placements/hr-drive-draft-model.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md, docs/audit/gap2/lane-4/l12-u015-job-role-option.md

## G2-11-004-039  [P1] GAP  facet F06  effort S
- Legacy: CTC required unless pure Internship `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:374`
- vNext now: Required unless Internship OR some annual range values supplied `src/modules/placements/hr-drive-draft-model.ts:67`
- Fix: Keep legacy CTC requirement for other job types

## G2-11-004-040  [P1] GAP  facet F06  effort S
- Legacy: Stipend required for pure Internship only `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:384`
- vNext now: Positive stipend required for both Internship and Internship+fulltime `src/modules/placements/hr-drive-draft-model.ts:64`
- Fix: Align stipend requirement for combined job type

## G2-11-004-041  [P1] GAP  facet F06  effort S
- Legacy: Unnamed optional rounds filtered during payload serialization `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:398`
- vNext now: Round names required min2, max120, duplicates prohibited `src/modules/placements/hr-drive-draft-model.ts:16`
- Fix: Allow optional blank rows to be omitted; cap legacy 100

## G2-11-004-044  [P1] GAP  facet F06  effort M
- Legacy: Passing years 2000–2100 list; multiple allowed `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:410`
- vNext now: Single 20xx year string `src/modules/placements/hr-drive-draft-model.ts:44`
- Fix: Support multiple passing years in schema/API

## G2-11-004-045  [P1] GAP  facet F06  effort S
- Legacy: Fixed+variable may be less than CTC; only >CTC is rejected `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:379`
- vNext now: Also rejects sum below CTC by more than 0.01 `src/modules/placements/hr-drive-draft-model.ts:74`
- Fix: Remove unexpected equality requirement

## G2-11-004-074  [P1] GAP  facet F12  effort S
- Legacy: Round row with empty name discarded before POST `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:43`
- vNext now: Zod rejects empty persisted round and caps quantity `src/modules/placements/hr-drive-draft-model.ts:16`
- Fix: Remove empty rows before validate; preserve optional rounds

## G2-11-004-117  [P1] GAP  facet F22  effort L
- Legacy: Legacy fields jobTitle/jobDescription/jdUrl/location/jobType/roleOptions/eligibility `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:49`
- vNext now: VNext normalized draft fields and additional bond/work modes `src/modules/placements/hr-drive-draft-model.ts:19`
- Fix: Define lossless migration including JD and passingYears

## G2-11-004-118  [P1] GAP  facet F22  effort M
- Legacy: Legacy eligibility `passingYears[]` and branch tags `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:75`
- vNext now: VNext single passingYear `src/modules/placements/hr-drive-draft-model.ts:44`
- Fix: Make array across Drizzle/API/read models

## G2-12-015-001  [P1] GAP  facet F01  effort M
- Legacy: Packages nested in legacy TPO DriveForm.roleOptions `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:47-49`, created in Pay packages `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620-642`
- vNext now: Normalized placementJobRoleOptions `src/db/schema/placements.ts:625-665`; HR salary draft is single group `src/modules/placements/hr-drive-draft-model.ts:31-41`
- Fix: Provide repeatable per-drive pay packages in equivalent entry flow.

## G2-12-015-017  [P1] GAP  facet F06  effort M
- Legacy: Stipend min=0 and months min=1 `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:634-635`
- vNext now: HR draft requires positive stipend for internship and omits duration `src/modules/placements/hr-drive-draft-model.ts:64-69`
- Fix: Support per-package duration and zero-empty distinctions.

## G2-12-015-018  [P1] GAP  facet F07  effort M
- Legacy: Publish blocker 'Set the pay (CTC or stipend) for at least one package' `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:443-444`
- vNext now: New schema validates CTC and stipend separately by type `src/modules/placements/hr-drive-draft-model.ts:64-70`
- Fix: Preserve multi-package pay preflight and field targeting.

## G2-12-015-026  [P1] GAP  facet F12  effort M
- Legacy: Historical bondNone/bondMonths/bondAmount ignored since 8 Oct `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java:9-11`
- vNext now: bondMonths/bondAmount are typed and available again `src/db/schema/placements.ts:659-660`; `src/modules/placements/hr-drive-draft-model.ts:40-41`
- Fix: Document owner change or remove bond editing.

## G2-11-004-048  [P2] GAP  facet F07  effort S
- Legacy: Students need to know the stipend `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:384`
- vNext now: Exact error preserved; additional mixed internship gate `src/modules/placements/hr-drive-draft-model.ts:65`
- Fix: Retain text but restrict required branch to pure internship

## G2-12-015-020  [P2] GAP  facet F08  effort M
- Legacy: Legacy pay preflight errors added as form problems `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:443-444`
- vNext now: Zod adds field-path issues with different strings `src/modules/placements/hr-drive-draft-model.ts:64-82`
- Fix: Align preflight validation placements and exact phrases.
