# U011 — AdminClassScheduleController recurring series gap audit v2

## Code closure and file aliases
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminClassScheduleController.java`
- `LF` = `docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js`
- `NV` = `src/modules/academics/college-recurring-preview-model.ts`
- `NE` = `src/modules/academics/college-recurring-execute-model.ts`
- `NS` = `src/modules/academics/college-recurring-execute-service.ts`
- `NP` = `src/modules/academics/college-recurring-preview-service.ts`
- `NC` = `src/components/academics/college-recurring-preview.tsx`

Legacy AdminClassScheduleController + legacy Classes recurring modal, vNext CollegeRecurringPreview UI/preview model+service/execute model+service and scoped joins. Alias `LC:92-120` = full mapped path:1-based lines. Note that source-level differences do not prove live UX, list separately. No code changed.

## 23 facet rows
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-011-001 | F01 | LC:47-52 POST /api/v1/admin/class-schedule/recurring | NC:77-87 preview and NC:115-124 execute via two POST routes | GAP | P2 | Map legacy one-shot endpoint to two-step preview/commit contract. | S |
| G2-2-011-002 | F01 | LF:413 Schedule action per class row, LF:339-375 opens recurring modal | NC:30-33 standalone CollegeRecurringPreview reached by /college/classes/recurring-preview | GAP | P2 | Preserve per-class modal from class table with preselected class. | S |
| G2-2-011-003 | F02 | LF:339-375 one modal saves range and shows result in same UI | NC:134-263 standalone preview form then result list/ConfirmDialog | GAP | P2 | Clone modal layout or approve preview redesign without changing class-row entry. | S |
| G2-2-011-004 | F03 | LF:339-351 Create recurring, day selector, class summary controls | NC:144-218 full form + Preview sessions button, then execute confirmation | GAP | P2 | Preserve legacy CTA and field groups, add optional preview without displacing them. | S |
| G2-2-011-005 | F03 | LF:371-375 unsaved changes Modal.confirm on close | NC:30-133 controls state locally; on navigation no dirty-discard guard in component | MISSING | P2 | Add unsaved recurring-draft navigation/discard confirmation. | S |
| G2-2-011-006 | F03 | LC:196-203 created/failed summary | NC:222-226 Created N scheduled sessions, skipped date list | GAP | P2 | Show requested/created/failed counts and reasons in legacy terminology. | S |
| G2-2-011-007 | F04 | LC:196-200 result requested,createdCount,created[{date,classScheduleId}],failed[{date,reason}] | NS:90-117 result `{created,requested,failed,skipped[{localDate,reasons}],sessionIds}` | GAP | P2 | Preserve per-date created ID/date mapping and failure diagnostics. | S |
| G2-2-011-008 | F04 | LC:175-183 created classScheduleId per-date, failed reason exception message | NS:90-117 creates IDs without date mapping, conflict enum reasons | GAP | P2 | Return date+sessionID pairs and display detailed human-readable conflict reasons. | S |
| G2-2-011-009 | F05 | LC:148-156 generates inclusive matching date range, capped 200 occurrences | NV:21-26 max93-day span and weekdays 1..7 | GAP | P1 | Align recurrence cap semantics; 93 calendar-day max can reject valid ≤200-occurrence semester series. | S |
| G2-2-011-010 | F05 | LC:135-145 empty weekdays means EVERY day in range | NV:13 min1 and NC:216 disables zero chosen days | GAP | P2 | Support explicit Every day option and preserve empty-weekdays API meaning or document change. | S |
| G2-2-011-011 | F05 | LC:88-89 MONDAY..SUNDAY case-insensitive string values | NV:13 weekdays numeric 0..6 (Sunday0) | GAP | P2 | Document weekday mapping and normalize legacy names. | S |
| G2-2-011-012 | F06 | LC:74-90 optional courseId, facultyId, lectureHallId, title; required classId, date/times | NV:9-19 required section/from/to/weekdays/times; NE:5 title min1 max160 | GAP | P2 | Make title optional if required by old clients or document required-title tightening. | S |
| G2-2-011-013 | F06 | LC:86-87 HH:mm 24-hour (normalizes seconds), no timezone in DTO | NV:8 HH:mm exact, NC:176-182 IST user copy | GAP | P2 | Support accepted HH:mm:ss input (or provide validation mapping), preserve IST wall-clock. | S |
| G2-2-011-014 | F06 | LC:107-109 requires date/times but course/faculty/hall optional | NC:156-214 optional selectors, same intent | MATCH | P3 | Retain optional staff/hall/course. | S |
| G2-2-011-015 | F06 | LC:148-154 cap200 OCCURRENCES, not overall day span | NV:21-23 at most93 inclusive days | GAP | P1 | Enforce 200 occurrences and academic term instead of arbitrary 93 days if owner demands legacy parity. | S |
| G2-2-011-016 | F07 | LC:101-110 exact messages collegeId must be positive, classId is required, dates/times all required | NV:9-27 generic Zod issues and NC:69-91 generic preview error | GAP | P3 | Map field-specific legacy errors into inline helper copy. | S |
| G2-2-011-017 | F07 | LC:129 'startDate and endDate must be yyyy-MM-dd' | NV:3-7 'Date must be an existing YYYY-MM-DD date' | GAP | P3 | Restore exact date format help/error. | S |
| G2-2-011-018 | F07 | LC:132 'endDate must be on or after startDate' | NV:20 'End date precedes start', NC:215 'To date cannot be earlier than From date.' | GAP | P3 | Use one exact legacy message across UI and API. | S |
| G2-2-011-019 | F07 | LC:142 'Unrecognised day of week: [value]' | NV:13 numeric type issue, NC:187-196 weekday checkboxes | GAP | P3 | Normalize legacy string weekdays and provide specific invalid day error. | S |
| G2-2-011-020 | F07 | LC:153-154 'That range would create more than 200 sessions. Narrow...' | NV:23 max93 days | GAP | P2 | Match occurrence-cap error and count actual matching days. | S |
| G2-2-011-021 | F07 | LC:157-158 'No dates in that range match selected weekdays' | NP:81-82 returns notice No matching weekdays ...; NS:24-25 conflicts error | GAP | P2 | Surface exact no-match error before preview/commit. | S |
| G2-2-011-022 | F08 | LC:201-202 'Created N of M session(s)' | NC:222-223 'Created N scheduled sessions.' | GAP | P3 | Display both requested and created counts. | S |
| G2-2-011-023 | F08 | LC:179-185 each failure date/reason | NC:224-226 skipped dates and enum reasons; no legacy error message | GAP | P3 | Use human-readable per-date conflict reasons and separate unexpected failures. | S |
| G2-2-011-024 | F09 | LF:339-375 AntD Modal recurrence with dirty-discard prompt | NC:99-133 ConfirmDialog for saving, independent page with no close-modal state | GAP | P2 | Restore modal + discard guard, preserve confirm optional. | S |
| G2-2-011-025 | F09 | LF:365-375 Cancel cancels draft after Modal.confirm | NC:134-263 no standalone cancel action in component | MISSING | P2 | Provide Cancel/back with dirty-state confirmation. | S |
| G2-2-011-026 | F10 | LC:163-185 each occurrence calls classScheduleService.create independently | NS:26-119 one SQL transaction inserts all conflict-free occurrences | GAP | P1 | Make per-date creation independently resilient to DB constraint failure; one failed row must not roll back successful dates. | S |
| G2-2-011-027 | F10 | LC:41-45 inherits ClassScheduleService full conflicts/max-duration validation | NS:74-93 checks section/faculty/hall overlaps, NV:24 endTime>start | GAP | P1 | Audit equivalent max-duration and multi-course schedule clash rules beyond simple overlap. | S |
| G2-2-011-028 | F10 | LC:188-194 optional single CLASS_SCHEDULE_RECURRING_CREATE audit event | NS:110-116 required ACADEMICS_CLASS_UPDATED summary event | GAP | P2 | Preserve event taxonomy or map to exact old named event for activity feed. | S |
| G2-2-011-029 | F10 | LC:196-200 per-date failed return does not abort other dates | NS:90-117 skips predictable conflicts; unexpected insert error aborts transaction | GAP | P1 | Use savepoints or chunked per-occurrence transaction to retain partial success. | S |
| G2-2-011-030 | F11 | LC:112-120 College Admin + class belongs to chosen college; super-admin permitted with correct scope | NS:19-23 requires membership role COLLEGE_ADMIN; no Super Admin actor path | GAP | P1 | Support selected-college Super Admin route under central requirePermission for recurring create. | S |
| G2-2-011-031 | F11 | LC:118-120 cross-college class returns exact error | NS:28-47 class scope joins college and returns NOT_FOUND | GAP | P2 | Map denial to no-leak user error or approve changed copy. | S |
| G2-2-011-032 | F11 | LC:51 CrossOrigin 42lms domains | NS:17-23 server context + route origin guard | EXTRA | P3 | Keep stricter same-origin mutation. | S |
| G2-2-011-033 | F12 | LC:147-160 every day if no weekdays, inclusive endpoints | NV:40-57 selected named weekdays and date-inclusive loop | GAP | P2 | Preserve legacy empty-days policy if maintaining API compatibility. | S |
| G2-2-011-034 | F12 | LC:173-183 underlying service detects hall/faculty/class conflicts and reports per-date | NS:75-93 skip conflicting dates; transaction lock protects section | MATCH | P3 | Keep scoped conflict checks and summaries. | S |
| G2-2-011-035 | F12 | LC:163-186 one failed occurrence does not roll back any success | NS:26-119 single transaction rolls back on unexpected failure | GAP | P1 | Guarantee per-date independent persistence or document stronger all-or-none behavior. | S |
| G2-2-011-036 | F13 | LF:309-336 independently loads faculty/course/hall dropdown options and warnings | NP:116-166 SSR grouped options, NC:137-140 no classes message | GAP | P2 | Show per-dropdown unavailable vs empty and reload states. | S |
| G2-2-011-037 | F13 | LF:359-360 Failed to create recurring sessions on exception | NC:129-130 'Scheduling failed' generic | GAP | P3 | Restore exact exception copy plus per-date troubleshooting. | S |
| G2-2-011-038 | F14 | LC:92-203 no file upload/export/import, LF:339-375 no file action | NC:134-263 no upload/export; only preview/commit | MATCH | P3 | N/A. | S |
| G2-2-011-039 | F15 | LC:188-194 audit log only, no notification, email or SMS | NS:110-116 one activity event, no outbound email | MATCH | P3 | No email side effect. | S |
| G2-2-011-040 | F16 | LF:339-375 modal adaptive AntD fields | NC:143-214 2-col form and 4-col dates on desktop, 1-col mobile | GAP | P2 | Compare modal/form density at phone/tablet/desktop. | S |
| G2-2-011-041 | F17 | LF:371-375 accessible Modal.confirm for discard | NC:99-133 ConfirmDialog on save, no discard | GAP | P2 | Add Escape/dismiss dirty guard, ensure keyboard focus return. | S |
| G2-2-011-042 | F18 | LC:201 'Created X of Y session(s)' and LF:373 'Discard this recurring schedule?' | NC:222-223 new success, no corresponding discard copy | GAP | P3 | Restore exact messages. | S |
| G2-2-011-043 | F18 | LF:339-360 legacy 'Schedule' and form fields | NC:216 'Preview sessions', NC:144 'Session title', NC:185 'Repeat on weekdays' | GAP | P3 | Restore labels or document staged-preview UX. | S |
| G2-2-011-044 | F19 | LC:55 cap200 occurrences limits writes | NV:23 max93 day window, NS:94 bulk insert up to93 rows | EXTRA | P3 | Retain tight batch bounds while supporting legacy-compatible long term schedules. | S |
| G2-2-011-045 | F19 | LC:163-186 up to200 sequential DB saves | NS:94-103 batched DB inserts and map IDs | EXTRA | P3 | Keep efficient insert but isolate unexpected individual errors. | S |
| G2-2-011-046 | F20 | LC:206-209 HH:mm -> HH:mm:ss, LocalDate times interpreted by ClassScheduleService | NV:40-57 IST conversion subtract 330min, no seconds | GAP | P2 | Test time/clock precision and normalize optional seconds. | S |
| G2-2-011-047 | F20 | LC:163-185 does not require preview or optimistic section timestamp | NS:35-45 expectedSectionUpdatedAt strict CAS, NC:94-108 preview-key stale guard | EXTRA | P3 | Keep CAS and preview staleness hardening. | S |
| G2-2-011-048 | F20 | LC:148-156 zero match selection yields no-match message | NV:13 rejects empty weekdays before expansion | GAP | P2 | Preserve semantics of empty weekdays mapping to all days. | S |
| G2-2-011-049 | F21 | LC:41-45 ClassScheduleService.create handles provider/DB conflicts | NS:94-117 Drizzle direct insert; no external provider | GAP | P2 | Verify parity in schedule event hooks and downstream notifications. | S |
| G2-2-011-050 | F22 | LC:173-177 ClassSchedule persistence per date with unique integer ID | NS:94-103 sectionScheduleEvents UUID and optional delivery joins | GAP | P2 | Provide migration mapping for old recurring classScheduleId to session event id. | S |
| G2-2-011-051 | F22 | LC:188-194 audit per-series metadata from/to/created/failed | NS:110-116 event stores count,skippedCount,from,to,deliveryId | GAP | P2 | Preserve failed reason references/session creation IDs in event details. | S |
| G2-2-011-052 | F23 | LC:97-203 direct one-shot creation, all days default, max200 | NC:69-133 preview then confirm, 93-day hard cap, requires weekdays | GAP | P1 | Record workflow restrictions as major parity gap; restore valid semester recurrence. | S |
| G2-2-011-053 | F23 | LC:32-45 individual failure semantics | NS:26-119 batch tx atomic for unexpected errors | GAP | P1 | Add per-date fault isolation while preserving conflict preview. | S |

## Summary
- 53 rows; verdicts GAP 43; MISSING 2; MATCH 4; EXTRA 4, severity P2 27; P1 9; P3 17.
- **P1-A:** Legacy permits 200 *occurrences* across long date ranges with an empty weekday selection meaning all days. New model caps calendar range at 93 days and rejects empty weekdays, preventing valid long-term timetables (F05/F23).
- **P1-B:** Legacy creates each occurrence independently, returns per-date success/failure despite unexpected exceptions. VNext uses one transaction, so an unexpected individual insert failure rolls back all conflict-free dates (F10/F12/F23).
- **P1-C:** Legacy authorizes scoped Super Admin; vNext execute requires a direct College Admin membership even for a selected-college Super Admin (F11).

### UNKNOWN/live checks
- Check legacy ClassScheduleService.create max-session-duration, conflict and faculty/class validation vs direct vNext schedule event insert, and preview/commit permission under selected-college Super Admin.
- Compare modal vs standalone page at 375/768/1280 and concurrent schedule changes before approving structural differences.
