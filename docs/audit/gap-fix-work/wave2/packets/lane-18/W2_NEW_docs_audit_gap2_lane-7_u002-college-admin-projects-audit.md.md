# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md

36 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md

## G2-7-002-003  [P2] MISSING  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:349-353,382-391: Workspace Entity cell has Open button with `?from=audit` to Summary.
- vNext now: V/components/activity/activity-center.tsx:169-176: only `/activity/{id}` details link, no workspace destination.
- Fix: Add contextual `Open workspace` deep link if subject identifies a project UUID.

## G2-7-002-004  [P2] MISSING  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:479-485: page-head buttons Refresh and View activity log -> `/college-admin/audit`.
- vNext now: V/components/projects/project-admin-audit-page.tsx:316-320: Refresh below stat strip and activity-log link hidden for college.
- Fix: Restore college activity log link and move refresh/head actions to header.

## G2-7-002-005  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:457-467: missing scope shows page-specific warning.
- vNext now: V/app/(authenticated)/college/projects/audit/page.tsx:17: generic ProjectAdminMissingCollege.
- Fix: Show audit-specific no-college message.

## G2-7-002-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:470-505: title/subtitle, header actions, failure alert, range buttons/tag.
- vNext now: V/components/projects/project-admin-audit-page.tsx:189-204: back link/head, invalid filter warning, time Tabs.
- Fix: Match page-head action placement, range chip hierarchy, and error precedence.

## G2-7-002-007  [P2] GAP  facet F02  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:505-540: three independent small Statistic cards.
- vNext now: V/components/projects/project-admin-audit-page.tsx:303-315: three cells of a bordered strip.
- Fix: Restore card spacing/borders and warning prefix styling.

## G2-7-002-008  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:542-585: Card `Change log` includes action select and export button.
- vNext now: V/components/projects/project-admin-audit-page.tsx:205-301,316-328: filter details and export separate; no Change log card.
- Fix: Recreate Change log grouping and toolbar order.

## G2-7-002-011  [P2] MISSING  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:497-501: active entity filter is closable `Filtered to: {entityId}` Tag.
- vNext now: V/components/projects/project-admin-audit-page.tsx:262-264,287-300: Entity ID field, Reset clears all; no active filtered-to tag.
- Fix: Render dismissible entity filter tag clearing only selected subject ID.

## G2-7-002-012  [P2] MISSING  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:323-329: Destructive row shows red warning icon and tooltip text `Irreversible or access-changing action`.
- vNext now: V/components/activity/activity-center.tsx:126-145,169-170: importance/module badges, no destructive warning icon.
- Fix: Classify legacy destructive keys, show warning icon and tooltip per event.

## G2-7-002-013  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:550-553: Select allowClear and exact placeholder `Filter by action`.
- vNext now: V/components/projects/project-admin-audit-page.tsx:213-224: labelled Action select with option `All actions`, no clear affordance.
- Fix: Restore filter placeholder and clear control.

## G2-7-002-015  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:313-332; components/admin/projects/adminProjectUtils.js:414-429: Action field humanizes uppercase PROJECT_* to Workspace/Task labels, destructive red tooltip.
- vNext now: V/components/activity/activity-center.tsx:40-43,169-170: lowercase dot-separated verb humanization and importance tone.
- Fix: Map event taxonomy to humanized legacy action labels and destructive visual tone.

## G2-7-002-016  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:334-393: Entity shows entity type as Workspace/Task/Template, entityName else slug ID; PROJECT_TASK_SYNC as `Project {slug}`.
- vNext now: V/components/activity/activity-center.tsx:181-184: displays raw `subjectType: subjectId` in disclosure, label in summary sentence.
- Fix: Show entity type and display label in dedicated column; adapt task-sync to workspace entity.

## G2-7-002-017  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:398-407: Actor displays resolved name or `User #id`, plus actor type label Staff/Student/Admin/Super admin.
- vNext now: V/components/activity/activity-center.tsx:49-55,149-152: name/email/System within sentence; no actor role.
- Fix: Add dedicated Actor column with role label and fallback.

## G2-7-002-018  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:412-417; components/admin/projects/adminProjectUtils.js:37-62: date from Jackson LocalDateTime array/ISO formatted via browser locale.
- vNext now: V/components/activity/activity-center.tsx:62-68,153-157: IST dateStyle=medium/timeStyle=short.
- Fix: Decide/align timezone and exact date formatting across log, export, day grouping.

## G2-7-002-024  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:287-303: non-Today days separated with `dddd, DD MMM YYYY`; no dividers for Today.
- vNext now: V/components/activity/activity-center.tsx:116-123: day headings for all ranges, including Today; uses day/month long format.
- Fix: Suppress day headings in Today mode and match divider text for others.

## G2-7-002-027  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:491-496: four small buttons Today,7 days,30 days,All time; active button primary teal.
- vNext now: V/components/projects/project-admin-audit-page.tsx:167-204: links as underline tabs.
- Fix: Use legacy small toggle-chip buttons and selected color.

## G2-7-002-029  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:157-206: range/action/entity/page states hydrate from URL; action changes immediately fetch.
- vNext now: V/components/projects/project-admin-audit-page.tsx:205-301: advanced GET Apply form; action change alone doesn't fetch.
- Fix: Make single Action filter immediate; preserve URL state.

## G2-7-002-036  [P2] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:433-455: Ant table expand control reveals recursive Descriptions of payloadJson.
- vNext now: V/components/activity/activity-center.tsx:180-190: Disclosure details shows activity metadata in two-column definition rows.
- Fix: Support nested JSON/array and legacy payload keys with structured recursive display.

## G2-7-002-037  [P2] GAP  facet F09  effort M
- Legacy: LFE/components/admin/projects/renderStructuredValue.jsx:16-75: caps recursive details at depth12 and renders arrays as Tag pills.
- vNext now: V/components/activity/activity-center.tsx:186-188: nonstrings rendered JSON.stringify without depth cap.
- Fix: Use max-depth recursive renderer, arrays as tags and graceful malformed payload handling.

## G2-7-002-041  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:237-272: GET refresh uses refreshTick and client requestId race guard.
- vNext now: V/components/projects/project-admin-audit-page.tsx:316-320: refresh is link to same page with preserved query excluding cursor.
- Fix: Refresh should bypass cache and visibly re-fetch; verify Next cache/revalidation.

## G2-7-002-045  [P2] GAP  facet F11  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:457-467: exact warning `Select a college to continue` and `Choose a college in the header above to see its project audit.`
- vNext now: V/components/projects/project-admin-missing-college.tsx:7-10: generic project workspaces message.
- Fix: Use audit-specific warning and selected-college guidance.

## G2-7-002-048  [P2] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:20-77: college menu excludes 9 global-template lifecycle events as unqueryable.
- vNext now: V/components/projects/project-admin-audit-page.tsx:219-224: all projects.* events offered regardless of college scope.
- Fix: Filter action options by capability/available producer for college.

## G2-7-002-051  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:586-611: empty Ant Table automatically renders empty table data state.
- vNext now: V/components/activity/activity-center.tsx:105-110: `No meaningful activity matches these filters. Technical request noise is intentionally excluded...`.
- Fix: Restore correct empty-copy semantics for raw project admin log versus intentional noise filtering.

## G2-7-002-052  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:488: errors appear as alert while card/table still rendered under skeleton.
- vNext now: V/components/projects/project-admin-audit-page.tsx:82-90: dedicated full-page error state with Retry.
- Fix: Determine intended handling; do not show misleading table after failed load.

## G2-7-002-058  [P2] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:505-540: summary cards xs24/sm8 => one column phone, three >=tablet.
- vNext now: V/components/projects/project-admin-audit-page.tsx:303-315: grid 1, md 2, >=992 3.
- Fix: Match sm breakpoints and one-by-three summary layout.

## G2-7-002-059  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:587-593: four-column log table horizontal `scroll x=max-content` on mobile.
- vNext now: V/components/activity/activity-center.tsx:123-125: vertically stacked responsive articles.
- Fix: Restore scrollable table with accessible horizontal navigation.

## G2-7-002-061  [P2] MISSING  facet F17  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:361-377: entity label is role=button, tabIndex0, Enter/Space callback, ARIA `Filter audit log to ...`.
- vNext now: V/components/activity/activity-center.tsx:181-185: Entity is plain text in a disclosure.
- Fix: Add labelled keyboard-interactive entity filter button.

## G2-7-002-065  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:542-553: `Change log`, `Filter by action`.
- vNext now: V/components/projects/project-admin-audit-page.tsx:204-225,328: `Filters`, `Action`, no named Change log section.
- Fix: Restore title and filter placeholder.

## G2-7-002-066  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:481-484: `Refresh`, `View activity log`, in header.
- vNext now: V/components/projects/project-admin-audit-page.tsx:316-320: `Refresh` link, View activity log conditional Super Admin only.
- Fix: Restore button pair in heading for College Admin.

## G2-7-002-070  [P2] GAP  facet F19  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:283-285,606-609: cap warning when 200 fetched with additional records.
- vNext now: V/components/activity/activity-center.tsx:197-204: Load more({nextRemaining}), no 200-cap text.
- Fix: Provide explicit truncation/summary scope warning when more events exist.

## G2-7-002-072  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:214-222: page reset on range/action/entity or college change, skips hydration reset for deep links.
- vNext now: V/components/projects/project-admin-audit-page.tsx:128-163: cursors reset on filter URL builds but old page alias ignored.
- Fix: Migrate bookmarked page URLs and preserve legitimate back/forward filters.

## G2-7-002-010  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:479-480: Refresh button includes ReloadOutlined and spinner when loading.
- vNext now: V/components/projects/project-admin-audit-page.tsx:316-319: plain refresh Link, no icon/loading.
- Fix: Use Reload icon and loading/disabled feedback.

## G2-7-002-014  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:554-581: small `Export CSV` button DownloadOutlined.
- vNext now: V/components/projects/project-audit-page-export.tsx:18-22: `Export shown audit groups · CSV`, no download icon.
- Fix: Use legacy action label, tooltip scope and icon.

## G2-7-002-060  [P3] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:490-503: range options wrapped in Space and buttons, active filter tag wraps.
- vNext now: V/components/projects/project-admin-audit-page.tsx:204-205: tab strip and native details filter.
- Fix: Ensure legacy chip-wrap behavior at 375/768/1280 widths.

## G2-7-002-062  [P3] GAP  facet F17  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:324-329: warning icon tooltip and action type tooltip.
- vNext now: V/components/activity/activity-center.tsx:126-170: badge and event text; no tooltip.
- Fix: Expose irreversible/access-changing legend and raw action label on hover/focus.

## G2-7-002-067  [P3] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:581: `Export CSV`.
- vNext now: V/components/projects/project-audit-page-export.tsx:20: `Export shown audit groups · CSV`.
- Fix: Restore button text and scope note separately.

## G2-7-002-073  [P3] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:420-431: invalid JSON payload string displayed as text.
- vNext now: V/components/activity/activity-center.tsx:186-188: metadata renders strings as text, others JSON.stringify.
- Fix: Preserve safe malformed payload handling and recursion cap.
