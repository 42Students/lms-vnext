# Work packet (wave 2): edit src/components/placements/learner-jobs-browse.tsx (part 2 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/job-search-controller.md, docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-3/learner-saved-job.md, docs/audit/gap2/lane-16/u013-job-search-dto.md

## G2-17-013-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:321-346 — Categories returns distinct trimmed job types sorted case-insensitively.
- vNext now: src/components/placements/learner-jobs-browse.tsx:132-150 — Filter on employmentType and location, not legacy jobType categories.
- Fix: Provide job type choices and title label mapping.

## G2-17-013-008  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:367-384 — POST selection acknowledges `Selection recorded`.
- vNext now: src/components/placements/learner-jobs-browse.tsx:103-125 — Search opens links; no selection tracking evident in browse excerpt.
- Fix: Add scoped popularity event at opened job detail if approved.

## G2-17-013-029  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:367-388 — POST /{jobId}/select writes popularity usage.
- vNext now: src/components/placements/learner-jobs-browse.tsx:103-277 — Browse shows selectable drive cards; use event not evidenced.
- Fix: Add authorized job-view event if maintaining popularity model.

## G2-17-013-053  [P2] MISSING  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:367-382 — Popularity selector checks active job and caller org/college before writing.
- vNext now: src/components/placements/learner-jobs-browse.tsx:103-277 — No equivalent selection write.
- Fix: Do not add tracking unless purpose+privacy approved.

## G2-19-012-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy no pagination in saved-jobs service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:29-36`
- vNext now: vNext saved jobs returns all rows; browse handles filtering and 20-page UI `src/modules/placements/saved-job-service.ts:73-95` `src/components/placements/learner-jobs-browse.tsx:28-28`
- Fix: Verify savedOnly paging/counts remain correct at >20 saved drives.

## G2-3-019-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:330-355`, `730-754`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:104-112`, `240-244`
- Fix: Legacy learner Drives tabs use query `?tab=saved` and show All/Saved, vNext URL `?saved=1` with SegmentedControl. Map query aliases and exact tab labels.

## G2-3-019-011  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:330-355`, `615-656`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:83-100`, `194-209`
- Fix: Legacy Saved tab retains URL search/type/location/sort/page filters with 220ms debounce and page size20; vNext saves query state with 100-char search but different filters and pagination defaults. Match scoped filter keys/caps.

## G2-3-019-029  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:841-855`, `873-884`
- vNext now: `src/app/api/placements/learner/saved-jobs/route.ts:7-13`, `src/components/placements/learner-jobs-browse.tsx:240-244`
- Fix: Legacy missing bookmark service gracefully returns empty set/list and message `No saved jobs`; vNext DB table missing will throw, page server load fails. Add explicit not-ready fallback preserving safe state and disabling save.

## G2-3-019-030  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:391-411`, `477-511`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:104-112`, `src/components/placements/learner-save-drive-button.tsx:11-36`
- Fix: Legacy saved-IDs fetch failure disables heart toggles with `Saved drives are temporarily unavailable; retry loading.`; vNext saved-job read failure at server render does not produce same recoverable disabled state. Add failure-isolated data load/retry.

## G2-3-019-033  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:251-265`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:30-36`, `src/components/placements/learner-jobs-browse.tsx:126-132`
- Fix: Legacy heart icon has compact card control, vNext FilterChip min44px at mobile with text and expanded row. Compare exact placement at 375/768/1280 and preserve touch target.

## G2-3-019-037  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:658-678`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:267-271`
- Fix: Legacy Saved tab separates Expired and Not open to you with card labels; vNext Expired saved jobs only includes deadlinePassed published roles and omits closed status. Match closed/expired classification.

## G2-16-013-009  [P3] GAP  facet F04  effort S
- Legacy: JobSearchDTO.java:46-49 displayName jobTitle or empty string.
- vNext now: learner-jobs-browse.tsx:121,194-202 title search and role sorting.
- Fix: Use empty-string fallback consistently for missing titles.

## G2-16-013-016  [P3] GAP  facet F06  effort S
- Legacy: JobSearchDTO.java:54-65 toLowerCase called by controller on concatenated text.
- vNext now: learner-jobs-browse.tsx:74-81 search trim and length max100.
- Fix: Confirm normalization and 100-character safe cap are intentional.

## G2-16-013-028  [P3] GAP  facet F13  effort S
- Legacy: JobSearchDTO.java:46-49 title missing -> empty (not error).
- vNext now: learner-jobs-browse.tsx:240-260 has multiple no-result states.
- Fix: Validate blank jobTitle fields and no-results copy without route error.

## G2-16-013-034  [P3] GAP  facet F18  effort S
- Legacy: JobSearchDTO.java:46-49 displayName exactly raw jobTitle.
- vNext now: learner-jobs-browse.tsx:114-122 placeholder Search by title company location.
- Fix: Preserve raw job title case; do not humanize case of title itself.

## G2-16-013-035  [P3] GAP  facet F18  effort S
- Legacy: JobSearchController.java:210-212 `Jobs retrieved in Nms`.
- vNext now: learner-jobs-browse.tsx:225-228 `Showing N–M of K matching roles`.
- Fix: Keep old API message in compatibility response without displaying HTTP timing as UI copy.

## G2-16-013-038  [P3] GAP  facet F20  effort S
- Legacy: JobSearchDTO.java:54-65 builds search text each call, immutable DTO.
- vNext now: learner-jobs-browse.tsx:83-95 recomputes filter list on state updates.
- Fix: Memoize normalized search keys for thousands of cards.

## G2-17-013-046  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:210-213 — Response text `Jobs retrieved in Nms`.
- vNext now: src/components/placements/learner-jobs-browse.tsx:115-125 — UI copy `Search drives, companies and roles` / placeholder.
- Fix: Match wording only on legacy admin search, not global learner drive terminology.

## G2-19-012-004  [P3] GAP  facet F02  effort S
- Legacy: Legacy `getSavedJobIds` returns Set of all saved numeric IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:28-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerSavedJobServiceImpl.java:51-53`
- vNext now: vNext browser receives savedJobIds as UUID strings from own saved list `src/components/placements/learner-jobs-browse.tsx:34-42`
- Fix: Normalize display bookmarks to UUID saved set with correct order.

## G2-3-019-021  [P3] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:658-678`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:264-272`
- Fix: Legacy Expired heading lists closed saved opportunities separately; vNext rendering does so only for bookmarks still in current items. Restore missing historical rows without exposing now unauthorized data.
