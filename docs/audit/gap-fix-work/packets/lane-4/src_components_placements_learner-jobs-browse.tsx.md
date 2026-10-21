# Work packet: edit src/components/placements/learner-jobs-browse.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-16/u013-job-search-dto.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-14-005-026  [P1] GAP  facet F05  effort M
- Legacy: Legacy Eligible only based on visibleFlag; vNext canApply and deadline checks also used, changing matching population — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:584-592,615-629`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:94-106`; `src/components/placements/learner-jobs-browse.tsx:172-192`
- Fix: Define equivalent eligibility filter with visibility plus college policy and closure

## G2-14-005-031  [P1] GAP  facet F05  effort S
- Legacy: Legacy URL Saved facet `?tab=saved`; vNext reads `?saved=1`, losing saved-tab old deep links — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:334-336`
- vNext now: `src/modules/placements/learner-drive-url-model.ts:6-33`; `src/components/placements/learner-jobs-browse.tsx:89-90`
- Fix: Support tab=saved legacy alias, canonicalize only after preserving state

## G2-14-005-032  [P1] GAP  facet F05  effort S
- Legacy: Legacy filtered Reset clears q,type,loc,eligible,soon but retains tab/sort; vNext Clear filters navigates pathname and loses saved tab and sort — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:707-716`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:205-209`
- Fix: Keep current tab+sort when clearing filter facets

## G2-14-005-033  [P1] GAP  facet F05  effort M
- Legacy: Legacy browse defaults All tab and not-open in separate collapsed section; vNext all roles count includes not-open in pagination, collapsed by current page — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:663-690,870-905`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:90-99,273-286`
- Fix: Page only open roles, show all not-open in distinct group counted independently

## G2-14-005-040  [P1] GAP  facet F07  effort S
- Legacy: Legacy saved support failure explicit Your saved jobs could not be fully loaded ... Retry saved jobs; vNext treats no saved as empty — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:934-940`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:240-245`; `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:61-77`
- Fix: Distinguish bookmark API failure from zero saved records with Retry

## G2-14-005-078  [P1] GAP  facet F19  effort M
- Legacy: Legacy pageSize20 open jobs only, nonopen and expired outside paging; vNext pageSize20 includes all matches before splitting into sections — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:684-690,824-905`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:90-99,273-296`
- Fix: Paginate each top-level partition consistently with legacy

## G2-16-013-004  [P1] GAP  facet F02  effort M
- Legacy: JobSearchDTO.java:54-65 concatenates searchable text from eight fields.
- vNext now: learner-jobs-browse.tsx:90-95 delegates to client filterLearnerPlacementJobs.
- Fix: Restore multi-field full-text search covering responsibilities, dept/program and type.

## G2-16-013-010  [P1] GAP  facet F05  effort M
- Legacy: JobSearchDTO.java:54-65 search title, company, desc, responsibilities, type, location, department, program.
- vNext now: JobSearchController.java:193-200 uses this combined string; learner-jobs-browse.tsx:90-95 model-based filter.
- Fix: Test all eight search fields, especially targetDepartmentName and targetProgramName.

## G2-16-013-011  [P1] GAP  facet F05  effort M
- Legacy: JobSearchCache.java:79-107 synonym expansion configured for SDE, WFH, hybrid, etc.
- vNext now: learner-jobs-browse.tsx:74-81 350ms local q update without synonym expander.
- Fix: Restore job synonym matching if owner requires search v2 parity.

## G2-16-013-021  [P1] GAP  facet F10  effort L
- Legacy: JobSearchController.java:121-213 search returns Response<List<JobSearchDTO>>.
- vNext now: learner-jobs-browse.tsx:90-95 filters passed-in preloaded client items, no search API in component.
- Fix: Implement server-side scoped search for large data and legacy response compatibility.

## G2-16-013-029  [P1] GAP  facet F13  effort M
- Legacy: JobSearchCache.java:140-142 load failure logs error, cache may remain empty.
- vNext now: learner-jobs-browse.tsx:240-260 shows `No matching drives`/No published without distinct data-load failure.
- Fix: Differentiate service load outage from genuinely zero open jobs.

## G2-16-013-043  [P1] GAP  facet F23  effort L
- Legacy: JobSearchDTO.java:54-65 eight-source searchable concatenation.
- vNext now: learner-jobs-browse.tsx:90-95 typed filter service, vNext UI search only title/company/location visible.
- Fix: Reconcile missing eight-field search, targeting, synonym and ranking behaviors in full fix list.

## G2-3-019-003  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-543`, `658-678`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:89-100`, `264-272`
- Fix: Legacy saved view pools original saved jobs with current jobs, separates closed/deadline-passed saved rows under Expired. VNext saved bookmark service removes nonpublished or out-of-feed jobs, so Expired section cannot show lost items. Add authorized limited historic bookmark projection.

## G2-3-019-012  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:542-543`, `675-678`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:88-99`, `240-272`
- Fix: Legacy Saved count includes retained archived/expired bookmarked jobs, vNext savedSummary computes only current visible intersection and displays `Saved (N)` truncated. Include historical authorized count and Expired section.

## G2-3-019-044  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-543`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:88-100`
- Fix: Legacy Saved tab's central contract — bookmarked closed/expired drives remain visible until unsaved — is not implemented in vNext despite a persisted saved record. Restore or record owner-approved removal.

## G2-14-005-042  [P2] GAP  facet F07  effort M
- Legacy: Legacy support failures warning Some drive details could not be loaded + saved/application detail text; vNext no partial warning — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1082-1094`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-79`; `src/components/placements/learner-jobs-browse.tsx:225-228`
- Fix: Render partial-data warning with precise details and Retry

## G2-16-013-018  [P2] GAP  facet F07  effort S
- Legacy: JobSearchDTO.java:54-65 skips null search fields silently.
- vNext now: learner-jobs-browse.tsx:90-95 model-based filter may require nonnull values.
- Fix: Normalize nullable employer/role/search values before compare.

## G2-16-013-017  [P3] GAP  facet F07  effort S
- Legacy: JobSearchDTO.java:46-49 avoids null title display errors.
- vNext now: learner-jobs-browse.tsx:90-95 assumes valid nested card item.
- Fix: Validate missing/blank title display with fallback rather than crash.
