# U013 — AdminCollegeSummaryController gap audit v2

## Legacy / vNext code closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCollegeSummaryController.java`
- `LF` = `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js`
- `NP` = `src/app/(authenticated)/college/page.tsx`
- `NS` = `src/modules/admin-ui/college-dashboard-cards-service.ts`
- `NM` = `src/modules/admin-ui/college-dashboard-cards-model.ts`
- `NL` = `src/modules/admin-ui/college-setup-checklist-service.ts`
- `NC` = `src/components/admin/college-dashboard-cards.tsx`

Mapped controller, legacy AtAGlance and AdminDashboardView, vNext dashboard card service/model, full setup COUNT service and output cards. Paths in table use aliases plus one-based lines. Important: default numeric values and statuses vary across schema; any uncertain status parity is marked GAP with verification fix or UNKNOWN. Audit-only.

## 23 facets
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-013-001 | F01 | LC:34-39 GET /api/v1/admin/college-summary | NP:23-66 /college server page uses NS:13-19, no public summary REST route | GAP | P2 | Document typed SSR replacement/serve secured compatibility endpoint if clients remain. | S |
| G2-2-013-002 | F01 | LF:61-65 'At a glance' section beneath greeting | NP:132 CollegeDashboardCards following college metadata and other actions | GAP | P2 | Restore summary directly below greeting. | S |
| G2-2-013-003 | F02 | LF:74-91 four AntD Card/Statistic tiles xs12 sm6 | NC:15-20 1-col mobile md2 lg4 StatTile grid | GAP | P2 | Match two-column mobile layout with legacy icon/number typography. | S |
| G2-2-013-004 | F02 | LF:64-65 heading plus in-place Retry on error | NC:16 heading, NP:132 section failure separate ErrorState | GAP | P2 | Show inline Retry in card heading and preserve previous success. | S |
| G2-2-013-005 | F03 | LF:55-58 icon UserOutlined/TeamOutlined/BookOutlined/SolutionOutlined per stat | NC:18 StatTile label/count no icon | GAP | P3 | Restore exact legacy icon per metric. | S |
| G2-2-013-006 | F03 | LF:64-69 Retry button on failure/refresh | NP:132 failed section ErrorState link to /college, no per-section retry button | GAP | P2 | Add inline Retry with loading feedback. | S |
| G2-2-013-007 | F04 | LC:76-102 four keys studentCount,facultyCount,courseCount,activeDriveCount | NM:17-20 cards keys students,faculty,course-list,jobs; same four labels | GAP | P2 | Map DTO fields exactly for exported REST clients. | S |
| G2-2-013-008 | F04 | LC:98 countActiveByCollegeId of jobs | NL:94-96 PUBLISHED and not archived placementJobs | GAP | P2 | Verify actual legacy ACTIVE drive status semantics vs published-only; reconcile if active != published. | S |
| G2-2-013-009 | F04 | LC:76-78 learner repository includes via class, including older college assignment shape | NL:88-91 counts active LEARNER membershipRoles only | GAP | P1 | Map legacy enrolments with college via class, not merely active membership role. | S |
| G2-2-013-010 | F04 | LC:84 facultyRepository.countByCollegeId | NL:76-79 counts active FACULTY membership roles | GAP | P2 | Validate legacy faculty status/include deleted differences and role multiplicity. | S |
| G2-2-013-011 | F04 | LC:90-92 courseRepository.fetchByCollegeIdPaged total | NL:39-41 counts only ACTIVE courses | GAP | P2 | Confirm legacy excludes deleted and inactive equivalently. | S |
| G2-2-013-012 | F05 | LC:76-102 four independent counts, no filters/sort/pagination | NL:33-97 fourteen parallel aggregate COUNT queries, no list | EXTRA | P3 | Keep bounded count-only query; avoid dependencies on unrelated aggregates. | S |
| G2-2-013-013 | F06 | LC:62 requires collegeId positive integer, no user-editable field | NS:16 schema strict empty, NL:16-26 derived current membership | GAP | P2 | Document identifier and scope contract switch; never trust caller-supplied college. | S |
| G2-2-013-014 | F07 | LC:63-65 exact 400 'collegeId must be a positive integer' | NP:27-45 EmptyState for no active college | GAP | P3 | Map new route failure to safe equivalent copy. | S |
| G2-2-013-015 | F07 | LC:68-70 401 'Authentication required' | NP:24 getCurrentRequestContext throws to protected shell | GAP | P3 | Verify 401/redirect semantics for unauthenticated API/SSR clients. | S |
| G2-2-013-016 | F08 | LC:104 returns Response OK and map | NS:18 `{setup,cards}` SSR service response | GAP | P3 | Version old REST response envelope for clients, no success toast requirement. | S |
| G2-2-013-017 | F09 | LF:67-73 inline red Alert for complete summary failure and warning for stale values | NP:132 CollegeDashboardSectionFailure full-width error, no stale warning | GAP | P2 | Restore inline red/warning alert variants and retained last success. | S |
| G2-2-013-018 | F10 | LC:75-102 independently catches exceptions for each metric | NL:33-97 one Promise.all over fourteen queries; one failure rejects entire summary | GAP | P1 | Use individual settled COUNT queries for FOUR summary metrics; unaffected tiles must still load. | S |
| G2-2-013-019 | F10 | LC:76-78 fetch paginated learner total via size1, 84 count, 90-92 course paginated total | NL:33-97 DB count() only, no unbounded list | MATCH | P3 | Retain count-query discipline. | S |
| G2-2-013-020 | F11 | LC:67-72 requireAccessCollege for authorized principal; access differs from admin mutations | NL:16-26 requires COLLEGE_ADMIN role and college.read | GAP | P1 | Allow permitted scoped Super Admin reader equivalent under selected acting-college context. | S |
| G2-2-013-021 | F11 | LC:72 college access may permit audit admin and faculty roles per access service | NL:18 requires COLLEGE_ADMIN | UNKNOWN | P2 | Read AccessControlService.requireAccessCollege access matrix and resolve intended reader roles. | S |
| G2-2-013-022 | F12 | LC:76-78 students includes learners linked via class | NL:88-91 active memberships only | GAP | P1 | Preserve legacy count membership fallback or document deliberate status policy change. | S |
| G2-2-013-023 | F12 | LC:98 activeDriveCount jobRepository.countActiveByCollegeId | NL:94-96 published,not archived placements | GAP | P2 | Confirm if accepted/open/expired statuses differ from legacy job active definition. | S |
| G2-2-013-024 | F13 | LF:78-87 Skeleton per tile while loading | NP:23-66 SSR waits allSettled; NC:15-20 no local skeleton | GAP | P2 | Add loading UI for summary stat strip. | S |
| G2-2-013-025 | F13 | LF:68-73 keeps prior counts on same-college refresh failure | NP:132 full failed section, no prior data cache | GAP | P2 | Retain last successful same-college totals with warning. | S |
| G2-2-013-026 | F13 | LC:79-81 failed one student count returns null, other three computed | NL:33-97 one query error rejects entire summary; NS:12 comment explicitly all fails | GAP | P1 | Implement per-field fallback null; never replace failure with zero. | S |
| G2-2-013-027 | F14 | LC:59-107 no download/export/import/file upload | NP:132 summary no upload or export | MATCH | P3 | N/A. | S |
| G2-2-013-028 | F15 | LC:59-107 read-only counters, no notifications | NS:13-19 pure read, no email | MATCH | P3 | N/A. | S |
| G2-2-013-029 | F16 | LF:75-91 mobile xs12 two columns, small 4 | NC:17 one col until md, 2 until lg, 4 large | GAP | P2 | Match xs two-column and sm four-column breakpoints. | S |
| G2-2-013-030 | F17 | LF:78-87 Statistic icon and title in accessible Card | NC:18 StatTile link with label/count | GAP | P3 | Ensure icon hidden decoratively, contextual link is keyboard operable. | S |
| G2-2-013-031 | F18 | LF:55-58 Students, Faculty, Courses, Active drives | NM:7-14 Students, Faculty, Courses, Active drives labels exact | MATCH | P3 | No change. | S |
| G2-2-013-032 | F18 | LF:68 `Couldn't load college summary`; LF:72 `Summary refresh failed` | NP:132 `At a glance` ErrorState Could not load right now | GAP | P3 | Restore exact error and stale-warning wording. | S |
| G2-2-013-033 | F19 | LC:29-32 count-only, max one-row pages | NL:33-97 fourteen independent counts, `Promise.all` | EXTRA | P2 | Decouple four dashboard counts from full setup count suite to reduce critical path. | S |
| G2-2-013-034 | F20 | LF:30-47 requestRef and same-college cache avoid stale responses | NP:23-66 SSR request context, no client race | EXTRA | P3 | Keep server-derived tenant scope. | S |
| G2-2-013-035 | F20 | LC:83-102 recover from individually broken repo | NL:33-97 rejects entire list on individual query exception | GAP | P1 | Isolate failures and preserve precision of '—' vs real zero. | S |
| G2-2-013-036 | F21 | LC:41-51 repositories learner/faculty/course/jobs | NL:33-97 Drizzle joins role/course/placements and other setup tables | GAP | P2 | Map old counts to new relational schema and compare fixture totals. | S |
| G2-2-013-037 | F22 | LC:76-102 legacy learner/faculty/course/job entity IDs | NL:76-97 collegeMemberships, membershipRoles, placementJobs, courses | GAP | P2 | Document identity/status migration mapping; no migration of old data expected, but behavioral parity matters. | S |
| G2-2-013-038 | F22 | LC:76-102 nullable counts on failures | NM:39-50 projection allows null count, but NL:33-97 throw all before projection | GAP | P1 | Return partial counts and carry null per failing dimension. | S |
| G2-2-013-039 | F23 | LC:75-102 independent fault isolation | NL:33-97 coupling fourteen setup COUNT queries into four summary cards | GAP | P1 | Separate summary dependency from unrelated setup metrics. | S |
| G2-2-013-040 | F23 | LF:55-58 four concise stat cards, icon prefix | NC:15-20 four linked tiles but no prefix icon | GAP | P3 | Restore exact tile visual values and state sequence. | S |

## Summary
- 40 rows, verdicts GAP 32; EXTRA 3; MATCH 4; UNKNOWN 1, severity P2 19; P3 13; P1 8.
- **Top P1:** Legacy individually catches repository exceptions and returns null *only for failed count*, while vNext makes all four stat tiles depend on one Promise.all of fourteen setup metrics. An unrelated setup count failure blanks whole summary (F10/F13/F20/F23).
- **Top P1:** Learner count by college OR class fallback differs from active LEARNER memberships, and selected-college Super Admin access is not provided by the own-membership-only service (F04/F11/F12).
- **P2 visual:** Legacy AtAGlance is 2x2 mobile and four stats at small width, icon prefixed + per-card skeleton/stale errors, while vNext is one-column until md and lacks those states (F02/F03/F13/F16).

### UNKNOWN / live checks
- Count same college with a learner linked only through a class, an inactive faculty account and a published-but-closed placement drive to decide approved membership/status count scope.
- Compare old/new card at 375/768/1280, and deliberately fail one setup query while the remaining four base counts are healthy.
