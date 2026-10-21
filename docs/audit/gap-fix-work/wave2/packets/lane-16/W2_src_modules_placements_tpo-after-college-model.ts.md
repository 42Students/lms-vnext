# Work packet (wave 2): edit src/modules/placements/tpo-after-college-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-002  [P2] GAP  facet F01  effort M
- Legacy: ChoicesService.js:1-4 and useChoices.js:17-40 request once and share across pages.
- vNext now: src/modules/placements/tpo-after-college-model.ts:21-30 serves synchronous local options; tpo-configuration-read-service.ts:12-28 separately queries DB.
- Fix: Provide shared options acquisition/cache and unified loading state without stale tenant leakage.

## G2-2-030-007  [P2] GAP  facet F03  effort M
- Legacy: ChoicesController.java:28 registration labels Placements/Higher studies/Not interested.
- vNext now: src/modules/placements/tpo-after-college-model.ts:4-30 uses independent after-college outcome set.
- Fix: Expose registration intent options separately from outcome, same three labels/codes.

## G2-2-030-011  [P2] GAP  facet F04  effort M
- Legacy: ChoicesController.java:100-109 common choices use objects `{value,label}`; metadata added for richer options at :41-75.
- vNext now: src/modules/placements/tpo-after-college-model.ts:21-30 emits `{value,label}` but codingProfile model :2-7 uses enum/host record.
- Fix: Normalize option object shape and retain specialized metadata.

## G2-2-030-012  [P2] GAP  facet F04  effort M
- Legacy: ChoicesController.java:50-54 returns `settable` boolean for outcome options.
- vNext now: src/modules/placements/tpo-after-college-model.ts:17-22 returns only manually settable outcomes and does not return `settable` flag.
- Fix: Support complete outcome list and per-option `settable` metadata for read-only reports.

## G2-2-030-017  [P2] MISSING  facet F05  effort M
- Legacy: ChoicesController.java:79-81 sorts CAST(passing_year AS CHAR) lexically ORDER BY 1.
- vNext now: src/modules/placements/tpo-after-college-model.ts:21-30 has static options, no passing-year query.
- Fix: Choose intentionally lexical string sorting, not numeric `year` sort unless approved.

## G2-2-030-058  [P2] GAP  facet F19  effort S
- Legacy: useChoices.js:17-27 shares one inflight Promise across concurrent consumers.
- vNext now: src/modules/placements/tpo-after-college-model.ts:21-30 has constant array; dynamic TPO settings loads independently.
- Fix: Deduplicate concurrent options fetches keyed by tenant and scope.

## G2-2-030-065  [P2] GAP  facet F21  effort M
- Legacy: useChoices.js:17-27 shared cache resets via resetChoicesCache on events.
- vNext now: src/modules/placements/tpo-after-college-model.ts:21-30 static read with no cache invalidation.
- Fix: Invalidate tenant-aware dynamic options after job type/outcome label settings edits.

## G2-2-030-066  [P2] GAP  facet F22  effort M
- Legacy: ChoicesController.java:26-28/57-75 static lists defined in source, no catalog table.
- vNext now: src/modules/placements/tpo-builtin-job-types.ts:1-14 and tpo-after-college-model.ts:4-30 have separate constants.
- Fix: Centralize fixed constants to prevent divergence and document versioned values.

## G2-2-030-015  [P3] GAP  facet F05  effort S
- Legacy: ChoicesController.java:37-82 uses LinkedHashMap, stable field order.
- vNext now: src/modules/placements/tpo-after-college-model.ts:4-30 defines one local ordered option list.
- Fix: Make catalog key and option ordering deterministic across consumers.

## G2-2-030-055  [P3] GAP  facet F18  effort S
- Legacy: ChoicesController.java:28 `Higher studies`, `Not interested`.
- vNext now: src/modules/placements/tpo-after-college-model.ts:10-16 has outcome labels; not identical registration category copy by design.
- Fix: Maintain registration-specific choice copy where intent is collected.
