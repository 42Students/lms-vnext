# Work packet (wave 2): edit src/modules/placements/tpo-builtin-job-types.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md, docs/audit/gap2/lane-3/job-types.md

## G2-2-030-008  [P2] GAP  facet F03  effort M
- Legacy: ChoicesController.java:41-47 includes `builtin` and `countsAsPlaced` on job type options.
- vNext now: src/modules/placements/tpo-builtin-job-types.ts:1-14 exposes fixed label/placed default; custom rows in tpo-configuration-read-service.ts:12-28.
- Fix: Compose builtins + visible custom and explicit metadata in every job type selector.

## G2-2-030-018  [P2] GAP  facet F05  effort M
- Legacy: ChoicesController.java:42-47 delegates job type order and visibility to JobTypeService.visible(college).
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 returns DB rows; builtins separate `tpo-builtin-job-types.ts:2-8`.
- Fix: Merge visible builtins/custom in authoritative display order; respect college hidden flags.

## G2-2-030-033  [P2] MISSING  facet F10  effort M
- Legacy: ChoicesController.java:76-81 branches/years are derived live, no write side effects.
- vNext now: src/modules/placements/tpo-builtin-job-types.ts:2-8 immutable in-process, no dynamic branch query.
- Fix: Implement read-only SQL/Drizzle learner selectors; avoid writing to catalog during GET.

## G2-2-030-066  [P2] GAP  facet F22  effort M
- Legacy: ChoicesController.java:26-28/57-75 static lists defined in source, no catalog table.
- vNext now: src/modules/placements/tpo-builtin-job-types.ts:1-14 and tpo-after-college-model.ts:4-30 have separate constants.
- Fix: Centralize fixed constants to prevent divergence and document versioned values.

## G2-3-011-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-67`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypes.java:11-18`
- vNext now: `src/modules/placements/tpo-builtin-job-types.ts:2-8`, `src/modules/placements/tpo-configuration-read-service.ts:22-25`, `src/app/(authenticated)/tpo/settings/job-types/page.tsx:17-21`
- Fix: Legacy returns fixed builtins first in declared order followed by saved custom order, including hidden; vNext alphabetically sorts persisted rows and shows custom above collapsed builtins. Preserve legacy ordering.
