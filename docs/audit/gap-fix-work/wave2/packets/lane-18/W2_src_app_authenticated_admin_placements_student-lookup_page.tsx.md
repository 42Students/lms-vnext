# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/student-lookup/page.tsx

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-001  [P2] GAP  facet F01  effort M
- Legacy: Lookup is secondary inline utility beneath drives landing separator (`DrivesLanding.js:649-654`), also inside All Drives (`Jobs.js:757`).
- vNext now: Dedicated `/admin/placements/student-lookup` page with own PageHeader/BackLink (`admin/placements/student-lookup/page.tsx:27-32`).
- Fix: Place compact lookup under drives and all-drives workspaces, or provide equivalent inline entry; preserve standalone route as additional access.

## G2-15-002-002  [P2] GAP  facet F01  effort S
- Legacy: Inline utility caption `Look up a student’s placement status` (`StudentPlacementLookup.js:123-127`).
- vNext now: Full-page title `Student placement lookup` (`admin/placements/student-lookup/page.tsx:27-31`).
- Fix: Keep exact legacy inline caption when embedded; only use new page heading for independent route.

## G2-15-002-004  [P2] GAP  facet F02  effort L
- Legacy: Order: small caption, 420px autocomplete, selected learner detail (name; profile accordions; errors; history list) (`StudentPlacementLookup.js:123-209`).
- vNext now: Page header, search form, analytics, error/empty state, then separate section per matched learner and DataTable (`admin/placements/student-lookup/page.tsx:27-76`).
- Fix: Restore single selected-student progressive detail; render profile before application history.

## G2-15-002-005  [P2] GAP  facet F02  effort S
- Legacy: Selected student is a `#fafafa` panel with 1px `#f0f0f0` border, radius 8 and padding 16 (`StudentPlacementLookup.js:146-151`).
- vNext now: Student section directly in page with bottom border and padding tokens, no equivalent selected panel (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Match light inset panel and compact spacing on selected result.

## G2-15-002-006  [P2] GAP  facet F02  effort S
- Legacy: Utility explicitly not a competing Card; separator belongs to parent (`StudentPlacementLookup.js:120-124`; `DrivesLanding.js:649-654`).
- vNext now: Standalone large header/form/data table visually promoted as independent section (`admin/placements/student-lookup/page.tsx:27-39,56-75`).
- Fix: Preserve secondary visual priority when embedded alongside drives.

## G2-15-002-007  [P2] GAP  facet F03  effort M
- Legacy: Search icon is `Input.Search`; autocomplete popup loading uses small Spin (`StudentPlacementLookup.js:3-4,128-144`).
- vNext now: Plain Input plus full-size Search students Button; no popup spinner (`admin/placements/student-lookup/page.tsx:32-39`).
- Fix: Use legacy input-search icon/combobox and async dropdown spinner.

## G2-15-002-008  [P2] GAP  facet F03  effort S
- Legacy: Selected student name is bold with email/#id fallback (`StudentPlacementLookup.js:146-152`).
- vNext now: Name is heading, fallback roll or generic Student; roll/email subcaption (`admin/placements/student-lookup/page.tsx:56-60`).
- Fix: Use exact name/contact fallback and visual weight; retain roll as ancillary field only if approved.

## G2-15-002-009  [P2] GAP  facet F03  effort M
- Legacy: Each application row is compact stacked job, company, colored stage Tag; applied/interview/rejection sentence below (`StudentPlacementLookup.js:180-204`).
- vNext now: Four-column DataTable with company/drive, application raw status, offer, joining (`admin/placements/student-lookup/page.tsx:62-73`).
- Fix: Render compact legacy rows with stage chip and detail sentence; optionally expose new offer/joining in secondary area.

## G2-15-002-010  [P2] GAP  facet F03  effort S
- Legacy: Status palette APPLIED default, SHORTLISTED blue, ASSESSMENT gold, INTERVIEW purple, WAITLISTED orange, OFFERED cyan, HIRED green, REJECTED red, WITHDRAWN default (`StudentPlacementLookup.js:13-23`).
- vNext now: StatusBadge tone conditional only SUBMITTED=info, WITHDRAWN=neutral, REJECTED=error, rest warning (`admin/placements/student-lookup/page.tsx:67-70`).
- Fix: Map each legacy stage to exact status, color, label; don't collapse distinct stages into warning.

## G2-15-002-013  [P2] GAP  facet F04  effort M
- Legacy: Autocompletion label firstName + lastName, else contactMail, else `Student #id` (`StudentPlacementLookup.js:53-59`).
- vNext now: Search result uses `users.displayName`, rollNumber, email; title falls back roll/`Student` (`college-placement-student-lookup-service.ts:14-20`; `admin/placements/student-lookup/page.tsx:58-59`).
- Fix: Normalize first+last with contactMail and stable learner identifier fallback.

## G2-15-002-015  [P2] GAP  facet F04  effort S
- Legacy: Job title fallback `Job`; companyName text (`StudentPlacementLookup.js:190-195`).
- vNext now: Combined `company · job` cell, no absent-value fallback (`admin/placements/student-lookup/page.tsx:62-68`).
- Fix: Render legacy standalone title/company and `Job` fallback; guard nullable company.

## G2-15-002-016  [P2] MISSING  facet F04  effort S
- Legacy: Shows localized Applied date for every row, fallback `-` for malformed/empty (`StudentPlacementLookup.js:197-201`; `dateUtils.js:9-14`).
- vNext now: `submittedAt` fetched but not rendered (`college-placement-student-lookup-service.ts:47-53`; `admin/placements/student-lookup/page.tsx:62-73`).
- Fix: Display submitted date in `DD MMM YYYY` in viewer local zone with '-' fallback.

## G2-15-002-019  [P2] GAP  facet F04  effort S
- Legacy: Human stage labels use mapping ASSESSMENT→`Test`, HIRED→`Placed`, REJECTED→`Not selected` (`labels.js:6-9,26-30`; `StudentPlacementLookup.js:193-196`).
- vNext now: Renders raw `applicationStatus` enum strings in StatusBadge (`admin/placements/student-lookup/page.tsx:67-69`).
- Fix: Use stage-label mapper for all supported statuses and readable fallback.

## G2-15-002-023  [P2] GAP  facet F05  effort M
- Legacy: 300ms input debounce (`StudentPlacementLookup.js:70-86`).
- vNext now: Full GET form submitted on Search students button, no debounce (`admin/placements/student-lookup/page.tsx:32-39`).
- Fix: Implement 300ms autocomplete with stale request cancellation.

## G2-15-002-027  [P2] GAP  facet F06  effort S
- Legacy: Search `placeholder=Search a student by name or email`, allowClear, max width420 (`StudentPlacementLookup.js:128-144`).
- vNext now: Search `placeholder=Find one student in this college`, minLength3,maxLength150, required (`admin/placements/student-lookup/page.tsx:33-36`).
- Fix: Restore exact placeholder, allowClear and 420px anchored combobox.

## G2-15-002-028  [P2] GAP  facet F06  effort S
- Legacy: Search threshold at least 2 trimmed characters, shorter clears options without error (`StudentPlacementLookup.js:70-82`).
- vNext now: Requires 3..150 characters in HTML and Zod query parser (`admin/placements/student-lookup/page.tsx:33-38`; `super-admin-placement-student-search-model.ts:5-15`).
- Fix: Accept >=2 characters, preserve backend upper bound and helpful client guidance.

## G2-15-002-041  [P2] MISSING  facet F09  effort M
- Legacy: AutoComplete popup triggered by typing; shows option list, spinner, error or `No students match “{query}”` (`StudentPlacementLookup.js:128-144`).
- vNext now: No popup; full-page no-match state (`admin/placements/student-lookup/page.tsx:53-54`).
- Fix: Implement antd-equivalent accessible autocomplete popover with matching empty/loading states.

## G2-15-002-049  [P2] GAP  facet F10  effort M
- Legacy: Selection race guard uses selectedLearnerIdRef, stale search guard requestIdRef (`StudentPlacementLookup.js:41-68,88-112`).
- vNext now: Server-rendered distinct URL GET scopes request; no selected student async identity state (`admin/placements/student-lookup/page.tsx:13-26`).
- Fix: For added combobox/detail, guard stale requests on rapid selection and college-scope switch.

## G2-15-002-058  [P2] GAP  facet F13  effort M
- Legacy: Typeahead spinner while searching, no-match text in dropdown (`StudentPlacementLookup.js:133-144`).
- vNext now: No loading state in search popup; after search server render no-match page (`admin/placements/student-lookup/page.tsx:32-54`).
- Fix: Add typeahead busy spinner and correct no-match copy.

## G2-15-002-059  [P2] MISSING  facet F13  effort M
- Legacy: Loading history: 4-row ListSkeleton; same-student refresh shows `Refreshing placement history…` (`StudentPlacementLookup.js:161-176`).
- vNext now: No list skeleton/refresh status in page (`admin/placements/student-lookup/page.tsx:13-76`).
- Fix: Render 4-row skeleton on selection and inline refresh status retaining previous history.

## G2-15-002-060  [P2] GAP  facet F13  effort S
- Legacy: Empty selected history `No applications yet — this student hasn't applied to any job posting.` (`StudentPlacementLookup.js:174-179`).
- vNext now: DataTable empty `No applications found`; description `No placement applications are recorded for this student.` (`admin/placements/student-lookup/page.tsx:71-73`).
- Fix: Restore exact legacy empty wording for selected student.

## G2-15-002-061  [P2] GAP  facet F13  effort M
- Legacy: On same-student refresh failure keeps old list and warning, on different selection clears (`StudentPlacementLookup.js:88-109,161-178`).
- vNext now: GET service error displays page ErrorState; no stale list preservation (`admin/placements/student-lookup/page.tsx:22-26,46-49`).
- Fix: Preserve prior response for selected learner; clear when identity changes.

## G2-15-002-063  [P2] GAP  facet F14  effort M
- Legacy: No export/import/upload at lookup itself; resume editor writes preexisting URL and backend validates ref (`StudentPlacementLookup.js:123-209`; `LearnerProfileController.java:1223-1235`).
- vNext now: No export/import/file input; no resume interface (`admin/placements/student-lookup/page.tsx:13-76`).
- Fix: Keep directory export absent but restore secure resume URL view/edit with signed storage-ref rules.

## G2-15-002-066  [P2] GAP  facet F17  effort M
- Legacy: AutoComplete Input.Search allowClear, loading errors/summary alerts, status skeletons (`StudentPlacementLookup.js:128-144,161-176`).
- vNext now: GET form role=search with label, required, min/max and disabled scope; ErrorState/EmptyState (`admin/placements/student-lookup/page.tsx:32-54`).
- Fix: Implement accessible combobox with `aria-expanded`, `aria-activedescendant`, keyboard selection, focus restoration and announcements.

## G2-15-002-067  [P2] MISSING  facet F17  effort M
- Legacy: Selected student profile Collapse initially closed, separate panels; confirm destructive Remove action (`ProfileSectionsPanel.js:481-504,444-448`).
- vNext now: No keyboard-operable profile accordion nor deletion popconfirm (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Use accessible disclosure and confirmation with focus trapping/restore.

## G2-15-002-068  [P2] GAP  facet F18  effort S
- Legacy: Caption `Look up a student’s placement status`; placeholder `Search a student by name or email` (`StudentPlacementLookup.js:125-144`).
- vNext now: Title `Student placement lookup`; placeholder `Find one student in this college` (`admin/placements/student-lookup/page.tsx:30-36`).
- Fix: Clone wording exactly in embedded surface.

## G2-15-002-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy candidate miss `No students match “{q}”`; after select empty history exact student-hasn't-applied sentence (`StudentPlacementLookup.js:138-139,174-179`).
- vNext now: `No matching students` and `No applications found`, divergent descriptions (`admin/placements/student-lookup/page.tsx:53-54,71-73`).
- Fix: Restore quoted query and selected-student-specific empty sentence.

## G2-15-002-070  [P2] GAP  facet F18  effort S
- Legacy: Legacy application stages humanized (`labels.js:6-9`) and date starts `Applied ` (`StudentPlacementLookup.js:193-200`).
- vNext now: Raw status enums; no Applied date (`admin/placements/student-lookup/page.tsx:67-73`).
- Fix: Map human stage labels and date prefix exactly.

## G2-15-002-072  [P2] GAP  facet F19  effort M
- Legacy: Typeahead uses 300ms debounce and stale request ID checking (`StudentPlacementLookup.js:41-68,70-86`).
- vNext now: Explicit full-page search and no incremental fetch (`admin/placements/student-lookup/page.tsx:32-39`).
- Fix: Bound API request frequency and abort superseded suggestion fetch.

## G2-15-002-073  [P2] GAP  facet F20  effort M
- Legacy: Stale search result ignored via requestId; stale summary ignored via selectedLearnerIdRef (`StudentPlacementLookup.js:41-68,88-112`).
- vNext now: No client stale-select exposure with GET route, but all results eagerly show (`admin/placements/student-lookup/page.tsx:13-26,56-75`).
- Fix: When restoring selection, invalidate late responses on selection/college switch.

## G2-15-002-074  [P2] GAP  facet F20  effort M
- Legacy: On same-student reload, prior history retained, but different student old summary cleared (`StudentPlacementLookup.js:88-109`).
- vNext now: Search query renders complete replacement, no single selected identity (`admin/placements/student-lookup/page.tsx:16-26,56-75`).
- Fix: Implement owner-scoped cache keyed by college and learner ID; never show old person's data.

## G2-15-002-075  [P2] GAP  facet F20  effort S
- Legacy: Legacy date formatter interprets UTC timestamp in viewer locale and invalid→`-` (`dateUtils.js:9-14`).
- vNext now: No date rendering although submittedAt present (`college-placement-student-lookup-service.ts:47-53`; `admin/placements/student-lookup/page.tsx:62-73`).
- Fix: Normalize UTC dates, format IST/local per product decision, and handle malformed values.
