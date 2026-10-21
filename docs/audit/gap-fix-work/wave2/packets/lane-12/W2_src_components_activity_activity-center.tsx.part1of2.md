# Work packet (wave 2): edit src/components/activity/activity-center.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md

## G2-10-003-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy each activity group uses h3 day heading then bare ul timeline entries `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:211-245`
- vNext now: New day heading and border-bottom article list but no ul/li timeline shape `src/components/activity/activity-center.tsx:113-194`
- Fix: Recreate old list/timeline semantically and visual rhythm without reverting approved grouping

## G2-10-003-008  [P2] GAP  facet F03  effort S
- Legacy: Old sentence in each entry starts time in its own narrow column `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:220-226`
- vNext now: New item shows full formatted timestamp below headline `src/components/activity/activity-center.tsx:149-166`
- Fix: Restore compact left-side h:mm A time column on activity cards

## G2-10-003-009  [P2] GAP  facet F03  effort M
- Legacy: Old items visually colored by danger/warn/good/neutral action type `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:81-87` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:221-225`
- vNext now: New badges color severity and module via importance rather than action tone `src/components/activity/activity-center.tsx:70-88` `src/components/activity/activity-center.tsx:126-142`
- Fix: Map old action tone and icon/border treatments alongside new importance badges

## G2-10-003-010  [P2] GAP  facet F03  effort S
- Legacy: Bulk action gets small tag several at once `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:224-227`
- vNext now: New badge shows N related events and details grouped count `src/components/activity/activity-center.tsx:143-147` `src/components/activity/activity-center.tsx:180-185`
- Fix: Preserve human wording several at once for grouped bulk operations

## G2-10-003-012  [P2] GAP  facet F03  effort M
- Legacy: Old details show up to 14 payload keys and IP/When in inline dl `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:100-108` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:231-240`
- vNext now: New detail uses sanitized metadata, Entity/Action/time/grouped fields; lacks IP in feed projection `src/components/activity/activity-center.tsx:180-189` `src/app/(authenticated)/activity/page.tsx:133-170`
- Fix: Restore permitted audit IP and old When details for authorized audit viewers

## G2-10-003-014  [P2] GAP  facet F04  effort M
- Legacy: Old actor resolves FACULTY/LEARNER names with fallback Staff #ID or Student #ID `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:136-142` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:43-90`
- vNext now: New actor displayName else email else System `src/components/activity/activity-center.tsx:45-54`
- Fix: Retain non-sensitive fallback semantics for deleted users rather than System for all missing names

## G2-10-003-015  [P2] GAP  facet F04  effort M
- Legacy: Old name of affected item drawn from payload name fields or targetNames lookup `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:63-79`
- vNext now: New sentence reads subjectLabel and omits lookup for missing label `src/components/activity/activity-center.tsx:45-55`
- Fix: Compute safe subject label lookup when subjectLabel absent for consistent readable entities

## G2-10-003-017  [P2] GAP  facet F04  effort M
- Legacy: Old details payload null and empty filtered, objects shortened to 160 chars, max 14 keys `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:89-108`
- vNext now: New details prints all sanitized metadata entries with full JSON values `src/components/activity/activity-center.tsx:180-189`
- Fix: Cap and sanitize expanded payload rows while preserving access to the full event detail page

## G2-10-003-019  [P2] GAP  facet F05  effort M
- Legacy: Old pagination appends next page of 50 to current feed `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:21-21` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-116` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:250-255`
- vNext now: New cursor route navigates to older 50 only; group list replaced not appended `src/app/(authenticated)/activity/page.tsx:98-131` `src/app/(authenticated)/activity/page.tsx:172-208` `src/components/activity/activity-center.tsx:197-204`
- Fix: Use append-style load more or make older-page behavior explicit to avoid losing prior context

## G2-10-003-030  [P2] GAP  facet F09  effort S
- Legacy: Old row Details expands with Hide details toggle in same list row `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:228-241`
- vNext now: New row Disclosure Details with additional View details link `src/components/activity/activity-center.tsx:168-190`
- Fix: Match inline toggle label placement; retain drill-through as enhancement

## G2-10-003-042  [P2] GAP  facet F13  effort S
- Legacy: Old initial scope change clears old rows and shows ListSkeleton 6 rows `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-95` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:203-209`
- vNext now: New server route plus ActivityCenter renders data or EmptyState; separate loading boundary needed `src/app/(authenticated)/activity/page.tsx:98-131` `src/components/activity/activity-center.tsx:105-111`
- Fix: Ensure route loading skeleton matches six-row visual density

## G2-10-003-045  [P2] GAP  facet F13  effort S
- Legacy: Old no important items message Nothing important happened in this period. `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:207-209`
- vNext now: New empty headline No meaningful activity matches these filters. and technical noise description `src/components/activity/activity-center.tsx:105-110`
- Fix: Use category-specific legacy empty messages and adapt approved supplemental description

## G2-10-003-051  [P2] GAP  facet F16  effort M
- Legacy: Old day list shows time column and sentence then Details below `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:211-240`
- vNext now: New item is flex article with badges top, sentence, date then View details right `src/components/activity/activity-center.tsx:121-191`
- Fix: Match old visual order and spacing before extending badges

## G2-7-030-013  [P2] GAP  facet F03  effort M
- Legacy: audit/index.js:335-343 destructive action has orange warning and volcano tag, others blue
- vNext now: activity-center.tsx:126-142 importance badges not destructive-action tags
- Fix: Map destructive classes and show matching warning icon

## G2-7-030-015  [P2] GAP  facet F04  effort M
- Legacy: audit/index.js:117-130 legacy Jackson LocalDateTime array parsed as local time
- vNext now: activity-center.tsx:62-68 formats ISO instants in Asia/Kolkata
- Fix: Crosswalk legacy date-array and ISO UTC semantics; verify IST output

## G2-7-030-017  [P2] GAP  facet F04  effort M
- Legacy: audit/index.js:348-405 entityType/entityId/name, task sync interpreted as Project
- vNext now: activity-center.tsx:149-170 subject type/label displayed as a grouped sentence
- Fix: Show original entity type, ID and Open destination, handle bulk task sync

## G2-7-030-018  [P2] GAP  facet F04  effort S
- Legacy: audit/index.js:409-419 actorName fallback User #id and actorUserType label
- vNext now: activity-center.tsx:45-54 actor displayName/email or System
- Fix: Restore actor type and User #id fallback

## G2-7-030-021  [P2] GAP  facet F05  effort L
- Legacy: audit/index.js:325-430 columns Action, Entity, Actor, When with expandable JSON payload
- vNext now: activity-center.tsx:113-170 grouped event prose and disclosure
- Fix: Restore 4-column table and expandable individual rows

## G2-7-030-025  [P2] GAP  facet F05  effort M
- Legacy: audit/index.js:445-466 expandable payload only when payloadJson present
- vNext now: activity-center.tsx:170-197 Disclosure based on grouped metadata
- Fix: Expand individual event metadata row with typed JSON fallback

## G2-7-030-039  [P2] GAP  facet F09  effort M
- Legacy: audit/index.js:445-466 expanded row renders Descriptions key/value and recursive structured values
- vNext now: activity-center.tsx:170-197 Disclosure for summary metadata
- Fix: Match inline bordered expanded detail view for each row

## G2-7-030-044  [P2] GAP  facet F10  effort M
- Legacy: audit/index.js:398-403 entity Open links exact workspace slug/id
- vNext now: activity-center.tsx:113-197 general event prose, no Open workspace per event
- Fix: Add safe owner-scoped link for project entity

## G2-7-030-054  [P2] GAP  facet F13  effort S
- Legacy: audit/index.js:629-634 contextual empty text by stale entity, action or range
- vNext now: activity-center.tsx:105-110 generic no meaningful activity
- Fix: Restore three precise no-results states

## G2-7-030-063  [P2] GAP  facet F16  effort M
- Legacy: audit/index.js:617-624 Table scroll x=max-content for narrow screens
- vNext now: activity-center.tsx:113-170 flexible article list
- Fix: Restore horizontally scrollable four-column table at narrow widths

## G2-7-030-078  [P2] GAP  facet F22  effort M
- Legacy: audit/index.js:432-466 nested payloadJson can be raw string or object
- vNext now: activity-center.tsx:13-21 metadata typed Record<string,unknown>
- Fix: Preserve non-JSON payload fallback, avoid losing historical records

## G2-8-031-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:197-239 raw audit Table includes Time, Action, Entity, Actor, Org, College, IP/User Agent fields with Tooltip details.
- vNext now: src/components/activity/activity-center.tsx:123-188 renders Event summary, module/importance chips and folded technical Details instead of a raw table.
- Fix: Provide separate raw audit Table mode with all legacy columns; retain human readable feed as default.

## G2-8-031-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:36-40 actorNames/targetNames maps from API, :46-52 resolves org and college display names.
- vNext now: src/components/activity/activity-center.tsx:45-55 uses actor displayName/email and subjectLabel; src/modules/activity/service.ts:631-660 joins users; original actor contact fallback absent.
- Fix: Fallback actor label System/Student #ID/Staff #ID and expose original actor identity in folded details.

## G2-8-031-015  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:158-163 displays date as 'D MMM YYYY', time 'h:mm A' local.
- vNext now: src/components/activity/activity-center.tsx:62-67 en-IN medium datetime IST with date/time in one line.
- Fix: Use original date/time split in TPO table, retain IST conversion explicitly.

## G2-8-031-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:21 PAGE_SIZE=50, :74-116 append 50-event pages; category/date filter and total count.
- vNext now: src/app/(authenticated)/activity/page.tsx:98-131 lists limit50 with beforeOccurredAt/beforeId cursor; src/components/activity/activity-center.tsx:90-110 empty state.
- Fix: Preserve visible 'Load more' count and total semantics, validating 50 records against legacy page behavior.

## G2-8-031-033  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:197-239 raw fields include foldable actor/target Tooltip; per-record audit mini trail rendered in drawer variant fixedEntityId.
- vNext now: src/components/activity/activity-center.tsx:180-190 Disclosure details and :172-177 new event-detail navigation.
- Fix: Support inline row detail/drawer for pinned record, preserving raw ID tooltip.

## G2-8-031-042  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-43 important category from admin_audit_log action/category, default 30-day window; :144-153 groups by day.
- vNext now: src/components/activity/activity-center.tsx:45-67 humanized eventType, groupActivityEvents src/modules/activity/service.ts:698-744 groups related events and day headings in IST.
- Fix: Match grouping threshold/actor+subject key and day boundary under both server/local timezone.

## G2-8-031-053  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:314-335 responsive table scroll width and raw filters wrap; docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:178-188 Segmented bar can overflow on phone.
- vNext now: src/app/(authenticated)/activity/page.tsx:237-390 collapsible forms, src/components/activity/activity-center.tsx:123-179 responsive flex with min-h-11 controls.
- Fix: Verify old/new at 375,768,1280; clone segment/text wrap and scroll affordance without shrinking taps.

## G2-8-031-055  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:181-185 Segmented button keyboard reachable; docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:314-335 AntD Table aria row controls.
- vNext now: src/components/activity/activity-center.tsx:172-189 detail link/Disclosure focusable; presets in src/app/(authenticated)/activity/page.tsx:237 are disclosure-based.
- Fix: Use role=tablist or labeled segmented control with visible focus; announce active category and loaded count.

## G2-9-026-006  [P2] GAP  facet F02  effort L
- Legacy: Rows are list items grouped by day heading, with time and inline sentence `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:211-245`
- vNext now: Events rendered as card-like articles with badges and summary, Details disclosure `src/components/activity/activity-center.tsx:114-192`
- Fix: Recreate dense timeline rows with time left and sentence right.

## G2-9-026-010  [P2] GAP  facet F03  effort S
- Legacy: Each record button Details / Hide details `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:228-230`
- vNext now: Disclosure title Details, no explicit Hide details label `src/components/activity/activity-center.tsx:180-190`
- Fix: Toggle visible label to Hide details when expanded.

## G2-9-026-011  [P2] GAP  facet F03  effort S
- Legacy: Bulk group Tag several at once only when bulk `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:225-226`
- vNext now: Related events counter N related events on grouped card `src/components/activity/activity-center.tsx:143-146`
- Fix: Match several at once chip, retain count in detail.

## G2-9-026-012  [P2] GAP  facet F04  effort M
- Legacy: Feed fields time, actor, humanized action, thing, target, optional bulk tag `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:221-239`
- vNext now: Importance/module badges, event sentence/summary, timestamp and event key `src/components/activity/activity-center.tsx:126-170`
- Fix: Reorder visual hierarchy to match actor verb target; suppress technical badges to Details.

## G2-9-026-013  [P2] GAP  facet F04  effort M
- Legacy: Details include payload key/value, IP, exact When `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:236-239`
- vNext now: Details include action, entity/id, IST exact time, grouped events and metadata; no IP `src/components/activity/activity-center.tsx:180-189`
- Fix: Expose allowed redacted IP if permitted by audit privacy policy.

## G2-9-026-014  [P2] GAP  facet F04  effort S
- Legacy: Unknown actor rendered System or Staff #id / Student #id `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:136-142`
- vNext now: Fallback actor is displayName or email or System, no id fallback `src/components/activity/activity-center.tsx:45-54`
- Fix: Render safe legacy fallback identifier if actor missing.

## G2-9-026-016  [P2] GAP  facet F04  effort S
- Legacy: Row time h:mm A (e.g. 9:30 AM) `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:222-225`
- vNext now: Medium date plus short time printed per article `src/components/activity/activity-center.tsx:62-68,153-165`
- Fix: Show h:mm A in timeline, full date in Details.

## G2-9-026-021  [P2] GAP  facet F05  effort M
- Legacy: Load more appends 50 rows beneath current feed `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:250-255`
- vNext now: 50 rows per page, Load more navigates to older URL replacing shown page `src/app/(authenticated)/activity/page.tsx:129-131,172-208` `src/components/activity/activity-center.tsx:197-204`
- Fix: Keep prior rows in view during Load more; support cumulative timeline.
