# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

28 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-004  [P2] GAP  facet F02  effort M
- Legacy: `audit-findings.js:106-151`: head and sync; sync warnings; summary count chips; one inline row of filters.
- vNext now: `page.tsx:32-43,64-106`: header/navigation, tabs, needs-doing chips, two-step filter form; warnings only when DB disabled.
- Fix: Restore section hierarchy with sync header, warning strip, counts, segmented view and inline multi-select filters.

## G2-16-001-005  [P2] GAP  facet F02  effort M
- Legacy: `audit-findings.js:155-189`: table, flagged-file disclosure, 720px finding drawer.
- vNext now: `page.tsx:110-135`; `[publicId]/page.tsx:28-79`: table, import status details, separate routed detail.
- Fix: Use same-row selectable drawer with 720px width and keep board context/page on close.

## G2-16-001-007  [P2] GAP  facet F03  effort M
- Legacy: `audit-findings.js:125-136`: four clickable severity chips and status chips only when count >0.
- vNext now: `page.tsx:72-77`: only `Critical open` label and ten status chips including zero counts.
- Fix: Show four severity chips with open counts and hide zero-count status chips; make every chip update correct facet.

## G2-16-001-008  [P2] GAP  facet F03  effort M
- Legacy: `audit-findings.js:139-150`: five filter widgets, search icon action, clearable status/severity/area/kind tags.
- vNext now: `page.tsx:78-105`: Search label, Apply/Clear, More filters disclosure and native multiple listboxes.
- Fix: Recreate single-row searchable multi-selects with clear controls and search button.

## G2-16-001-009  [P2] GAP  facet F03  effort S
- Legacy: `audit-findings.js:166-186`: collapsible importer table with status-coloured result tags.
- vNext now: `page.tsx:125-133`: filename and reason only.
- Fix: Restore importer result tag, checked-at field and severity colours.

## G2-16-001-010  [P2] GAP  facet F04  effort M
- Legacy: `audit-findings.js:87-101`: five columns, finding title primary, subline `id · area · kind · environment`.
- vNext now: `page.tsx:52-63`: six columns, external ID primary and title second; area/kind separate; environment omitted.
- Fix: Use legacy Finding cell ordering and inline environment metadata; return to five columns.

## G2-16-001-012  [P2] GAP  facet F04  effort S
- Legacy: `audit-findings.js:101`; `auditFindingsModel.js:44-52`: Reported includes IST date+minute and foundBy on next line.
- vNext now: `page.tsx:62`: foundBy then medium date only, no time.
- Fix: Render `istTime` equivalent with Asia/Kolkata hour/minute, reporter beneath.

## G2-16-001-013  [P2] GAP  facet F04  effort S
- Legacy: `audit-findings.js:111-115`: subtitle `From <repo> · last synced <IST> · <result>`.
- vNext now: `page.tsx:32-33,116-124`: static disclaimer; sync data appears inside disclosure.
- Fix: Restore source repo, last-run timestamp and result inline below title.

## G2-16-001-015  [P2] GAP  facet F05  effort S
- Legacy: `audit-findings.js:87-101`: Severity first, Finding second, Status, Assigned, Reported; fixed 100/150/130/170 widths.
- vNext now: `page.tsx:52-63`: Finding, Area/Kind, Severity, Status, Assigned, Reported; no fixed widths.
- Fix: Restore ordered columns and measured widths; move Area/Kind/environment back under title.

## G2-16-001-021  [P2] GAP  facet F05  effort M
- Legacy: `audit-findings.js:160-161`: clicking anywhere on a row opens detail drawer.
- vNext now: `page.tsx:54-55`: only ID link opens separate page.
- Fix: Make row interactive with keyboard-accessible drawer entry and preserve search/pagination.

## G2-16-001-023  [P2] GAP  facet F06  effort M
- Legacy: `audit-findings.js:140-150`: changing any segmented/multiselect instantly re-fetches; search only on Enter/search icon.
- vNext now: `page.tsx:78-106`: all filters wait for GET form submit via Apply filters.
- Fix: Auto-apply view and select changes without pressing Apply; keep explicit search submit.

## G2-16-001-024  [P2] GAP  facet F06  effort S
- Legacy: `audit-findings.js:141-148`: AREA options from 23-entry `auditFindingsModel.js:26-30`; kind seven choices.
- vNext now: `page.tsx:90-103`: area is free-text; kind set uppercased but seven entries.
- Fix: Provide ordered 23 area options and exact select labels.

## G2-16-001-031  [P2] MISSING  facet F09  effort M
- Legacy: `AuditFindingDrawer.jsx:103-108`: Ant drawer width 720, header is finding title, skeleton while loading.
- vNext now: `[publicId]/page.tsx:28-35`: full-page detail, no 720 drawer, server rendered.
- Fix: Add shared 720px Drawer with title and loading skeleton.

## G2-16-001-032  [P2] GAP  facet F09  effort M
- Legacy: `AuditFindingDrawer.jsx:119-146`: bordered one-column descriptions, steps, source, roles, environment, commits.
- vNext now: `[publicId]/page.tsx:34-78`: collapsed sections; missing several original fields.
- Fix: Restore description rows and optional conditions in same order.

## G2-16-001-033  [P2] GAP  facet F09  effort M
- Legacy: `AuditFindingDrawer.jsx:148-155`: inline warning `Looks similar` lists top 5 area/title matching findings.
- vNext now: `[publicId]/page.tsx:54-63`: text link to board search of title.
- Fix: Compute and render top-five title-token overlap candidates with their statuses.

## G2-16-001-046  [P2] GAP  facet F13  effort M
- Legacy: `audit-findings.js:153-164`: inline API error; Ant spinner in table; empty messages vary by view.
- vNext now: `page.tsx:34-43,107-113`: invalid filters and DB warning; server load and generic `No matching audit findings`.
- Fix: Add view-specific empty and list-error+retry; preserve tab while fetching.

## G2-16-001-047  [P2] GAP  facet F13  effort M
- Legacy: `AuditFindingDrawer.jsx:55-72,103-106`: reset state per finding, active Skeleton then inline load error.
- vNext now: `[publicId]/page.tsx:15-18`: notFound on missing/DB unavailable, route loading file exists.
- Fix: Add drawer skeleton, error-retry and close-on-error behavior.

## G2-16-001-048  [P2] GAP  facet F13  effort M
- Legacy: `audit-findings.js:201-214`: refresh access token; failed refresh clears tokens and shows gate.
- vNext now: `page.tsx:27-30`: server-side inactive/role checks redirect; session-expired handled by global auth.
- Fix: Specify whether retired password route remains; show consistent expired-session redirect/recovery.

## G2-16-001-050  [P2] GAP  facet F14  effort M
- Legacy: `audit-findings.js:178-181`: importer problem report has path, result, errors, checkedAt.
- vNext now: `page.tsx:46-51,125-132`: filename/reason only; no timestamp/status.
- Fix: Expand rejected-file schema/read and four report columns.

## G2-16-001-052  [P2] GAP  facet F15  effort S
- Legacy: `audit-findings.js:67-80`: UI loads sync status and presents sync success/failure messages, no user inbox.
- vNext now: `page.tsx:114-124`: persisted status but no live run notifications.
- Fix: Render live sync feedback, not a new email notification feature.

## G2-16-001-053  [P2] GAP  facet F16  effort M
- Legacy: `audit-findings.js:106-163`: flex wrap header/tags/filters; fixed-size Ant table widths and 720px drawer.
- vNext now: `page.tsx:64-113`: grid breakpoints and DataTable mobilePriority; `[publicId]/page.tsx` full page.
- Fix: Compare 1280/768/375 screenshots; preserve legacy controls/cell hierarchy with scroll on narrow screens.

## G2-16-001-064  [P2] GAP  facet F20  effort S
- Legacy: `auditFindingsModel.js:44-52`: all timestamps rendered Asia/Kolkata including importer checked time.
- vNext now: `page.tsx:62,122`: Asia/Kolkata, but date-only reported and importer checked absent.
- Fix: Restore time precision and checkedAt column in IST.

## G2-16-001-011  [P3] GAP  facet F04  effort S
- Legacy: `audit-findings.js:100`: empty assignee displays `Nobody`.
- vNext now: `page.tsx:61`: displays `Unassigned`.
- Fix: Use `Nobody` for null assignee.

## G2-16-001-055  [P3] GAP  facet F18  effort S
- Legacy: `audit-findings.js:16-20`: `Release blockers`.
- vNext now: `page.tsx:65-70`: `Release (critical & high)`.
- Fix: Rename tab to `Release blockers`.

## G2-16-001-056  [P3] GAP  facet F18  effort S
- Legacy: `audit-findings.js:149`: `Search title, summary, id, file`.
- vNext now: `page.tsx:80-81`: `ID, title or summary`.
- Fix: Match placeholder including file search.

## G2-16-001-057  [P3] GAP  facet F18  effort S
- Legacy: `audit-findings.js:160`: `No findings match` or `No open critical or high findings`.
- vNext now: `page.tsx:112`: `No matching audit findings`.
- Fix: Restore both contextual empty strings.

## G2-16-001-058  [P3] GAP  facet F18  effort S
- Legacy: `audit-findings.js:162-163`: `${total} finding(s)` footer.
- vNext now: `page.tsx:107-108`: `${total} matching independent findings · page x of y · 50 per page`.
- Fix: Use legacy `N findings` total copy and pagination placement.

## G2-16-001-059  [P3] GAP  facet F18  effort S
- Legacy: `AuditFindingDrawer.jsx:18-19,141-145,260`: null detail `Not given`, missing commits `None yet`, empty timeline `No history`.
- vNext now: `[publicId]/page.tsx:34-44,69-77`: `Not recorded`, `No fix commits recorded`, `No audit events recorded`.
- Fix: Use legacy detail placeholders and empty copy.
