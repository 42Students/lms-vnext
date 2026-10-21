# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-class-schedule-controller.md

28 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-class-schedule-controller.md

## G2-2-011-001  [P2] GAP  facet F01  effort S
- Legacy: LC:47-52 POST /api/v1/admin/class-schedule/recurring
- vNext now: NC:77-87 preview and NC:115-124 execute via two POST routes
- Fix: Map legacy one-shot endpoint to two-step preview/commit contract.

## G2-2-011-002  [P2] GAP  facet F01  effort S
- Legacy: LF:413 Schedule action per class row, LF:339-375 opens recurring modal
- vNext now: NC:30-33 standalone CollegeRecurringPreview reached by /college/classes/recurring-preview
- Fix: Preserve per-class modal from class table with preselected class.

## G2-2-011-003  [P2] GAP  facet F02  effort S
- Legacy: LF:339-375 one modal saves range and shows result in same UI
- vNext now: NC:134-263 standalone preview form then result list/ConfirmDialog
- Fix: Clone modal layout or approve preview redesign without changing class-row entry.

## G2-2-011-004  [P2] GAP  facet F03  effort S
- Legacy: LF:339-351 Create recurring, day selector, class summary controls
- vNext now: NC:144-218 full form + Preview sessions button, then execute confirmation
- Fix: Preserve legacy CTA and field groups, add optional preview without displacing them.

## G2-2-011-005  [P2] MISSING  facet F03  effort S
- Legacy: LF:371-375 unsaved changes Modal.confirm on close
- vNext now: NC:30-133 controls state locally; on navigation no dirty-discard guard in component
- Fix: Add unsaved recurring-draft navigation/discard confirmation.

## G2-2-011-006  [P2] GAP  facet F03  effort S
- Legacy: LC:196-203 created/failed summary
- vNext now: NC:222-226 Created N scheduled sessions, skipped date list
- Fix: Show requested/created/failed counts and reasons in legacy terminology.

## G2-2-011-007  [P2] GAP  facet F04  effort S
- Legacy: LC:196-200 result requested,createdCount,created[{date,classScheduleId}],failed[{date,reason}]
- vNext now: NS:90-117 result `{created,requested,failed,skipped[{localDate,reasons}],sessionIds}`
- Fix: Preserve per-date created ID/date mapping and failure diagnostics.

## G2-2-011-008  [P2] GAP  facet F04  effort S
- Legacy: LC:175-183 created classScheduleId per-date, failed reason exception message
- vNext now: NS:90-117 creates IDs without date mapping, conflict enum reasons
- Fix: Return date+sessionID pairs and display detailed human-readable conflict reasons.

## G2-2-011-010  [P2] GAP  facet F05  effort S
- Legacy: LC:135-145 empty weekdays means EVERY day in range
- vNext now: NV:13 min1 and NC:216 disables zero chosen days
- Fix: Support explicit Every day option and preserve empty-weekdays API meaning or document change.

## G2-2-011-011  [P2] GAP  facet F05  effort S
- Legacy: LC:88-89 MONDAY..SUNDAY case-insensitive string values
- vNext now: NV:13 weekdays numeric 0..6 (Sunday0)
- Fix: Document weekday mapping and normalize legacy names.

## G2-2-011-012  [P2] GAP  facet F06  effort S
- Legacy: LC:74-90 optional courseId, facultyId, lectureHallId, title; required classId, date/times
- vNext now: NV:9-19 required section/from/to/weekdays/times; NE:5 title min1 max160
- Fix: Make title optional if required by old clients or document required-title tightening.

## G2-2-011-013  [P2] GAP  facet F06  effort S
- Legacy: LC:86-87 HH:mm 24-hour (normalizes seconds), no timezone in DTO
- vNext now: NV:8 HH:mm exact, NC:176-182 IST user copy
- Fix: Support accepted HH:mm:ss input (or provide validation mapping), preserve IST wall-clock.

## G2-2-011-024  [P2] GAP  facet F09  effort S
- Legacy: LF:339-375 AntD Modal recurrence with dirty-discard prompt
- vNext now: NC:99-133 ConfirmDialog for saving, independent page with no close-modal state
- Fix: Restore modal + discard guard, preserve confirm optional.

## G2-2-011-025  [P2] MISSING  facet F09  effort S
- Legacy: LF:365-375 Cancel cancels draft after Modal.confirm
- vNext now: NC:134-263 no standalone cancel action in component
- Fix: Provide Cancel/back with dirty-state confirmation.

## G2-2-011-028  [P2] GAP  facet F10  effort S
- Legacy: LC:188-194 optional single CLASS_SCHEDULE_RECURRING_CREATE audit event
- vNext now: NS:110-116 required ACADEMICS_CLASS_UPDATED summary event
- Fix: Preserve event taxonomy or map to exact old named event for activity feed.

## G2-2-011-031  [P2] GAP  facet F11  effort S
- Legacy: LC:118-120 cross-college class returns exact error
- vNext now: NS:28-47 class scope joins college and returns NOT_FOUND
- Fix: Map denial to no-leak user error or approve changed copy.

## G2-2-011-033  [P2] GAP  facet F12  effort S
- Legacy: LC:147-160 every day if no weekdays, inclusive endpoints
- vNext now: NV:40-57 selected named weekdays and date-inclusive loop
- Fix: Preserve legacy empty-days policy if maintaining API compatibility.

## G2-2-011-036  [P2] GAP  facet F13  effort S
- Legacy: LF:309-336 independently loads faculty/course/hall dropdown options and warnings
- vNext now: NP:116-166 SSR grouped options, NC:137-140 no classes message
- Fix: Show per-dropdown unavailable vs empty and reload states.

## G2-2-011-040  [P2] GAP  facet F16  effort S
- Legacy: LF:339-375 modal adaptive AntD fields
- vNext now: NC:143-214 2-col form and 4-col dates on desktop, 1-col mobile
- Fix: Compare modal/form density at phone/tablet/desktop.

## G2-2-011-041  [P2] GAP  facet F17  effort S
- Legacy: LF:371-375 accessible Modal.confirm for discard
- vNext now: NC:99-133 ConfirmDialog on save, no discard
- Fix: Add Escape/dismiss dirty guard, ensure keyboard focus return.

## G2-2-011-046  [P2] GAP  facet F20  effort S
- Legacy: LC:206-209 HH:mm -> HH:mm:ss, LocalDate times interpreted by ClassScheduleService
- vNext now: NV:40-57 IST conversion subtract 330min, no seconds
- Fix: Test time/clock precision and normalize optional seconds.

## G2-2-011-048  [P2] GAP  facet F20  effort S
- Legacy: LC:148-156 zero match selection yields no-match message
- vNext now: NV:13 rejects empty weekdays before expansion
- Fix: Preserve semantics of empty weekdays mapping to all days.

## G2-2-011-049  [P2] GAP  facet F21  effort S
- Legacy: LC:41-45 ClassScheduleService.create handles provider/DB conflicts
- vNext now: NS:94-117 Drizzle direct insert; no external provider
- Fix: Verify parity in schedule event hooks and downstream notifications.

## G2-2-011-050  [P2] GAP  facet F22  effort S
- Legacy: LC:173-177 ClassSchedule persistence per date with unique integer ID
- vNext now: NS:94-103 sectionScheduleEvents UUID and optional delivery joins
- Fix: Provide migration mapping for old recurring classScheduleId to session event id.

## G2-2-011-051  [P2] GAP  facet F22  effort S
- Legacy: LC:188-194 audit per-series metadata from/to/created/failed
- vNext now: NS:110-116 event stores count,skippedCount,from,to,deliveryId
- Fix: Preserve failed reason references/session creation IDs in event details.

## G2-2-011-037  [P3] GAP  facet F13  effort S
- Legacy: LF:359-360 Failed to create recurring sessions on exception
- vNext now: NC:129-130 'Scheduling failed' generic
- Fix: Restore exact exception copy plus per-date troubleshooting.

## G2-2-011-042  [P3] GAP  facet F18  effort S
- Legacy: LC:201 'Created X of Y session(s)' and LF:373 'Discard this recurring schedule?'
- vNext now: NC:222-223 new success, no corresponding discard copy
- Fix: Restore exact messages.

## G2-2-011-043  [P3] GAP  facet F18  effort S
- Legacy: LF:339-360 legacy 'Schedule' and form fields
- vNext now: NC:216 'Preview sessions', NC:144 'Session title', NC:185 'Repeat on weekdays'
- Fix: Restore labels or document staged-preview UX.
