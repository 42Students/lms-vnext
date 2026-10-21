# Work packet (wave 2): edit src/components/activity/activity-center.tsx (part 2 of 2)

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-audit-hub.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md, docs/audit/gap2/lane-10/superadmin-audit.md

## G2-9-026-045  [P2] GAP  facet F13  effort M
- Legacy: Load more shows in-button spinner and appends rows `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:250-255`
- vNext now: URL Load more link; page navigation replaces feed `src/components/activity/activity-center.tsx:197-204`
- Fix: Keep progressively appended feed and disabled pending.

## G2-9-026-049  [P2] GAP  facet F16  effort M
- Legacy: Legacy two segmented toolbars and compact feed responsive via CSS `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:179-188`
- vNext now: New responsive form grid and article cards `src/app/(authenticated)/activity/page.tsx:237-252` `src/components/activity/activity-center.tsx:113-207`
- Fix: Match header/control density and day-separator gap on desktop/mobile.

## G2-9-026-053  [P2] GAP  facet F18  effort S
- Legacy: Exact empty/error text and Loading activity skeleton label `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:199-209`
- vNext now: Different no matching wording and server loading `src/components/activity/activity-center.tsx:105-110`
- Fix: Match state copy.

## G2-9-026-054  [P2] GAP  facet F19  effort M
- Legacy: 50-row pages with append and total `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:21-22,100-107`
- vNext now: 50 limit per cursor with grouped summaries (may collapse multiple events) `src/app/(authenticated)/activity/page.tsx:129-131` `src/components/activity/activity-center.tsx:197-204`
- Fix: Clarify whether 50 means raw events or groups, show accurate remaining.

## G2-9-026-062  [P2] GAP  facet F22  effort M
- Legacy: Legacy displays every fetched event as separate row `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:211-246`
- vNext now: Groups related events by groupKey with count and summary `src/components/activity/activity-center.tsx:143-165`
- Fix: Allow expansion of each individual event for forensic parity.

## G2-9-027-012  [P2] GAP  facet F04  effort S
- Legacy: Time formatTimestamp from legacy Jackson-array UTC `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:197-198`
- vNext now: Intl dateStyle medium timeStyle short IST `src/components/activity/activity-center.tsx:62-68`
- Fix: Match exact timestamp shape and timezone.

## G2-9-027-013  [P2] GAP  facet F04  effort S
- Legacy: Action displays statusLabel humanized and tooltip raw actionKey `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:199-209`
- vNext now: New eventType humanized printed on card/details `src/components/activity/activity-center.tsx:169-184`
- Fix: Show action as column with raw key tooltip.

## G2-9-027-014  [P2] GAP  facet F04  effort M
- Legacy: Entity/Org/College columns show target and tenant human names `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:210-220`
- vNext now: New summary and entity technical ID in disclosure; no Org/College in row `src/components/activity/activity-center.tsx:149-152,180-189`
- Fix: Add explicit Org/College names for global forensic list.

## G2-9-027-016  [P2] GAP  facet F04  effort S
- Legacy: Missing target name fallback Student #id or Project task #id `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:186-195`
- vNext now: Humanized subjectType and subjectLabel; no #id fallback in sentence `src/components/activity/activity-center.tsx:36-54`
- Fix: Restore safe entity type + ID fallback.

## G2-9-027-036  [P2] GAP  facet F10  effort M
- Legacy: Pagination supports random page number and page size `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:114-120`
- vNext now: Cursor-based Load more only, no arbitrary jump `src/app/(authenticated)/activity/page.tsx:199-208` `src/components/activity/activity-center.tsx:197-204`
- Fix: Support direct page navigation for forensic investigations.

## G2-9-027-041  [P2] GAP  facet F12  effort M
- Legacy: SingleRecord hides redundant Entity/Org and scoped College columns `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:42-43,210-219`
- vNext now: Full event summary same content regardless fixed entity context `src/components/activity/activity-center.tsx:123-189`
- Fix: Add compact per-subject history mode.

## G2-9-027-044  [P2] GAP  facet F13  effort S
- Legacy: Empty No activity recorded yet `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:320-320`
- vNext now: EmptyState No meaningful activity matches these filters. `src/components/activity/activity-center.tsx:105-110`
- Fix: Restore raw audit empty state wording.

## G2-9-027-049  [P2] GAP  facet F16  effort L
- Legacy: Compact eight-column Table with max-content horizontal scroll `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:254-270,314-329`
- vNext now: Stacked article design/mobile variants `src/components/activity/activity-center.tsx:114-195`
- Fix: Restore desktop dense table and horizontal scroll, preserve responsive collapse.

## G2-9-027-051  [P2] GAP  facet F17  effort M
- Legacy: Actor tooltip reveals raw key while showing friendly name `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:223-230`
- vNext now: Shows name/email, raw key only in detail events `src/components/activity/activity-center.tsx:45-54`
- Fix: Add accessible tooltip/secondary technical ID.

## G2-9-027-054  [P2] GAP  facet F19  effort M
- Legacy: Legacy GET page up to200, shows total entries `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:11,321-329`
- vNext now: Limit50, remainingCount, grouped activity feed `src/app/(authenticated)/activity/page.tsx:129-131` `src/components/activity/activity-center.tsx:197-204`
- Fix: Implement raw server paging and exact total.

## G2-9-027-059  [P2] GAP  facet F21  effort M
- Legacy: Backend optional actor target name resolvers tolerate missing users `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:103-115`
- vNext now: New actor fallback System but no exact legacy raw key `src/components/activity/activity-center.tsx:45-54`
- Fix: Preserve deleted-account traceability.

## G2-10-003-016  [P3] GAP  facet F04  effort S
- Legacy: Old full technical action key hidden from main feed and available in CSV `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:231-239` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-175`
- vNext now: New humanized eventType printed on right of each item `src/components/activity/activity-center.tsx:168-176`
- Fix: Move technical event code into details only to reduce noise as in legacy

## G2-10-003-059  [P3] GAP  facet F18  effort S
- Legacy: Legacy inline toggle changes Details to Hide details `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:228-239`
- vNext now: New Disclosure summary remains Details regardless open state `src/components/activity/activity-center.tsx:180-190`
- Fix: Display Hide details for expanded disclosures as legacy

## G2-9-026-015  [P3] GAP  facet F04  effort S
- Legacy: Day headings Today, Yesterday, dddd D MMM YYYY `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:144-154`
- vNext now: IST dates headings Today/Yesterday otherwise weekday D Month YYYY `src/components/activity/activity-center.tsx:56-61,116-124`
- Fix: Match shortened month and time convention exactly.
