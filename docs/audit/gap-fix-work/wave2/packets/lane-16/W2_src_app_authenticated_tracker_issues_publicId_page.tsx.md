# Work packet (wave 2): edit src/app/(authenticated)/tracker/issues/[publicId]/page.tsx

34 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md, docs/audit/gap2/lane-3/bug-report-activity.md

## G2-16-003-005  [P2] GAP  facet F02  effort M
- Legacy: `[issueId].js:141-189`: ID/copy icons/severity/status/resolution row; location H1; reported-by/date; status selector at right.
- vNext now: `issues/[publicId]/page.tsx:89-107`: PageHeader ID and type/page, badges, description directly; status in lower workflow.
- Fix: Recreate legacy two-column detail header with location title and inline right status control.

## G2-16-003-006  [P2] GAP  facet F02  effort M
- Legacy: `[issueId].js:191-246`: Retest above description, description card, conditional evidence preview, six-cell fact card, logs, engineering disclosure, activity.
- vNext now: `issues/[publicId]/page.tsx:100-199`: description+hidden context/sharing; workflow, logs, collapsed activity and screenshots metadata.
- Fix: Move retest ahead of description, restore evidence and six-field card; put engineering and activity in original order.

## G2-16-003-007  [P2] GAP  facet F02  effort S
- Legacy: `[issueId].js:193-195`: description has eyebrow `What went wrong` in separate card.
- vNext now: `issues/[publicId]/page.tsx:100-108`: description plain paragraph in same badge section.
- Fix: Restore dedicated `What went wrong` panel with legacy spacing/title.

## G2-16-003-009  [P2] GAP  facet F03  effort S
- Legacy: `[issueId].js:162-166`: colour coded SeverityPill, StatusPill, optional resolution pill.
- vNext now: `issues/[publicId]/page.tsx:101-105`: generic StatusBadge for status, severity, environment, resolution.
- Fix: Match legacy pill ordering, labels/colours; move environment to facts card.

## G2-16-003-013  [P2] GAP  facet F04  effort S
- Legacy: `[issueId].js:168-169`; `bugTrackerUtils.js` imported `trackerLocationText`: location text used as H1; reporter/date line next.
- vNext now: `issues/[publicId]/page.tsx:89-92,112-114`: H1 is ID, location shortened in subhead/hidden context.
- Fix: Reinstate full mapped Page › Screen › Section as primary visible heading, reporter/date directly below.

## G2-16-003-014  [P2] GAP  facet F04  effort S
- Legacy: `[issueId].js:235-241`: six labelled cards Reporter, Account, Environment, Issue type, Severity, Status.
- vNext now: `issues/[publicId]/page.tsx:111-118`: Reporter/role combined, Location, Created, Source path, Browser, Viewport; other values as badges.
- Fix: Restore six labelled fields in exact order and translated labels.

## G2-16-003-015  [P2] GAP  facet F04  effort S
- Legacy: `bugTrackerData.js:151-164`; `[issueId].js:235-240`: humanized account/environment/severity/status labels.
- vNext now: `issues/[publicId]/page.tsx:102-105,112`: raw uppercase enum values.
- Fix: Format values using legacy display mapping (e.g. Student/Not Sure, Ready for Retest).

## G2-16-003-017  [P2] GAP  facet F04  effort S
- Legacy: `EngineeringDetails.jsx:87-106`: optional source URL as safe link; route, viewport, browser in Engineering details.
- vNext now: `issues/[publicId]/page.tsx:115-118`: Source path/browser/viewport in Report context; source URL not displayed.
- Fix: Restore clickable source URL and original context ordering, while keeping external-link safety.

## G2-16-003-019  [P2] GAP  facet F05  effort M
- Legacy: `[issueId].js:216-219`: missing image URL fallback filename and `Preview unavailable`.
- vNext now: `issues/[publicId]/page.tsx:173-187`: shows only metadata regardless of availability.
- Fix: Show `Preview unavailable` only for absent/failed preview, keep metadata as supplemental.

## G2-16-003-020  [P2] GAP  facet F05  effort M
- Legacy: `ActivityTimeline.jsx:21-42`: timeline card with dots, activity text/date/actor and notes; hides if no activity.
- vNext now: `issues/[publicId]/page.tsx:139-169`: collapsed native details, ordered list with actor and note; explicit empty statement.
- Fix: Use legacy always-expanded visual timeline/dots, suppress empty section when no history.

## G2-16-003-024  [P2] GAP  facet F06  effort M
- Legacy: `[issueId].js:174-188`: admin/non-admin status pill resolved post-mount; skeleton placeholder avoids flicker.
- vNext now: `issues/[publicId]/page.tsx:45-46,88-136`: server gates non-admin before rendering, always admin workflow.
- Fix: Offer stable read-only detail for permitted viewers; avoid manager-select flash.

## G2-16-003-036  [P2] MISSING  facet F09  effort M
- Legacy: `[issueId].js:133-250`: page has no modal/drawer, only Ant Image.PreviewGroup lightbox.
- vNext now: `issues/[publicId]/page.tsx:88-200`: page has no overlay and screenshots only metadata.
- Fix: Add preview image lightbox; otherwise keep detail as page.

## G2-16-003-038  [P2] GAP  facet F09  effort M
- Legacy: `[issueId].js:198-230`: evidence section conditionally visible only with images/link or error.
- vNext now: `issues/[publicId]/page.tsx:119-125,171-187`: evidence link in collapsed report context and separate screenshot details always available.
- Fix: Restore one conditional `Evidence` card with images and link in original order.

## G2-16-003-048  [P2] GAP  facet F12  effort M
- Legacy: `ActivityTimeline.jsx:5-19`: four event text mappings for status/retest/resolution and generic fallback.
- vNext now: `issues/[publicId]/page.tsx:147-150`; `audit-activity-display-model.ts`: separates activity type and transition.
- Fix: Mirror exact humanized event sentences and fallback; retain actor/date.

## G2-16-003-050  [P2] GAP  facet F13  effort M
- Legacy: `[issueId].js:135-139`: active Skeleton paragraph 8 while detail loads; error Alert.
- vNext now: `issues/[publicId]/page.tsx:52-69`: server render with error-state only when DB not enabled; missing issue notFound.
- Fix: Provide equivalent loading skeleton/inline error or documented server streaming fallback.

## G2-16-003-051  [P2] GAP  facet F13  effort M
- Legacy: `[issueId].js:70-80,198-230`: attachment failure displays warning but core issue stays visible.
- vNext now: `issues/[publicId]/page.tsx:63-69`: whole data query failure prevents all detail; no separate attachment loading path.
- Fix: Split optional attachment fetch so failure doesn't remove core detail.

## G2-16-003-055  [P2] GAP  facet F14  effort S
- Legacy: `[issueId].js:225-228`: evidenceLink opened in new tab for http(s) link.
- vNext now: `issues/[publicId]/page.tsx:119-125`: HTTPS link clickable, HTTP plaintext.
- Fix: Match supported HTTP/HTTPS link behavior with safe navigation warning, do not leak private resources.

## G2-16-003-059  [P2] GAP  facet F16  effort M
- Legacy: `[issueId].js:141-189`: flexible heading row + right status select; six-column detail grid.
- vNext now: `issues/[publicId]/page.tsx:89-118`: badges + disclosure, separate workflow controls; no 6-cell responsive grid.
- Fix: Restore responsive title, right status and grid at mobile/tablet/desktop snapshots.

## G2-16-003-060  [P2] GAP  facet F16  effort M
- Legacy: `[issueId].js:203-224`: screenshot previews in responsive gallery.
- vNext now: `issues/[publicId]/page.tsx:171-187`: vertical metadata list; no gallery.
- Fix: Add responsive 2–3-up thumbnails with horizontal fallback, preserve captions and keyboard.

## G2-16-003-063  [P2] MISSING  facet F17  effort M
- Legacy: `[issueId].js:203-223`: Ant image viewer supplies preview keyboard semantics.
- vNext now: `issues/[publicId]/page.tsx:171-187`: no interactive image preview.
- Fix: Use accessible image modal with escape, focus trap, prev/next and alt labels.

## G2-3-021-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-43`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:245-246`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:139-170`
- Fix: Legacy Activity is an always-open detail card after engineering details, vNext Activity is collapsed details disclosure beneath report context and copy controls. Align default expanded state and section placement.

## G2-3-021-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportActivityRepository.java:8-10`, `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:28-40`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:144-168`
- Fix: Legacy timeline reads all events ascending; vNext renders newest-first page of 50 with Older audit events link. Match chronological top-to-bottom story, use explicit paging for long histories.

## G2-3-021-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:4-19`, `32-37`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:145-154`
- Fix: Legacy statuses and resolutions mapped to readable `Status changed from ... to ...` and retest pass/fail phrases; vNext displays uppercase activity.type plus auditActivityTransition. Map exact labels and hierarchy.

## G2-3-021-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:103-109`, `143-149`
- vNext now: `src/modules/bug-tracker/admin-service.ts:89-106`, `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:152-154`
- Fix: Legacy actor display Engineering or reporterName per event, vNext admin service stores actorName=null and UI says Platform administrator. Restore historical actor text mapping without leaking user IDs.

## G2-3-021-018  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerWorkflowService.java:119-149`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:145-154`
- Fix: Retest PASS closes/fixes and FAIL returns to FIXING; ensure corresponding history row uses result-specific label even on mobile.

## G2-3-021-026  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-52`, `65-79`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:52-68`
- Fix: Legacy history fetch failure is swallowed and content remains; vNext missing readiness gate renders `Issue details unavailable`. Separate schema readiness from timeline loading error.

## G2-3-021-027  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:64-81`, `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-43`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:171-196`
- Fix: Legacy screenshots are separate Evidence card, vNext screenshots metadata in disclosure after Activity with no signed download. Restore safe authorized evidence affordance, not raw storage path.

## G2-3-021-032  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:245-246`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:139-154`
- Fix: Legacy Activity card heading and item chronology remain visible without an extra keypress; vNext collapsed summary requires Enter/Space. Test active-state focus and navigation expectations.

## G2-3-021-033  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:4-19`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:145-154`
- Fix: Legacy literal `Retest passed — issue closed`, `Retest failed — returned to Fixing`, `Status changed from ...`, `Resolution changed from ...`; vNext renders type code and generic transition label. Restore wording.

## G2-3-021-034  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-26`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:139-142`
- Fix: Legacy shows only `Activity` eyebrow when events exist; vNext `Activity` summary plus `No workflow history yet.` empty. Align copy and fallback.

## G2-16-003-004  [P3] GAP  facet F01  effort S
- Legacy: `[issueId].js:133-134`: back arrow link `← All issues`.
- vNext now: `issues/[publicId]/page.tsx:93-96`: `Back to issues` button on PageHeader.
- Fix: Restore exact back text and arrow placement.

## G2-16-003-052  [P3] GAP  facet F13  effort S
- Legacy: `ActivityTimeline.jsx:21-22`: no activity section when list empty.
- vNext now: `issues/[publicId]/page.tsx:139-143`: collapsed Activity with explicit `No workflow history yet.`.
- Fix: Hide empty timeline for parity or consciously preserve helpful empty state.

## G2-16-003-064  [P3] GAP  facet F18  effort S
- Legacy: `[issueId].js:134`: `← All issues`.
- vNext now: `issues/[publicId]/page.tsx:94-95`: `Back to issues`.
- Fix: Use exact back copy and arrow.

## G2-16-003-065  [P3] GAP  facet F18  effort S
- Legacy: `[issueId].js:194`: `What went wrong` section label.
- vNext now: `issues/[publicId]/page.tsx:100-108`: no label above description.
- Fix: Add original eyebrow.
