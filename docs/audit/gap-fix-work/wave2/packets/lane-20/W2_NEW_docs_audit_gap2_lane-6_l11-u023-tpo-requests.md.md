# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l11-u023-tpo-requests.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u023-tpo-requests.md

## G2-11-023-002  [P2] GAP  facet F02  effort M
- Legacy: Header then single bordered Card around RequestsPanel (requests.js:13-24).
- vNext now: PageHeader then nav, disclosure, form, needs-doing, list, tools disclosures (requests/page.tsx:72-191).
- Fix: Reproduce single legacy card and section hierarchy.

## G2-11-023-003  [P2] GAP  facet F02  effort S
- Legacy: Segmented Waiting/Last 30 days/All history inside panel above needs doing (RequestsPanel.js:408-428).
- vNext now: FilterChipLink trio above search and needs-doing (requests/page.tsx:74-84,92-130).
- Fix: Use legacy segmented appearance and positioning.

## G2-11-023-004  [P2] GAP  facet F03  effort S
- Legacy: Pending segmented label Waiting (N) only when waiting selected (RequestsPanel.js:409-415).
- vNext now: Waiting no count; separate status disclosure with counts (requests/page.tsx:74-90).
- Fix: Place pending count on selected Waiting tab.

## G2-11-023-006  [P2] GAP  facet F03  effort M
- Legacy: Button Act on all N/Act on N selected with ThunderboltOutlined (RequestsPanel.js:313-325).
- vNext now: Bulk controls nested in Review tools disclosure (requests/page.tsx:162-177).
- Fix: Expose Act control and selected-count strip directly above table.

## G2-11-023-007  [P2] GAP  facet F04  effort S
- Legacy: All seven exact request type labels incl PAP and correction with proof (RequestsPanel.js:22-25).
- vNext now: Renders replaceAll('_',' ') uppercase tokens in row heading (requests/page.tsx:138-140).
- Fix: Use exact REQUEST_TYPES display strings; include proper PAP expansion.

## G2-11-023-011  [P2] GAP  facet F04  effort M
- Legacy: Drive cell missing Not about a drive; next round name today/tomorrow + 12h time (RequestsPanel.js:146-152,350-358).
- vNext now: Company · Job title always, cue tpoNextRoundCue (requests/page.tsx:140-147).
- Fix: Show exact missing-drive placeholder and round date/clock string.

## G2-11-023-012  [P2] GAP  facet F04  effort M
- Legacy: Asked age fromNow tooltip full D MMM YYYY h:mm A (RequestsPanel.js:361).
- vNext now: IST absolute timestamp and age label inline (requests/page.tsx:149).
- Fix: Use relative time primary with full timestamp tooltip; preserve IST timezone.

## G2-11-023-013  [P2] GAP  facet F04  effort S
- Legacy: Decided by '-' missing, decided on D MMM h:mm A, Why '-' missing (RequestsPanel.js:363-365).
- vNext now: Decided by Authorized placement team, decided on verbose IST, Why No additional decision note recorded (requests/page.tsx:151-154).
- Fix: Match missing placeholders and concise formats.

## G2-11-023-014  [P2] GAP  facet F05  effort L
- Legacy: Table columns Request, Student, Drive, What they asked, Asked, Decided by/Decided on/Why hidden while pending, row action (RequestsPanel.js:328-388).
- vNext now: Vertically stacked request cards with inline context and decision, no column visibility controls (requests/page.tsx:135-160).
- Fix: Restore desktop table with exact columns, responsive hiding, row action layout.

## G2-11-023-017  [P2] GAP  facet F05  effort M
- Legacy: Search matches full student name, roll, drive, type (RequestsPanel.js:430-434).
- vNext now: Search student number/name/job/company, 150 max (requests/page.tsx:95-97).
- Fix: Match legacy search tokens incl request kind.

## G2-11-023-028  [P2] GAP  facet F09  effort M
- Legacy: ActionsWindow groups Approve/Reject/Talk to them (RequestsPanel.js:285-312,440-442).
- vNext now: Review tools disclosure has bulk decision, sequential review, nudge (requests/page.tsx:162-177).
- Fix: Recreate grouped Actions window and corresponding bulk confirm UX.

## G2-11-023-029  [P2] GAP  facet F10  effort M
- Legacy: Fetch GET /api/v1/tpo/students/requests-queue with includeDecided=false/true, decidedDays 30/0 (RequestsPanel.js:179-188; TpoHubService.js:55).
- vNext now: getTpoGlobalRequestsInbox paged service with status/age/sort etc (tpo-global-requests-service.ts:12-35).
- Fix: Document endpoint mapping, preserve default time window semantics.

## G2-11-023-036  [P2] GAP  facet F13  effort M
- Legacy: Initial failure PanelError with Retry, reload failure with stale rows warning (RequestsPanel.js:177-188,391-406).
- vNext now: Server ErrorState, Invalid request filters and empty-state page (requests/page.tsx:58-63,131-135).
- Fix: Preserve last-success client data on refresh fail or explain server-only change.

## G2-11-023-039  [P2] GAP  facet F15  effort M
- Legacy: Each approval/rejection tells student, bulk message via bulkNudge max1000 (RequestsPanel.js:154-158,307-311).
- vNext now: Page footnote says in-app notice, no email; nudge panel separate (requests/page.tsx:173-176,190).
- Fix: Cross-check notice recipients, exact message text and deduplicated student nudge.

## G2-11-023-040  [P2] GAP  facet F16  effort M
- Legacy: Legacy TpoDataTable column 'Asked' responsive md; other widths via shared table (RequestsPanel.js:328-388).
- vNext now: Mobile list always no table, 11px text fields and 44px links (requests/page.tsx:135-160).
- Fix: Compare mobile 375/tablet768 and restore consistent responsive table behavior.

## G2-11-023-043  [P2] GAP  facet F18  effort S
- Legacy: Work chip labels Urgent: a round within 24 hours, Waiting more than 2 days, Proof missing (RequestsPanel.js:120-124,418-425).
- vNext now: Urgent, Waiting more than 2 days, May need proof review (requests/page.tsx:121-128).
- Fix: Use exact legacy labels/count formatting.

## G2-11-023-037  [P3] GAP  facet F13  effort S
- Legacy: Pending empty 'Nothing is waiting for you', decided empty 'No requests in this period' (RequestsPanel.js:430-437).
- vNext now: Pending empty adds terminal period; alternate page-out-of-range state (requests/page.tsx:131-135).
- Fix: Match exact empty strings, retain extra paged-recovery affordance.
