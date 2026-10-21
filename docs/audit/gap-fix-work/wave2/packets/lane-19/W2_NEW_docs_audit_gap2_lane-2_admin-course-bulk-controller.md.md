# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-course-bulk-controller.md

16 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-bulk-controller.md

## G2-2-014-002  [P2] GAP  facet F01  effort S
- Legacy: LF:595-603 bulk action toolbar above existing courses table
- vNext now: NP:46-75 separate bulk visibility section with full checkbox list
- Fix: Restore action toolbar positioned directly above selected table rows.

## G2-2-014-003  [P2] GAP  facet F02  effort S
- Legacy: LF:595-621 toolbar selected across pages then DataTable with selection column
- vNext now: NP:46-75 separate scrollable checkbox list (max-h-48) and action buttons
- Fix: Preserve selection in catalogue table and selected-count/action grouping.

## G2-2-014-004  [P2] MISSING  facet F03  effort S
- Legacy: LF:601-603 Show/Hide to students and Clear selection
- vNext now: NP:67-75 Show/Hide buttons; no Clear selection button
- Fix: Add Clear selection with disabled/pending guard.

## G2-2-014-005  [P2] GAP  facet F03  effort S
- Legacy: LF:456-465 AntD Modal.confirm with preview selected rows and danger variant
- vNext now: NP:27-28 window.confirm text only
- Fix: Use ConfirmDialog and list target courses/danger styling.

## G2-2-014-010  [P2] GAP  facet F05  effort S
- Legacy: LC:73-76 per-install getBulkStatusMax default100
- vNext now: NS:13 max100 hardcoded
- Fix: Respect tenant/platform configurable bulk cap.

## G2-2-014-013  [P2] GAP  facet F06  effort S
- Legacy: LC:95-98 allowedForDisplay only0/1 numeric
- vNext now: NS:14 boolean visibleToStudents, no numeric flag
- Fix: Map numeric flag to display status when supporting legacy clients.

## G2-2-014-022  [P2] GAP  facet F09  effort S
- Legacy: LF:456-465 rich selected-course Modal.confirm, danger hide
- vNext now: NP:27-28 browser window.confirm
- Fix: Restore styled confirmation modal with Escape/cancel/focus.

## G2-2-014-027  [P2] GAP  facet F11  effort S
- Legacy: LC:113 reauthorizes each course ID requireAccessCourse
- vNext now: NS:23-28 selected acting college and active course join, throws for missing
- Fix: Keep per-course authorization and skip unauthorized entries without leakage.

## G2-2-014-031  [P2] GAP  facet F12  effort S
- Legacy: LC:126 allowedForDisplay updates optional integer0/1
- vNext now: NS:12-16 no equivalent field
- Fix: Define mapping for archived/unpublished course visibility and allow-display flag.

## G2-2-014-033  [P2] GAP  facet F13  effort S
- Legacy: LF:576-591 partial failure banner with retry failed only
- vNext now: NP:77-84 retry failed courses but no detailed reasons
- Fix: Surface reasons and preserve error state during retry.

## G2-2-014-034  [P2] GAP  facet F13  effort S
- Legacy: LF:608-612 stale loaded rows warning, LF:595 selection retained
- vNext now: NP:21-25 silently drops selected IDs not on current page
- Fix: Explain dropped selection on scope change and preserve within-scope cross-page.

## G2-2-014-037  [P2] GAP  facet F16  effort S
- Legacy: LF:595-603 compact toolbar responsive Table
- vNext now: NP:46-75 checkbox list and inline buttons; md:9 control heights
- Fix: Restore legacy toolbar compactness; test mobile selection overflow.

## G2-2-014-038  [P2] GAP  facet F17  effort S
- Legacy: LF:456-465 AntD confirm modal with focus/Cancel
- vNext now: NP:27-28 window.confirm, no preview list
- Fix: Use shared accessible AlertDialog.

## G2-2-014-045  [P2] GAP  facet F20  effort S
- Legacy: LF:414-445 bulkRef prevents double click and retries, selection list stable
- vNext now: NP:18-44 pending guard but page-scoped IDs
- Fix: Maintain pending guard and cross-page selection scope.

## G2-2-014-040  [P3] GAP  facet F18  effort S
- Legacy: LF:599 'selected across current college and loaded pages'
- vNext now: NP:53 'Select all courses on this page'
- Fix: Match selection scope copy and behavior.

## G2-2-014-041  [P3] GAP  facet F18  effort S
- Legacy: LC:151 exact 'Updated N of M course(s)'
- vNext now: NP:78 update/unchanged/failures text
- Fix: Include exact original summary.
