# Work packet (wave 2): edit src/modules/placements/learner-jobs-browse-model.ts

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-15/l18-u013-job-search-cache.md, docs/audit/gap2/lane-17/job-search-controller.md, docs/audit/gap2/lane-9/l18-u013-job-search-cache.md

## G2-14-005-027  [P2] GAP  facet F05  effort S
- Legacy: Legacy Closing in 7 days uses local calendar-day differences ≤7 and excludes closed; vNext 7*24h from server snapshot — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:71-83,586-593`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:98-106`
- Fix: Use calendar-day cutoff in IST to match legacy including tomorrow boundary

## G2-14-005-028  [P2] GAP  facet F05  effort S
- Legacy: Legacy search index jobTitle,company,location,type,CTC,description, trimmed; vNext searches role/title/company/description/location but not type/CTC — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:545-563,615-625`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:111-119`
- Fix: Extend search blob with employment type and CTC

## G2-14-005-029  [P2] GAP  facet F05  effort S
- Legacy: Legacy `type` options known ordering Full-time,Part-time,Internship,Contract,Freelance,Remote + sorted others; vNext alphabetically sorts enums — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:60-60,595-605`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:66-74`; `src/components/placements/learner-jobs-browse.tsx:137-144`
- Fix: Map status/type labels and legacy priority ordering

## G2-14-005-057  [P2] GAP  facet F12  effort S
- Legacy: Legacy urgency at local today/tomorrow ≤3/≤7; vNext uses server timestamp snapshot and urgency helper — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:71-83`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:98-106`; `src/components/placements/learner-placement-jobs.tsx:134-140`
- Fix: Make threshold calendar aware and copy exact badges

## G2-14-005-084  [P2] GAP  facet F20  effort S
- Legacy: Legacy filter closing soon local moment calendar, vNext ISO server snapshot hour precision — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:71-83,586-593`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:98-106`; `src/modules/placements/learner-closing-drives-service.ts:9-18`
- Fix: Use explicit IST day boundaries and snapshot consistently

## G2-18-013-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy search DTO used by UI results; fields jobTitle/companyName/description/type/location/ctcRange/deadline; JobSearchDTO.java:19-38
- vNext now: vNext learner browse row job, company, roleOption with separate fields; learner-jobs-browse-model.ts:9-27
- Fix: Ensure visible cards preserve job/company/payment/date labels and avoid exposing restricted fields

## G2-18-013-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy search uses jobType as category label and companyName/location searchable; JobSearchCache.java:65-111
- vNext now: vNext learner employmentType and location facet choices; learner-jobs-browse-model.ts:39-51,66-85
- Fix: Align job type labels/badges and facet placeholder/help copy

## G2-18-013-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy popularity cache uses usage count or fallback, but org method returns first org jobs; GenericSearchCache.java:194-217;JobSearchCache.java:257-262
- vNext now: vNext deadline/title sort default; learner-jobs-browse-model.ts:49-51,121-147
- Fix: Do not label first-loaded jobs as popular; define explicit popularity signal or remove feature intentionally

## G2-18-013-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy cache also has getByDepartmentIdAndOrganization, ByProgram, ByJobType, ByCategory; JobSearchCache.java:265-302
- vNext now: vNext learner filters are employmentType/location/eligible/closingSoon/availability, not department or program selection; learner-jobs-browse-model.ts:39-51,88-118
- Fix: Decide if target department/program filters remain needed for administrators; do not expose other-college results

## G2-18-013-014  [P2] GAP  facet F05  effort S
- Legacy: Legacy getByJobType equalsIgnoreCase, optional filters deptId/programId; JobSearchCache.java:267-302;JobSearchController.java:173-190
- vNext now: vNext employmentType exact enum and facets case-fold; learner-jobs-browse-model.ts:66-85,107-110
- Fix: Normalize legacy job-type and vNext employmentType mapping with case insensitive exact matching

## G2-18-013-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy backend search query, limit default15, deptId/programId/jobType optional; JobSearchController.java:121-139
- vNext now: vNext filter object defaults search empty, employmentType all, location all, eligibleOnly false, closingSoon false, availability all, sort deadline; learner-jobs-browse-model.ts:39-51
- Fix: Preserve form query placeholders/defaults and adapt old optional fields to new URL safely

## G2-18-013-027  [P2] GAP  facet F12  effort M
- Legacy: Legacy synonyms include sde/swe/dev/remote/wfh/ai/ml/ux/frontend/backend and 29+ expansions; JobSearchCache.java:79-107
- vNext now: vNext substring filter of company/role/job title; learner-jobs-browse-model.ts:88-118
- Fix: If product requires synonyms, implement tenant-filtered search expansion, but note legacy scoped /search path did NOT call GenericSearchCache.search

## G2-18-013-041  [P2] GAP  facet F20  effort S
- Legacy: Legacy getByOrganizationId uses subList and no explicit limit validation, potential negative limit; JobSearchCache.java:219-224
- vNext now: vNext query schemas, URL validation; learner-jobs-browse-model.ts:39-51;learner-round-search-query-model.ts:4-17
- Fix: Clamp numeric limits >=0, guard hostile long query/special characters

## G2-17-013-012  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:127-138 — Default search query empty and limit=15.
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:49-51 — Browse default search empty, with no 15-result initial cap.
- Fix: Match 15-option default for legacy typeahead endpoint only.

## G2-17-013-014  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:193-203 — Substring search `searchableText.toLowerCase().contains(query.toLowerCase())`; no trimming query.
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:88-118 — Trims and locale-lowercases search; multiple strings joined.
- Fix: Specify whitespace/case behavior; don't assume fuzzy synonyms.

## G2-17-013-016  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:215-230 — Popular default 10, returns cache first limit.
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:49-51 — No popular facet or limit.
- Fix: Implement saved/popular sort separately from default deadline.

## G2-17-013-037  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:193-203 — Results truncated to limit before returning.
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:88-145 — Filter and sort full loaded result then page.
- Fix: Bound server execution for huge catalogs; keep deterministic page controls.

## G2-17-013-038  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:321-346 — Categories removes empty, distinct and alphabetical case-insensitive.
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:66-74 — Employment/location facets deduplicated and locale sorted.
- Fix: Use jobType facet only when intended; preserve casefold dedupe.

## G2-18-013-059  [P2] MISSING  facet F23  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:414-434 organization-scoped exists(jobTitle) exact case-insensitive check
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:111-118 browse contains search, not boolean exists endpoint
- Fix: Add exact-title uniqueness/exists query only for consumers requiring it.

## G2-18-013-037  [P3] GAP  facet F18  effort S
- Legacy: Legacy synonym UI search terms sde, swe, ft, pt, wfh; JobSearchCache.java:79-107
- vNext now: vNext location/employment labels and free search in learner-jobs-browse-model.ts:39-51
- Fix: Update user-facing search hints to reflect actual substring behavior; do not promise unsupported fuzzy

## G2-17-013-052  [P3] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:193-199 — Does not `.trim()` query before `contains`; empty whitespace query can mismatch.
- vNext now: src/modules/placements/learner-jobs-browse-model.ts:92-93 — Trims search and locale-lowercases.
- Fix: Document whitespace change.
