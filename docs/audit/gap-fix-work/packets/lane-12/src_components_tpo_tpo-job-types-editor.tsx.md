# Work packet: edit src/components/tpo/tpo-job-types-editor.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-3-011-009  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:110-132`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:22-26`, `src/components/tpo/tpo-job-types-editor.tsx:75-86`
- Fix: Legacy counts nondeleted drives per job type and displays 0; vNext does not query/show Drives count. Add scoped grouped usage query and table column.

## G2-3-011-018  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:138-142`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:154-159`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:75-89`, `src/modules/placements/tpo-job-type-write-service.ts:19-223`
- Fix: Legacy permits deletion of unused custom labels, disables action for in-use type with Used by drives: switch it off instead tooltip. vNext has no removal API/button. Add safe deletion.

## G2-3-011-048  [P1] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:32-45`, `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:130-137`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:57-58`, `src/components/tpo/tpo-draft-drive-step-one-form.tsx:113-120`
- Fix: Legacy /api/v1/choices powers drive forms, filters and reports; vNext explicitly says custom job types not integrated, draft selector has fixed three choices. Integrate authoritative type source at each consumer.

## G2-6-011-009  [P1] MISSING  facet F05  effort M
- Legacy: Old `visible()` excludes hidden from new drive choice `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:70-73`
- vNext now: New types editor filters active; downstream drive form not yet integrated `src/components/tpo/tpo-job-types-editor.tsx:20-21` `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Use active-only typed options in every drive type selector

## G2-6-011-010  [P1] MISSING  facet F05  effort M
- Legacy: Old `normalize` retains current hidden/older type on existing drive `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:89-105`
- vNext now: New independent job-type settings have no wired equivalent in drive mutation `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Permit grandfathered type on edit while forbidding selecting inactive for new drives

## G2-6-011-039  [P1] MISSING  facet F18  effort M
- Legacy: Old invalid type on drive `Job type must be one of ...` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:93-105`
- vNext now: New edit/create type settings have no drive normalization integration `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Connect drive validation error to same active type catalogue

## G2-6-011-044  [P1] MISSING  facet F21  effort M
- Legacy: Old drive form/filters/reports consume central `/api/v1/choices` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:12-16`
- vNext now: New settings UI explicitly says no downstream integration `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Wire type lookup in all job read/write/report paths

## G2-6-011-046  [P1] MISSING  facet F22  effort M
- Legacy: Old drive table `job.job_type` and `job.counts_as_placed` updated on rename/answer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:160-170`
- vNext now: New config row separate from job's current employment fields `src/db/schema/tpo-configuration.ts:22-39` `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Establish FK/reference or transactionally sync drive copies

## G2-6-011-048  [P1] GAP  facet F23  effort M
- Legacy: Old custom hidden type retained for older drives, new selectors exclude `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:89-105`
- vNext now: New editor supports inactive records but downstream connection not complete `src/components/tpo/tpo-job-types-editor.tsx:75-86` `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Preserve historical drive type value and prevent new selection

## G2-3-011-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:41-47`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:140-142`
- vNext now: `src/modules/placements/tpo-configuration-model.ts:6-8`, `src/components/tpo/tpo-job-types-editor.tsx:43-55`
- Fix: Legacy accepts 2-40 letters/digits/basic ASCII punctuation after collapsing whitespace; vNext also allows combining marks, rejects punctuation-only, and does not collapse interior spaces. Align normalization and pattern.

## G2-3-011-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:41-47`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:140-143`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:32-39`, `src/modules/placements/tpo-configuration-model.ts:6-8`
- Fix: Legacy exact duplicate error uses quoted offending name; vNext generic This job type already exists. Preserve field-level legacy message.

## G2-3-011-021  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:123`, `140-153`, `158-159`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:32-39`, `src/modules/placements/tpo-job-type-write-service.ts:19-81`
- Fix: Legacy specific errors Send the list of job types, Up to 30 job types of your own, Keep at least one job type switched on and in-use drive count; vNext error-code wording differs. Match exact messages per failure.

## G2-3-011-022  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:78-82`, `168-176`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:24-40`, `87-89`
- Fix: Legacy success Job types saved is a toast after whole-list PUT/cache reset; vNext inline success after some POST/PATCH actions and no feedback for rename. Use consistent success toast for completed changes.

## G2-3-011-023  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:168-171`
- vNext now: `src/components/tpo/tpo-job-types-editor.tsx:32-39`, `87-88`, `src/components/tpo/tpo-builtin-job-types-editor.tsx:27-31`
- Fix: Legacy save failure shows Job types were not saved dismissible Alert, server detail, Retry and toast; vNext inline notice without Retry. Restore alert/action and exact string.

## G2-6-011-018  [P2] GAP  facet F07  effort M
- Legacy: Old custom 2-40 length regex error embeds invalid name `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:140-141`
- vNext now: New show generic server schema error, client min/max `src/modules/placements/tpo-job-type-write-service.ts:13-13` `src/components/tpo/tpo-job-types-editor.tsx:47-50`
- Fix: Show original exact validation message and safe invalid-name preview

## G2-6-011-020  [P2] GAP  facet F08  effort M
- Legacy: Old duplicate error says `'X' is already a job type` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:140-142`
- vNext now: New maps TPO_JOB_TYPE_EXISTS to `This job type already exists.` `src/components/tpo/tpo-job-types-editor.tsx:31-38`
- Fix: Restore interpolated original message with escaped label

## G2-6-011-021  [P2] GAP  facet F08  effort M
- Legacy: Old last-visible error exact `Keep at least one job type switched on` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:150-153`
- vNext now: New `Keep at least one job type visible.` `src/components/tpo/tpo-job-types-editor.tsx:31-35`
- Fix: Use exact old wording
