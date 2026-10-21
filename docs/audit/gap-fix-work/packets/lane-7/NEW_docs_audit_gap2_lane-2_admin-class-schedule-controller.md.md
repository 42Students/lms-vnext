# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-class-schedule-controller.md

17 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-class-schedule-controller.md

## G2-2-011-009  [P1] GAP  facet F05  effort S
- Legacy: LC:148-156 generates inclusive matching date range, capped 200 occurrences
- vNext now: NV:21-26 max93-day span and weekdays 1..7
- Fix: Align recurrence cap semantics; 93 calendar-day max can reject valid ≤200-occurrence semester series.

## G2-2-011-015  [P1] GAP  facet F06  effort S
- Legacy: LC:148-154 cap200 OCCURRENCES, not overall day span
- vNext now: NV:21-23 at most93 inclusive days
- Fix: Enforce 200 occurrences and academic term instead of arbitrary 93 days if owner demands legacy parity.

## G2-2-011-026  [P1] GAP  facet F10  effort S
- Legacy: LC:163-185 each occurrence calls classScheduleService.create independently
- vNext now: NS:26-119 one SQL transaction inserts all conflict-free occurrences
- Fix: Make per-date creation independently resilient to DB constraint failure; one failed row must not roll back successful dates.

## G2-2-011-027  [P1] GAP  facet F10  effort S
- Legacy: LC:41-45 inherits ClassScheduleService full conflicts/max-duration validation
- vNext now: NS:74-93 checks section/faculty/hall overlaps, NV:24 endTime>start
- Fix: Audit equivalent max-duration and multi-course schedule clash rules beyond simple overlap.

## G2-2-011-029  [P1] GAP  facet F10  effort S
- Legacy: LC:196-200 per-date failed return does not abort other dates
- vNext now: NS:90-117 skips predictable conflicts; unexpected insert error aborts transaction
- Fix: Use savepoints or chunked per-occurrence transaction to retain partial success.

## G2-2-011-030  [P1] GAP  facet F11  effort S
- Legacy: LC:112-120 College Admin + class belongs to chosen college; super-admin permitted with correct scope
- vNext now: NS:19-23 requires membership role COLLEGE_ADMIN; no Super Admin actor path
- Fix: Support selected-college Super Admin route under central requirePermission for recurring create.

## G2-2-011-035  [P1] GAP  facet F12  effort S
- Legacy: LC:163-186 one failed occurrence does not roll back any success
- vNext now: NS:26-119 single transaction rolls back on unexpected failure
- Fix: Guarantee per-date independent persistence or document stronger all-or-none behavior.

## G2-2-011-052  [P1] GAP  facet F23  effort S
- Legacy: LC:97-203 direct one-shot creation, all days default, max200
- vNext now: NC:69-133 preview then confirm, 93-day hard cap, requires weekdays
- Fix: Record workflow restrictions as major parity gap; restore valid semester recurrence.

## G2-2-011-053  [P1] GAP  facet F23  effort S
- Legacy: LC:32-45 individual failure semantics
- vNext now: NS:26-119 batch tx atomic for unexpected errors
- Fix: Add per-date fault isolation while preserving conflict preview.

## G2-2-011-020  [P2] GAP  facet F07  effort S
- Legacy: LC:153-154 'That range would create more than 200 sessions. Narrow...'
- vNext now: NV:23 max93 days
- Fix: Match occurrence-cap error and count actual matching days.

## G2-2-011-021  [P2] GAP  facet F07  effort S
- Legacy: LC:157-158 'No dates in that range match selected weekdays'
- vNext now: NP:81-82 returns notice No matching weekdays ...; NS:24-25 conflicts error
- Fix: Surface exact no-match error before preview/commit.

## G2-2-011-016  [P3] GAP  facet F07  effort S
- Legacy: LC:101-110 exact messages collegeId must be positive, classId is required, dates/times all required
- vNext now: NV:9-27 generic Zod issues and NC:69-91 generic preview error
- Fix: Map field-specific legacy errors into inline helper copy.

## G2-2-011-017  [P3] GAP  facet F07  effort S
- Legacy: LC:129 'startDate and endDate must be yyyy-MM-dd'
- vNext now: NV:3-7 'Date must be an existing YYYY-MM-DD date'
- Fix: Restore exact date format help/error.

## G2-2-011-018  [P3] GAP  facet F07  effort S
- Legacy: LC:132 'endDate must be on or after startDate'
- vNext now: NV:20 'End date precedes start', NC:215 'To date cannot be earlier than From date.'
- Fix: Use one exact legacy message across UI and API.

## G2-2-011-019  [P3] GAP  facet F07  effort S
- Legacy: LC:142 'Unrecognised day of week: [value]'
- vNext now: NV:13 numeric type issue, NC:187-196 weekday checkboxes
- Fix: Normalize legacy string weekdays and provide specific invalid day error.

## G2-2-011-022  [P3] GAP  facet F08  effort S
- Legacy: LC:201-202 'Created N of M session(s)'
- vNext now: NC:222-223 'Created N scheduled sessions.'
- Fix: Display both requested and created counts.

## G2-2-011-023  [P3] GAP  facet F08  effort S
- Legacy: LC:179-185 each failure date/reason
- vNext now: NC:224-226 skipped dates and enum reasons; no legacy error message
- Fix: Use human-readable per-date conflict reasons and separate unexpected failures.
