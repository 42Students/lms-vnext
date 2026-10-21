# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md

28 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md

## G2-2-001-002  [P2] GAP  facet F01  effort M
- Legacy: LF:161,189 table row opens 720px drawer, URL unchanged
- vNext now: NP:53-56 finding ID link to /tracker/audit-findings/[publicId]; ND:29-30 back link
- Fix: Restore same-page drawer, or explicitly approve navigable detail as a redesign.

## G2-2-001-003  [P2] GAP  facet F02  effort S
- Legacy: LF:108-118 heading, sync provenance and Sync now top row
- vNext now: NP:32-33 heading and generic description; import status at bottom NP:114-134
- Fix: Move repo, last run and last result beside heading, restore sync action.

## G2-2-001-004  [P2] GAP  facet F02  effort M
- Legacy: LF:125-151 chips then inline segmented view and four selects/search; 155-189 table, refusals, drawer
- vNext now: NP:64-134 tabs, status chips, search, More filters, list, pagination, import status; ND:34-78 standalone sections
- Fix: Restore legacy section order and in-context drawer; preserve vNext accessibility treatment.

## G2-2-001-006  [P2] GAP  facet F03  effort S
- Legacy: LF:127-136 4 severity-open chips and status-count chips
- vNext now: NP:72-77 one Critical open label plus all-status chips
- Fix: Render Critical/High/Medium/Low open chips with counts and click-to-filter.

## G2-2-001-007  [P2] GAP  facet F03  effort S
- Legacy: LF:111-115 provenance From repo, last synced, result
- vNext now: NP:32-33 generic subtitle; 114-124 import status separate
- Fix: Show per-run repo, success timestamp and result in legacy position.

## G2-2-001-008  [P2] GAP  facet F03  effort M
- Legacy: LD:109-116 status/severity tags, reported-as label, area/kind, copyable ID, Copy for Claude
- vNext now: ND:29-33 tags and title; ND:59-63 related copy action
- Fix: Include reported severity, area and kind as badges, one-click ID and copy action in header.

## G2-2-001-009  [P2] GAP  facet F04  effort M
- Legacy: LS:65-67 select title, area, roles, reportedSeverity, kind, environment, foundBy, foundAt, updatedAt, duplicateOf
- vNext now: NS:52-54 selects table from draft; NP:53-62 omits environment, reportedSeverity and role in list
- Fix: Add environment and reported-by/session/reportedSeverity where legacy renders them.

## G2-2-001-010  [P2] GAP  facet F04  effort S
- Legacy: LF:99-101 Reported IST date plus reporter on second line
- vNext now: NP:62 dateStyle medium, reporter before date on one line
- Fix: Use legacy IST short time, date first then agent second line.

## G2-2-001-014  [P2] GAP  facet F05  effort S
- Legacy: LF:87-102 columns Severity, Finding, Status, Assigned, Reported, fixed widths
- vNext now: NP:52-63 columns Finding, Area/Kind, Severity, Status, Assigned, Reported
- Fix: Reorder columns to exact legacy sequence and show area/kind inline with finding.

## G2-2-001-016  [P2] GAP  facet F05  effort M
- Legacy: LF:139-150 select Status/Severity/Area/Kind multi-select in one row, live on change
- vNext now: NP:86-105 Area free-text; multi-selects inside More filters requiring Apply
- Fix: Restore enumerated multi-select Area and live filter behavior.

## G2-2-001-020  [P2] GAP  facet F06  effort M
- Legacy: LD:160-201 Change status select and conditional required reason, duplicate picker, Set to status button
- vNext now: NA:17-37 action dropdown and 65-70 status selector; 92-103 generic Save details/confirm
- Fix: Restore action-specific labels and inline status controls, preserving CAS confirmation.

## G2-2-001-033  [P2] MISSING  facet F09  effort M
- Legacy: LF:189 drawer open on full-row click, width 720, close/reset; LD:103-107 skeleton/error
- vNext now: ND:15-18 detail route, ND:28-79 full page; no drawer
- Fix: Implement 720px drawer, on-close restore list without navigation and lazy detail loading.

## G2-2-001-034  [P2] MISSING  facet F09  effort M
- Legacy: LD:148-154 Looks similar warning with top five matched same-area titles
- vNext now: ND:55-58 search link; no similar candidates panel
- Fix: Expose similar candidates from service with legacy 0.6 overlap rule.

## G2-2-001-035  [P2] GAP  facet F10  effort M
- Legacy: LC:43-50 GET list status,severity,area,kind,q,view,page,size; LA:7-10 GET /api/v1/superadmin/audit-findings
- vNext now: NP:27-44 server-only query in service; no equivalent public GET API
- Fix: If external API clients exist, provide auth-guarded GET compatibility route; otherwise record contract change.

## G2-2-001-037  [P2] GAP  facet F10  effort M
- Legacy: LC:70-73 GET /{id}, LC:76-98 POST status/severity/assignee/comment/commit returning detail
- vNext now: NE:8-21 one PATCH route with tagged action and version
- Fix: Preserve semantic action behavior and response shape, or document breaking REST contract.

## G2-2-001-042  [P2] GAP  facet F12  effort M
- Legacy: LS:30-35 statuses ten lower snake_case, closed subset, note-required subset
- vNext now: NM:2-4 ten uppercase including FIXED_DEV, RELEASED_PROD, CANT_REPRODUCE
- Fix: Normalize legacy values on migration/API, preserving existing semantics and labels.

## G2-2-001-047  [P2] GAP  facet F13  effort M
- Legacy: LD:55-70 drawer loading skeleton and Couldn't load this finding; LD:260 No history
- vNext now: ND:18 notFound(), ND:72 No audit events recorded; no in-drawer skeleton
- Fix: Restore drawer-specific loading/error and No history placeholders.

## G2-2-001-049  [P2] GAP  facet F14  effort M
- Legacy: LF:166-186 collapsible problem files columns File/Result/Why/Checked
- vNext now: NP:46-51 and 125-133 Source file/Refusal reason, only refused not tampered/deleted
- Fix: Restore flagged statuses + four legacy columns in expander.

## G2-2-001-052  [P2] GAP  facet F16  effort M
- Legacy: LF:139-151 responsive Space.wrap controls, AntD Table widths, LD:104 drawer width 720
- vNext now: NP:78-105 md/lg form grid, NP:52-63 DataTable priorities; ND:28-79 mobile sections
- Fix: Verify 375/768/1280 against legacy; preserve controls while preventing side scroll.

## G2-2-001-054  [P2] GAP  facet F17  effort M
- Legacy: LD:103 AntD drawer focus trapping/destroyOnClose
- vNext now: ND:28-79 standalone route with PageBackLink; NA:100-105 ConfirmDialog
- Fix: If restoring drawer, retain focus trap, return focus and Escape behavior and 44px touch targets.

## G2-2-001-059  [P2] GAP  facet F19  effort S
- Legacy: LS:62-68 page size accepts 1..200 default 50, optional page 0-based
- vNext now: NS:53-54 fixed 50, NM:13 URL page 1..10000
- Fix: Determine if API page-size clients need 1..200; avoid arbitrary 10k page cap if not needed.

## G2-2-001-011  [P3] GAP  facet F04  effort S
- Legacy: LF:100 unassigned reads Nobody
- vNext now: NP:61 unassigned reads Unassigned
- Fix: Change empty assignee cell copy to Nobody.

## G2-2-001-012  [P3] GAP  facet F04  effort S
- Legacy: LD:18-19 missing detail reads Not given; LD:144 fix commits None yet
- vNext now: ND:35,43 missing detail Not recorded; ND:77 No fix commits recorded.
- Fix: Restore exact legacy empty placeholders by field.

## G2-2-001-019  [P3] GAP  facet F05  effort S
- Legacy: LF:160 release-empty 'No open critical or high findings', other 'No findings match'
- vNext now: NP:112 generic 'No matching audit findings'
- Fix: Use view-specific exact legacy empty copy.

## G2-2-001-055  [P3] GAP  facet F18  effort S
- Legacy: LF:18 Release blockers
- vNext now: NP:69 Release (critical & high)
- Fix: Use exact Release blockers tab label.

## G2-2-001-056  [P3] GAP  facet F18  effort S
- Legacy: LF:149 Search title, summary, id, file
- vNext now: NP:81 ID, title or summary
- Fix: Restore full search placeholder and include file data in search.

## G2-2-001-057  [P3] GAP  facet F18  effort S
- Legacy: LD:220-223 Assigned to / Name or agent / Save
- vNext now: NA:75-77 Assignee / no placeholder / Save details
- Fix: Restore exact form wording.

## G2-2-001-058  [P3] GAP  facet F18  effort S
- Legacy: LD:238-240 Comment / Add to the history / Add comment
- vNext now: NA:92-97 Note or reason / Save details
- Fix: Restore distinct comment form wording.
