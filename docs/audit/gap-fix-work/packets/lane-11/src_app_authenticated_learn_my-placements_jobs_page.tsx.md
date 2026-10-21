# Work packet: edit src/app/(authenticated)/learn/my-placements/jobs/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md

## G2-14-005-015  [P1] GAP  facet F04  effort L
- Legacy: Legacy card title job.jobTitle, companyName, raw jobType chip; vNext job+role option may produce multiple role cards per drive — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:165-193`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:12-56`; `src/components/placements/learner-placement-jobs.tsx:520-540`
- Fix: Retain role-option data but present legacy job-level grouping with role subchoices

## G2-14-005-039  [P1] GAP  facet F06  effort M
- Legacy: Legacy save button disabled if saved-ID fetch unavailable or already in-flight; vNext own button enabled on initial source failure because savedIds prop empty — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:249-259,485-486`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:10-35`; `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:61-77`
- Fix: Propagate bookmark loading-error status and disable action until state known

## G2-14-005-040  [P1] GAP  facet F07  effort S
- Legacy: Legacy saved support failure explicit Your saved jobs could not be fully loaded ... Retry saved jobs; vNext treats no saved as empty — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:934-940`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:240-245`; `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:61-77`
- Fix: Distinguish bookmark API failure from zero saved records with Retry

## G2-14-005-050  [P1] GAP  facet F10  effort L
- Legacy: Legacy parallel getAllJobsWithEligibility, saved ids, saved jobs, learner applications and follow-up getApplyChecks (100); vNext direct authorized DB joins one server fetch+saved jobs — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:385-449`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-63`; `src/modules/placements/learner-job-service.ts:52-89`; `src/modules/placements/saved-job-service.ts:72-95`
- Fix: Ensure equivalence of active visibility, applications stage and held offers in one service

## G2-14-005-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy one job listing object with free-form ctcRange/location/jobType; vNext normalized job + roleOption, company and application join — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:132-151,220-245`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:12-56`; `src/modules/placements/learner-job-service.ts:67-89`
- Fix: Provide typed translation of all legacy card fields per role and group legacy job cards

## G2-14-005-041  [P2] GAP  facet F07  effort S
- Legacy: Legacy listing primary fetch failure Failed to load drives. Please try again. + Retry; vNext SSR fetch errors propagate boundary rather than in-list retry — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:451-459,1002-1020`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-79`
- Fix: Add exact in-list fallback and retry control

## G2-14-005-042  [P2] GAP  facet F07  effort M
- Legacy: Legacy support failures warning Some drive details could not be loaded + saved/application detail text; vNext no partial warning — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1082-1094`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-79`; `src/components/placements/learner-jobs-browse.tsx:225-228`
- Fix: Render partial-data warning with precise details and Retry

## G2-14-005-046  [P2] GAP  facet F08  effort M
- Legacy: Legacy refresh warning Couldn't refresh drive listings and Showing the last results we loaded.; vNext SSR replacement no stale banner — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1096-1108`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-79`
- Fix: Preserve last successful list on failed refresh and exact banner
