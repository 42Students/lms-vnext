# U014 — AdminCourseBulkController gap audit v2

## Source map / full closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseBulkController.java`
- `LF` = `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js`
- `LA` = `docs/legacy-source/frontend/src/api/Services/AdminService.js`
- `NR` = `src/app/api/admin/courses/bulk-status/route.ts`
- `NS` = `src/modules/courses/super-admin-course-bulk-visibility.ts`
- `NU` = `src/modules/courses/super-admin-lesson-bulk-visibility.ts`
- `NP` = `src/components/courses/super-admin-course-bulk-visibility.tsx`
- `NC` = `src/components/courses/admin-course-overview.tsx`

Legacy AdminCourseBulkController+CourseService update semantics and old superadmin courses selectable table/actions; vNext similarly named route+service+checkbox section, nested lesson bulk service and admin course overview. **Fundamental naming collision:** legacy updates COURSE active/enabled/allowedForDisplay, new updates LESSON CONTENT `visibleToStudents` leaving course flags unchanged. Do not equate these. Citations aliases `LC:108-137` resolve file above with 1-based lines.

## 23 facets
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-014-001 | F01 | LC:39-44 POST /api/v1/admin/courses/bulk-status | NR:7-13 POST /api/admin/courses/bulk-status | MATCH | P3 | Same operation class; migrate route and body schema. | S |
| G2-2-014-002 | F01 | LF:595-603 bulk action toolbar above existing courses table | NP:46-75 separate bulk visibility section with full checkbox list | GAP | P2 | Restore action toolbar positioned directly above selected table rows. | S |
| G2-2-014-003 | F02 | LF:595-621 toolbar selected across pages then DataTable with selection column | NP:46-75 separate scrollable checkbox list (max-h-48) and action buttons | GAP | P2 | Preserve selection in catalogue table and selected-count/action grouping. | S |
| G2-2-014-004 | F03 | LF:601-603 Show/Hide to students and Clear selection | NP:67-75 Show/Hide buttons; no Clear selection button | MISSING | P2 | Add Clear selection with disabled/pending guard. | S |
| G2-2-014-005 | F03 | LF:456-465 AntD Modal.confirm with preview selected rows and danger variant | NP:27-28 window.confirm text only | GAP | P2 | Use ConfirmDialog and list target courses/danger styling. | S |
| G2-2-014-006 | F03 | LF:616-621 rowSelection across paginated courses | NP:49-64 Select all courses ON THIS PAGE; hidden rows discarded | GAP | P1 | Preserve cross-page selected IDs scoped to current college. | S |
| G2-2-014-007 | F04 | LC:146-151 requested,updatedCount,failed[{courseId,reason}] | NS:69-71 selectedCourses,matchedLessons,matchedContents,changed,unchanged,failures per lesson,failedCourseIds | GAP | P1 | Report per COURSE updated/failed and reasons, not only content-level changes. | S |
| G2-2-014-008 | F04 | LF:484-485 Students see it visible when active && enabled | NC:127-137 status depends on course.status ACTIVE | GAP | P1 | Make visible chip reflect course learner visibility, not lesson content count alone. | S |
| G2-2-014-009 | F04 | LC:63-70 active,enabled,allowedForDisplay independent nullable fields | NS:12-16 only visibleToStudents and confirmed | MISSING | P1 | Implement status/visibility bulk flags or document intentionally different feature. | S |
| G2-2-014-010 | F05 | LC:73-76 per-install getBulkStatusMax default100 | NS:13 max100 hardcoded | GAP | P2 | Respect tenant/platform configurable bulk cap. | S |
| G2-2-014-011 | F05 | LF:616-620 selection persists after pagination/filtering | NP:21-25 filters selected IDs to visible current page | GAP | P1 | Retain selected IDs across filter/page within same scope, clear on acting-college change. | S |
| G2-2-014-012 | F06 | LC:86-97 allows any combination active, enabled, allowedForDisplay, at least one required | NS:14 requires single visibleToStudents boolean | GAP | P1 | Provide three independent nullable status controls and combination validation. | S |
| G2-2-014-013 | F06 | LC:95-98 allowedForDisplay only0/1 numeric | NS:14 boolean visibleToStudents, no numeric flag | GAP | P2 | Map numeric flag to display status when supporting legacy clients. | S |
| G2-2-014-014 | F06 | LC:65 courseIds list can include repeats (counts each independently) | NS:13 rejects duplicate UUIDs | EXTRA | P3 | Keep duplicate protection; document deliberate hardening. | S |
| G2-2-014-015 | F07 | LC:86-87 'courseIds is required and must not be empty' | NS:13 Zod array min1, NR:13 generic apiErrorResponse | GAP | P3 | Surface exact empty selection message. | S |
| G2-2-014-016 | F07 | LC:89-90 'Maximum N courses per bulk update' | NS:13 max100 Zod error | GAP | P2 | Use configured N in both validation and message. | S |
| G2-2-014-017 | F07 | LC:92-93 'Set at least one of active, enabled or allowedForDisplay' | NS:14 requires only visibleToStudents | GAP | P2 | Validate partial flag updates; retain legacy error. | S |
| G2-2-014-018 | F07 | LC:95-97 'allowedForDisplay must be 0 or 1' | NS:14 typed boolean prevents old body format | GAP | P2 | Support safe versioned legacy body mapping. | S |
| G2-2-014-019 | F07 | LC:110-117 failures 'Invalid course id'/'Course not found' per course | NS:28 throws COURSE_NOT_FOUND for ENTIRE group when one invalid/out-of-scope | GAP | P1 | Continue to process authorized selected courses and return per-item failure instead of aborting whole batch. | S |
| G2-2-014-020 | F08 | LC:150-151 'Updated X of Y course(s)' | NP:77-79 'X updated · Y unchanged · Z failed' content-level counts | GAP | P2 | Include per-course requested/updated counts in summary. | S |
| G2-2-014-021 | F08 | LF:576-590 partly completed banner with up to 5 per-course failed reasons | NP:77-84 generic lesson failures count, retry only | GAP | P2 | Show sanitized per-course failure details and partial-success warning. | S |
| G2-2-014-022 | F09 | LF:456-465 rich selected-course Modal.confirm, danger hide | NP:27-28 browser window.confirm | GAP | P2 | Restore styled confirmation modal with Escape/cancel/focus. | S |
| G2-2-014-023 | F10 | LC:108-137 each courseService.updateCourse independently, partial failures | NS:21-71 fans out lessons content visibility, never mutates courses | GAP | P1 | Implement actual course status updates atomically per course; not a lesson visibility substitute. | S |
| G2-2-014-024 | F10 | LC:118-128 null flags preserve untouched fields, metadata safe | NS:21-71 no course mutation at all | MISSING | P1 | Restore partial per-course active/enabled/allow-display update semantics. | S |
| G2-2-014-025 | F10 | LC:130-135 catches each course failure and continues | NS:28 throws for any bad/out-of-scope course BEFORE processing any | GAP | P1 | Isolate unauthorized/invalid course and process remaining permitted IDs. | S |
| G2-2-014-026 | F10 | LC:139-144 audit once COURSE_BULK_STATUS_UPDATE if updated>0 | NS:47-67 calls lesson bulk service audit per content and no batch course audit | GAP | P1 | Add summary COURSE_BULK_STATUS_UPDATE event with original requested/updated/failed counts. | S |
| G2-2-014-027 | F11 | LC:113 reauthorizes each course ID requireAccessCourse | NS:23-28 selected acting college and active course join, throws for missing | GAP | P2 | Keep per-course authorization and skip unauthorized entries without leakage. | S |
| G2-2-014-028 | F11 | LC:100-104 auth principal required; admins can update owned college courses | NS:23 resolveActingCollege(... courses.manage) for SuperAdmin UI only | GAP | P1 | Provide college-admin bulk status functionality with central course permission. | S |
| G2-2-014-029 | F11 | LC:43 allows credentialed cross-origin domains | NR:8 same-origin guard | EXTRA | P3 | Keep same-origin mutation guard. | S |
| G2-2-014-030 | F12 | LC:123-128 sets active/enabled, controlling learner visibility | NS:18-20 explicitly avoids archiving courses; toggles only published lesson visibility | GAP | P1 | Do not treat lesson-content hide as course hide; preserve course-level visibility and learner queries. | S |
| G2-2-014-031 | F12 | LC:126 allowedForDisplay updates optional integer0/1 | NS:12-16 no equivalent field | GAP | P2 | Define mapping for archived/unpublished course visibility and allow-display flag. | S |
| G2-2-014-032 | F12 | LC:30-33 each course independent; no group-wide tx | NS:47-67 batches 25 lessons; independent group errors but parent invalid blocks all | GAP | P1 | Preserve per-course partial completion semantics and response classification. | S |
| G2-2-014-033 | F13 | LF:576-591 partial failure banner with retry failed only | NP:77-84 retry failed courses but no detailed reasons | GAP | P2 | Surface reasons and preserve error state during retry. | S |
| G2-2-014-034 | F13 | LF:608-612 stale loaded rows warning, LF:595 selection retained | NP:21-25 silently drops selected IDs not on current page | GAP | P2 | Explain dropped selection on scope change and preserve within-scope cross-page. | S |
| G2-2-014-035 | F14 | LC:78-157 no CSV upload/export | NS:21-71 no CSV | MATCH | P3 | N/A. | S |
| G2-2-014-036 | F15 | LC:139-143 only AdminAuditLogService event, no notifications | NS:47-67 per-content activity notifications possible via lesson service; no direct email | UNKNOWN | P2 | Inspect downstream lesson bulk side effects; avoid inventing learner notifications. | S |
| G2-2-014-037 | F16 | LF:595-603 compact toolbar responsive Table | NP:46-75 checkbox list and inline buttons; md:9 control heights | GAP | P2 | Restore legacy toolbar compactness; test mobile selection overflow. | S |
| G2-2-014-038 | F17 | LF:456-465 AntD confirm modal with focus/Cancel | NP:27-28 window.confirm, no preview list | GAP | P2 | Use shared accessible AlertDialog. | S |
| G2-2-014-039 | F17 | LF:616-620 rowSelection keyboard handling | NP:49-63 explicit checkbox label | EXTRA | P3 | Keep accessible checkbox labels and selected count. | S |
| G2-2-014-040 | F18 | LF:599 'selected across current college and loaded pages' | NP:53 'Select all courses on this page' | GAP | P3 | Match selection scope copy and behavior. | S |
| G2-2-014-041 | F18 | LC:151 exact 'Updated N of M course(s)' | NP:78 update/unchanged/failures text | GAP | P3 | Include exact original summary. | S |
| G2-2-014-042 | F19 | LC:46-76 100 configurable cap and per-course bounded updates | NS:13 max100 and lessons limit500; 25-item batches | EXTRA | P3 | Keep a separate cap for nested content updates; don't replace course cap. | S |
| G2-2-014-043 | F19 | LC:108-137 independent updates, bounded100 | NS:29-41 fetch up to501 lessons; can reject valid100 courses with many lessons | GAP | P1 | Do not apply 500-lesson content cap to course-status operation. | S |
| G2-2-014-044 | F20 | LC:108-137 no optimistic version, partial DTO avoids metadata overwrite | NS:47-67 CAS content service but no parent course field update | GAP | P1 | Implement true flag CAS/integer version for courses while preserving unrelated fields. | S |
| G2-2-014-045 | F20 | LF:414-445 bulkRef prevents double click and retries, selection list stable | NP:18-44 pending guard but page-scoped IDs | GAP | P2 | Maintain pending guard and cross-page selection scope. | S |
| G2-2-014-046 | F21 | LC:49 CourseService updateCourse path | NS:8-9 bulk lesson visibility service and safe error model | GAP | P1 | Wire proper course write service with per-item scope and audit. | S |
| G2-2-014-047 | F22 | LC:63-71 CourseDTO active,enabled,allowedForDisplay columns | NS:12-16 only lessonContents visibleToStudents changes, courses status unchanged | GAP | P1 | Persist actual course status and mapping, not merely lesson content flags. | S |
| G2-2-014-048 | F22 | LC:118-128 only requested fields modify, other course metadata untouched | NS:47-67 no course flags updates | MISSING | P1 | Use partial update query, preserve metadata and optimistic version. | S |
| G2-2-014-049 | F23 | LC:25-37 audit explicitly targets course bulk status independent per course | NS:18-20 explicitly says never archive courses; only lesson student visibility | GAP | P1 | High-priority functional non-equivalence: name/API suggests course status but operation differs. | S |
| G2-2-014-050 | F23 | LF:595-620 cross-page selection | NP:21-25 page-only selection | GAP | P1 | Restore selection across paginated catalog while isolating acting-college scopes. | S |

## Summary
- 50 rows; verdicts MATCH 2; GAP 39; MISSING 4; EXTRA 4; UNKNOWN 1, severity P3 9; P2 20; P1 21.
- **P1-A:** Current Super Admin `/api/admin/courses/bulk-status` does NOT update any course status field. It changes nested published lesson content visibility, silently leaving active/enabled/allow-display unchanged. Restore true course status bulk functionality (F04/F06/F10/F12/F22/F23).
- **P1-B:** One missing/inaccessible course throws for the whole batch before processing, whereas legacy handles per-course errors and creates audit summary with exact requested/updated/failed counts (F07/F10/F11).
- **P1-C:** Legacy selection spans loaded pages in the same college, new component drops non-current-page selections. Legacy configurable max100 courses, new 500-lesson cap can reject valid course batches (F03/F05/F19).

### UNKNOWN/live checks
- Check CourseServiceImpl `updateCourse` and learner visibility effective active+enabled and allowedForDisplay before implementing field mapping. Verify nested lesson visibility notifications, no email assumptions.
- Compare styled AntD bulk modal vs native confirm and checkbox list at 375/768/1280.
