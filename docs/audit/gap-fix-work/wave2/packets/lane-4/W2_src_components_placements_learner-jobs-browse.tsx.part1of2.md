# Work packet (wave 2): edit src/components/placements/learner-jobs-browse.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-16/u013-job-search-dto.md, docs/audit/gap2/lane-17/job-search-controller.md

## G2-14-005-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy PageShell My Placements then Drives header+counts, All drives/Saved tabs, toolbar, cards; vNext Drives PageHeader and rules link then segmented Saved, filters, summary, list — `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:93-109`; `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1023-1071`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:65-79`; `src/components/placements/learner-jobs-browse.tsx:103-224`
- Fix: Match exact header/summary/tabs/filter ordering and placement of counts

## G2-14-005-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy filter toolbar one horizontal row search/sort/type/location then two facet chips; vNext search line, 2-column dropdown, availability segment and sort last — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:728-796`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:113-212`
- Fix: Restore desktop toolbar field order, sizes and chip location

## G2-14-005-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy saved expired and not-open collapsible sections after paged cards; vNext saved expired block and not-open per-page disclosure — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:841-905`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:263-286`
- Fix: Recreate separate expired/not-open section placement and group-wide counts

## G2-14-005-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy All drives and Saved AntD tab with saved-count badge; vNext segmented-control Saved (#) — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1047-1068`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:104-113`
- Fix: Use legacy tab typography, underline/selected state and badge shape

## G2-14-005-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy Clickable metric N saved in Drives header; vNext saved count only within segment, no header quicklink — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1025-1042`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:104-113,215-223`
- Fix: Add N saved header CTA opening saved tab

## G2-14-005-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy compact eligible/closing facet button with count and aria-pressed; vNext checkbox with no count next to label — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:772-788`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:172-192`
- Fix: Restore count chip and aria-pressed behavior

## G2-14-005-029  [P2] GAP  facet F05  effort S
- Legacy: Legacy `type` options known ordering Full-time,Part-time,Internship,Contract,Freelance,Remote + sorted others; vNext alphabetically sorts enums — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:60-60,595-605`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:66-74`; `src/components/placements/learner-jobs-browse.tsx:137-144`
- Fix: Map status/type labels and legacy priority ordering

## G2-14-005-030  [P2] GAP  facet F05  effort S
- Legacy: Legacy location filter each option includes count N; vNext location options lack count — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:574-613`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:147-156`
- Fix: Show count per location alongside option

## G2-14-005-035  [P2] GAP  facet F06  effort S
- Legacy: Legacy search input no maxLength; vNext maxLength100 and model max100 — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:731-740`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:113-123`; `src/modules/placements/learner-drive-url-model.ts:6-7`
- Fix: Decide legacy unbounded vs safe 100; if preserving limit show explicit counter/help

## G2-14-005-036  [P2] GAP  facet F06  effort S
- Legacy: Legacy search debounce 220ms and shallow router.replace; vNext 350ms and router.push — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:51-52,377-383`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:73-81,52-55`
- Fix: Use 220ms replace for typing to match back history semantics

## G2-14-005-038  [P2] GAP  facet F06  effort S
- Legacy: Legacy eligible and closing filters aria-pressed toggles; vNext checkbox checked — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:772-788`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:172-192`
- Fix: Use chip button semantics and pressed state, preserve focus

## G2-14-005-049  [P2] GAP  facet F09  effort M
- Legacy: Legacy type/location/sort use AntD select overlay; vNext native Select browser popup — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:742-769`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:134-204`
- Fix: Match legacy popup styling, option counts and keyboard typeahead

## G2-14-005-061  [P2] GAP  facet F13  effort S
- Legacy: Legacy no open jobs with empty illustration and line No open jobs right now, secondary college cell text; vNext new EmptyState and dashboard link — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:920-932`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:245-252`; `src/components/placements/learner-placement-jobs.tsx:511-517`
- Fix: Match no-open heading, SVG, subtitle and spacing

## G2-14-005-062  [P2] GAP  facet F13  effort M
- Legacy: Legacy filtered empty heading No jobs match {filterSummary} and Show all N jobs; vNext generic dynamic EmptyState reset — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:960-993`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:253-262`
- Fix: Render exact filter summary and both buttons

## G2-14-005-063  [P2] GAP  facet F13  effort S
- Legacy: Legacy saved empty illustration and Browse all jobs button; vNext simple No saved drives yet with text link — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:943-957`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:240-245`
- Fix: Restore illustration, CTA prominence and wording

## G2-14-005-064  [P2] GAP  facet F13  effort S
- Legacy: Legacy not-open empty note No drive is open to you right now ..., vNext collapsed disclosure with different explanation — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:799-804`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:273-284`
- Fix: Match zero-open warning above non-open group

## G2-14-005-069  [P2] GAP  facet F16  effort M
- Legacy: Legacy all controls toolbar horizontal on desktop; vNext checkbox/grid dropdown expands mobile and extra availability segment — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:728-796`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:113-213`
- Fix: Apply old breakpoint/spacing, mobile bottom sheet and focus return

## G2-14-005-074  [P2] GAP  facet F18  effort S
- Legacy: Legacy Type/Location/Sort vs vNext Employment type/Location/Sort by — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:741-769`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:134-204`
- Fix: Use short exact labels Type, Location, Sort

## G2-14-005-076  [P2] GAP  facet F18  effort S
- Legacy: Legacy Saved labels All drives/Saved and expired caption Expired; vNext Saved (#)/Expired saved jobs — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1047-1067,841-848`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:104-113,267-271`
- Fix: Restore Saved badge layout and Expired title, subtitle

## G2-14-005-077  [P2] GAP  facet F18  effort S
- Legacy: Legacy saved error Retry saved jobs; vNext no distinct retry prompt — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:934-940`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:240-245`
- Fix: Render action caption verbatim

## G2-14-005-081  [P2] GAP  facet F20  effort M
- Legacy: Legacy fetchJobs AbortController aborts stale GET on new request; vNext server rendering cancellation implicit, no user-visible last-success cache — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:385-393,453-463`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-79`; `src/components/placements/learner-jobs-browse.tsx:43-81`
- Fix: Keep last-success cards during refetch and handle abort/route changes

## G2-14-005-083  [P2] GAP  facet F20  effort S
- Legacy: Legacy URL filter changes shallow replace + reset page; vNext router.push and reset page via model — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:344-366`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:52-55`; `src/modules/placements/learner-drive-url-model.ts:35-53`
- Fix: Use replace not push for debounced typing, preserve Back as intended

## G2-16-013-001  [P2] GAP  facet F01  effort M
- Legacy: JobSearchDTO.java:11-19 is a server-side result DTO, no route or screen.
- vNext now: learner-jobs-browse.tsx:34-42 UI consumes LearnerPlacementJobItem instead.
- Fix: Document mapping of the old job search output to learner drive result contract.

## G2-16-013-002  [P2] GAP  facet F01  effort M
- Legacy: JobSearchController.java:36-40 old route /api/v2/jobs/search.
- vNext now: learner-jobs-browse.tsx:47-54 uses local URL q filters on preloaded items.
- Fix: Bridge old API clients through authorized compatibility endpoint if they remain.

## G2-16-013-003  [P2] GAP  facet F02  effort M
- Legacy: JobSearchDTO.java:21-38 flat job, company, targeting fields.
- vNext now: learner-jobs-browse.tsx:34-42 nested LearnerPlacementJobItem with job and application context.
- Fix: Expose or adapt flat DTO fields explicitly rather than relying on implicit nested projection.

## G2-16-013-005  [P2] GAP  facet F03  effort S
- Legacy: JobSearchDTO.java:21-24 id, title, company and logo.
- vNext now: learner-jobs-browse.tsx:90-98 nested job IDs and card UI.
- Fix: Map companyLogo and jobTitle faithfully for card/consumer; verify null fallback.

## G2-16-013-006  [P2] GAP  facet F03  effort M
- Legacy: JobSearchDTO.java:25-26 description and responsibilities separate.
- vNext now: learner-jobs-browse.tsx:90-95 client model filters preloaded jobs.
- Fix: Expose responsibilities as searchable field and detail text.

## G2-16-013-007  [P2] GAP  facet F03  effort M
- Legacy: JobSearchDTO.java:27-29 jobType/location/ctcRange flat.
- vNext now: learner-jobs-browse.tsx:136-203 employmentType/location/sort filters.
- Fix: Map jobType/ctcRange to employment types and CTC sortable band.

## G2-16-013-012  [P2] GAP  facet F05  effort M
- Legacy: JobSearchController.java:170-203 first org-scoped 1000, then match substring, limit15 default.
- vNext now: learner-jobs-browse.tsx:28,91-95 client filtered full preloaded list and 20/page.
- Fix: Apply scoped pagination and explicit result limit; avoid hiding >1000 jobs in old mode.

## G2-16-013-013  [P2] GAP  facet F05  effort M
- Legacy: JobSearchCache.java:267-283 filters department/program within organization.
- vNext now: learner-jobs-browse.tsx:134-158 has type and location filters, no department/program.
- Fix: Match department/program filtering on request URL where relevant.

## G2-16-013-014  [P2] GAP  facet F06  effort L
- Legacy: JobSearchDTO.java:40-43 stable integer ID getter.
- vNext now: learner-jobs-browse.tsx:88-99 uses UUID job.id string.
- Fix: Provide stable legacy integer→UUID mapping for compatible deep links if historic data retained.

## G2-16-013-022  [P2] GAP  facet F10  effort M
- Legacy: JobSearchController.java:215-234 popular lists org jobs default10.
- vNext now: learner-jobs-browse.tsx:215-228 displays all published drive summary, not popular list.
- Fix: Support popular endpoint semantics independently of learner drive list.

## G2-16-013-023  [P2] MISSING  facet F10  effort M
- Legacy: JobSearchController.java:367-387 POST selection increments usage.
- vNext now: learner-jobs-browse.tsx:240-287 link cards, no selection usage call.
- Fix: Record authorized selection where analytics still required.

## G2-16-013-027  [P2] GAP  facet F12  effort M
- Legacy: JobSearchDTO.java:35-38 target department/program IDs and display names.
- vNext now: learner-jobs-browse.tsx:136-158 type/location only, targeted eligibility folded into job cards.
- Fix: Expose target department/program for search/eligibility with correct scoped names.

## G2-16-013-030  [P2] GAP  facet F14  effort M
- Legacy: JobSearchDTO.java:24 companyLogo is string path, no direct file upload.
- vNext now: learner-jobs-browse.tsx:90-95 handles preloaded items; image upload elsewhere.
- Fix: Preserve company logo image retrieval and safe placeholder in job card.

## G2-16-013-036  [P2] GAP  facet F19  effort M
- Legacy: JobSearchDTO.java:12-14 lightweight for fast in-memory searching.
- vNext now: learner-jobs-browse.tsx:84-95 client-side full item filtering each render.
- Fix: Bound preloaded item set and use indexed server search at 10k users.

## G2-16-013-044  [P2] GAP  facet F23  effort L
- Legacy: JobSearchController.java:236-447 multiple filter, select and refresh endpoints.
- vNext now: learner-jobs-browse.tsx:34-299 UI-only browse, no legacy endpoint semantics.
- Fix: Implement minimal compatibility endpoint set or explicit deprecation contract.

## G2-17-013-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:121-138 — Search takes query, limit, learnerId, deptId, programId, jobType.
- vNext now: src/components/placements/learner-jobs-browse.tsx:103-125 — Learner drives search/filter by URL and React state.
- Fix: Preserve old entry fields and deep-link query mapping.

## G2-17-013-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:215-247 — Endpoints for popular and organization types.
- vNext now: src/components/placements/learner-jobs-browse.tsx:215-277 — Lists all published drives, no separate popular row in shown workspace.
- Fix: Add popular jobs module if feature is still required.

## G2-17-013-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:390-412 — Stats endpoint reports totalJobs, jobTypes, organizationId.
- vNext now: src/components/placements/learner-jobs-browse.tsx:215-225 — Drives summary counts options, not organization-wide job-type stats.
- Fix: Expose relevant total/type counts in admin context.
