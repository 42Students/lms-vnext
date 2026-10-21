# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

20 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-003  [P2] GAP  facet F01  effort S
- Legacy: colleges.js:248-257 SuperAdminTemplateShell title and subtitle, Refresh action
- vNext now: colleges/page.tsx:59-64 Back to templates and PageHeader title/subtitle, no Refresh button
- Fix: Restore shell actions and exact subtitle, refresh scope

## G2-7-033-004  [P2] GAP  facet F02  effort M
- Legacy: colleges.js:246-273 one TemplateShell and College availability Card
- vNext now: colleges/page.tsx:58-79 PageHeader, Tabs, FilterBar and Bulk Disclosure
- Fix: Match Card hierarchy, place filters in Card header

## G2-7-033-005  [P2] GAP  facet F02  effort M
- Legacy: colleges.js:273-283 explanation and bulk actions inside Card before Table
- vNext now: colleges/page.tsx:65-80 filter form, separate Bulk Disclosure then Table
- Fix: Preserve old action/order and default visibility

## G2-7-033-006  [P2] GAP  facet F02  effort M
- Legacy: colleges.js:284-298 table in same Card with built-in selection
- vNext now: colleges/page.tsx:80-102 DataTable plus separate bulk selector list
- Fix: Restore integrated selectable table or preserve selection across both

## G2-7-033-007  [P2] GAP  facet F03  effort S
- Legacy: colleges.js:253-255 Refresh icon Button in TemplateShell actions
- vNext now: colleges/page.tsx:59-64 no explicit Refresh button
- Fix: Add icon + Refresh button with loading state

## G2-7-033-008  [P2] GAP  facet F03  effort S
- Legacy: colleges.js:269-270 Search colleges allowClear Input.Search width240
- vNext now: colleges/page.tsx:67-68 College name or code Input no icon and explicit Filter
- Fix: Match width, placeholder, clear icon, live search

## G2-7-033-009  [P2] GAP  facet F03  effort M
- Legacy: colleges.js:185-239 Available to this college Switch and Assigned/Not assigned Tag
- vNext now: colleges/page.tsx:87-97 availability StatusBadge and separate ProjectTemplateActions
- Fix: Match inline Switch and tags with pending state

## G2-7-033-010  [P2] GAP  facet F03  effort M
- Legacy: colleges.js:232-237 Unknown orange Tag and disabled Switch when fetch could not confirm state
- vNext now: colleges/page.tsx:45-55 whole ErrorState on read error, no Unknown per row
- Fix: Provide per-college Unknown state for partial read failure when supported

## G2-7-033-012  [P2] GAP  facet F03  effort S
- Legacy: colleges.js:175-181 college name plus city/state second line
- vNext now: colleges/page.tsx:83-85 college name and code second line
- Fix: Show city/state (or fallback) rather than only college code

## G2-7-033-017  [P2] GAP  facet F05  effort M
- Legacy: colleges.js:170-243 two columns College and Available to this college
- vNext now: colleges/page.tsx:80-98 five columns College, Availability, Assigned version, Assigned on, Actions
- Fix: Restore compact two-column table or add optional metadata view

## G2-7-033-020  [P2] GAP  facet F05  effort M
- Legacy: colleges.js:165-168 local immediate search all colleges
- vNext now: colleges/page.tsx:65-75 GET server search and Filter button
- Fix: Apply live search/clear without submit, preserve selected row keys

## G2-7-033-021  [P2] GAP  facet F05  effort M
- Legacy: colleges.js:287 rowKey college.id numeric
- vNext now: colleges/page.tsx:81 rowKey UUID id
- Fix: Map old numeric identity to UUID in selection model

## G2-7-033-022  [P2] GAP  facet F06  effort S
- Legacy: colleges.js:270 input Search colleges defaults empty
- vNext now: colleges/page.tsx:67-68 College name or code with maxLength100, default query.q
- Fix: Match placeholder and 240px width

## G2-7-033-045  [P2] GAP  facet F13  effort M
- Legacy: colleges.js:265-266 loading Template skeleton six rows, :284 six for assignment table
- vNext now: colleges/page.tsx:44-56 awaited server result, no in-page skeleton
- Fix: Restore six-row shape-matched placeholders

## G2-7-033-046  [P2] GAP  facet F13  effort S
- Legacy: colleges.js:294-296 No colleges match your search
- vNext now: colleges/page.tsx:99-100 No matching colleges with different description
- Fix: Match exact empty text

## G2-7-033-047  [P2] GAP  facet F13  effort S
- Legacy: colleges.js:258-263 separate template and assignment errors
- vNext now: colleges/page.tsx:45-55 one combined failure
- Fix: Retain source-specific retry actions

## G2-7-033-050  [P2] GAP  facet F16  effort M
- Legacy: colleges.js:269-270 fixed 240px search and Table scroll x max-content
- vNext now: colleges/page.tsx:65-103 responsive FilterBar/DataTable
- Fix: Match row layout and horizontal overflow on 375/768/1280

## G2-7-033-054  [P2] GAP  facet F18  effort S
- Legacy: colleges.js:250-251 Which colleges can see and use this template.
- vNext now: colleges/page.tsx:61-62 Availability within current safety scope. Existing workspaces retain...
- Fix: Use legacy subtitle, put scope caveat separately

## G2-7-033-055  [P2] GAP  facet F18  effort S
- Legacy: colleges.js:268 College availability and :270 Search colleges
- vNext now: colleges/page.tsx:65 Filters / College name or code
- Fix: Restore Card title and search wording

## G2-7-033-056  [P2] GAP  facet F18  effort S
- Legacy: colleges.js:185 Available to this college
- vNext now: colleges/page.tsx:87 Availability
- Fix: Match full column label
