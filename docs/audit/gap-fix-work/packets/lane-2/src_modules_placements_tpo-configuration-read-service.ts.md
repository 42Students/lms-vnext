# Work packet: edit src/modules/placements/tpo-configuration-read-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md, docs/audit/gap2/lane-3/job-types.md

## G2-2-030-010  [P1] GAP  facet F04  effort L
- Legacy: ChoicesController.java:39-81 top-level object includes genders,jobTypes,outcomes,outcomeLabels,driveModes,registrationChoices,educationTypes,gradingTypes,codingPlatforms,recruiterLeadSources,branches,passingYears.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 returns `{ready,rows}` for job types only; outcome service :38-57 `{ready,labels,version}`.
- Fix: Document 12 keys and compose typed catalog response or compatibility map; avoid requiring individual consumer discovery.

## G2-3-011-009  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:110-132`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:22-26`, `src/components/tpo/tpo-job-types-editor.tsx:75-86`
- Fix: Legacy counts nondeleted drives per job type and displays 0; vNext does not query/show Drives count. Add scoped grouped usage query and table column.

## G2-3-011-031  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:32-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-73`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:12-26`, `src/app/(authenticated)/tpo/settings/job-types/page.tsx:10-22`
- Fix: Legacy shared choices produces built-ins for no-college caller, college-visible list for college; vNext read function requires TPO manager so drive actors cannot query same authoritative choice list. Provide scoped consumer read.

## G2-2-030-024  [P2] GAP  facet F07  effort M
- Legacy: useChoices.js:25-26 catches catalog fetch error and returns FALLBACK_CHOICES rather than throwing.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 returns readiness false when table missing but no global fixed fallback.
- Fix: Provide trusted fixed fallback plus retriable tenant catalog errors; never cache unauthorised custom lists.

## G2-2-030-028  [P2] GAP  facet F08  effort S
- Legacy: ChoicesController.java:82 returns fixed and tenant choices without status wrapper.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:26-28 returns `{ready,rows}` and outcome label read returns version.
- Fix: Normalize HTTP 200 response parser and success-state rendering across consuming forms.
