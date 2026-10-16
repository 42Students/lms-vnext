# TPO / Calendar and Reports (legacy: /tpo/calendar, /tpo/reports, /tpo/reports/[name]; vNext: /tpo/calendar (+ /rounds, /interviews, /export), /tpo/placements/schedule-conflicts, /tpo/reports (+ 16 report routes))
Audited: 2026-10-16 by Claude Sonnet 5.5 (Round A, code only)   Reviewed: not yet

Scope: two legacy pages, one subsection each. 1A/2A Calendar, 1B/2B Reports. The Add-follow-up modal and the Move modal belong to Calendar. Round create/edit/delete lives in the drive Rounds tab (another agent's page) and is only noted where the Calendar links to it. The Engage page (follow-up creation from a lead) is another agent's page.

Legacy refs. FE = `_hr-tpo-fe` branch `lms-dev-2026` (tip 63fea105): CAL = `src/pages/tpo/calendar.js`, WTG = `components/tpo/WeekTimeGrid.jsx`, CG = `components/tpo/ui/calendarGrid.js`, FUM = `components/tpo/FollowUpModal.jsx`, RI = `src/pages/tpo/reports/index.js`, RN = `src/pages/tpo/reports/[name].js`, RM = `components/tpo/reportsMeta.js`, RV = `components/tpo/reportViews.js`, RF = `components/tpo/ui/reportFilters.js`, AP = `components/tpo/accreditationPreflight.js`, JS = `components/tpo/ui/JourneyStrip.jsx`, TF = `tpoFiles.js`, TDT = `TpoDataTable.js`, DJ = `dj.js`. BE = `42LMS-BACKEND/lms` branch `lms-dev-2026`: HUB = `controller/tpo/TpoHubController.java`, INS = `service/tpo/TpoInsightsService.java`, RLC = `controller/tpo/TpoRecruiterLeadController.java`, RLS = `service/tpo/TpoRecruiterLeadService.java`, IRS = `service/tpo/InterviewReminderService.java`. Read with `git show lms-dev-2026:<path>` inside those two repos (the `42lms` root repo has only master). Also read: `docs/tpo-ux/CALENDAR-UX-AUDIT-2026-10-05.md` and `REPORTS-UX-AUDIT-2026-10-05.md` exist in the FE tree but were not needed.

vNext refs. PCW = `src/components/placements/placement-calendar-workspace.tsx`, PCS = `src/modules/placements/placement-calendar-service.ts`, PCM = `placement-calendar-model.ts`, CFA = `src/components/placements/tpo-calendar-followup-actions.tsx`, TRC = `tpo-round-calendar-control.tsx`, TRS = `src/modules/placements/tpo-round-calendar-service.ts`, CAL-PAGE = `src/app/(authenticated)/tpo/calendar/page.tsx`, REP = `src/app/(authenticated)/tpo/reports/<slug>/page.tsx`, RUI = `src/components/placements/placement-report-ui.tsx`, RAPI = `src/app/api/placements/reports/route.ts`, RSV = `src/modules/placements/report-service.ts`.

---------------------------------------------------------------------------------------------------

# PART A: CALENDAR

## 1A. Legacy behaviour (`/tpo/calendar`)

### 1A.1 Entry points and navigation
- Sidebar `Calendar` (group Coordinate; `docs/audit/wording-gap-report.md:96,108`). Heading `Calendar`, subtitle "Coordinate rounds, talks, deadlines and recruiter follow-ups without losing the wider placement schedule." (CAL:225-226). `data-testid="tpo.calendar"` (CAL:221).
- No query-string state: view, anchor date and filters are React state only (CAL:28-34), so a refresh or a shared link always lands on Week, this week, all types.
- Inbound links: Home "this week" block (INS:380 calls `calendar()` with follow-ups off); Engage/recruiter lead pages create follow-ups that appear here.
- Outbound: event `Open` goes to `/tpo/drives/{jobId}` (Round and Talk add `?tab=rounds`) or `/tpo/recruiters/{recruiterLeadId}` (CAL:146-150). Blocked dates and events with neither id have no Open.
- Roles: TPO portal, `GET /api/v1/tpo/calendar?from&to` scoped to `p().getCollegeId()` (HUB:69-72). Mutations guard `guard.requireRecruiterLead` / `requireFollowUp` (RLC:121,129,136).

### 1A.2 Views and navigation controls
- `Segmented` view switch in the header: `Week` (default), `Month`, `Agenda` (CAL:228-233). Agenda becomes the default when `window.innerWidth < 768` (CAL:52).
- Range: Week = anchor week start to end; Month = month padded to full weeks; Agenda = anchor day plus 30 days (CAL:54-58).
- Buttons `Previous`, `Today`, `Next` (CAL:291-293). Step is 1 week, 1 month, or 30 days (CAL:215).
- Range heading (H4): month view `MMMM YYYY`, else `D MMM – D MMM YYYY`; under it "{n} item(s) in this month|week|period" counting filtered items (CAL:296-297).

### 1A.3 Event model (INS:454-494) and colours (CAL:18)
Five types, each with a colour: `Round` blue #0958d9, `Talk` purple #6b2fd1, `Deadline` orange #b34700, `Follow-up` teal #0a7c88, `Blocked` grey #5b6b82.
- ROUND/TALK: every `job_round` row whose `scheduled_date` is in range on a job of this college with `lifecycle_status IN ('DRAFT','PUBLISHED')` and not deleted (no round-status filter). Title = `Company · round name`; venue from round; `kind=TALK` becomes type TALK. Not draggable.
- DEADLINE: `job.application_deadline` in range for PUBLISHED jobs only. Title `Deadline: <company>`.
- FOLLOW_UP: open follow-ups only (`done_at IS NULL`) of this college's recruiter leads, `due_at` in range, title `Follow up: <person>`, note, `recruiterLeadId`. Draggable.
- BLOCKED: exam dates from `placement_season.blocked_dates` JSON across all seasons of the college, label or "Blocked" (INS:483-491, 496-508). Malformed JSON is ignored.
- Sorted by `startsAt` string. Times are UTC stored/no offset, parsed by `dj()` and sent by `serverTime()` (DJ:1-30).

### 1A.4 Today panel and "Needs doing" (CAL:250-286)
- Always shown above the calendar, independent of the visible range. Two extra loads: today to +7 days, and today minus 90 days to today (CAL:75-105), each with its own error (`soonError`, `pastError`).
- Heading eyebrow `Today, ddd D MMM`. States: "Checking today's schedule…", "Today's schedule could not be verified", "Nothing scheduled today", else a button per item: bold `h:mm A` (or `Today` for deadlines), title, and ` · done` when the time has passed (not for deadlines). Clicking opens the item (Open rules above).
- Sub-line: "Next 7 days: {n} item(s), first {title} on {ddd D MMM}." or "Nothing in the next 7 days." or "Checking the next 7 days…" or "The next 7 days could not be verified."
- Warning Alert "Calendar summary is partially unavailable" with description naming "today / next 7 days" and/or "overdue follow-ups" and the text "Last-known rows are kept where available; missing rows are not treated as zero.", action `Retry summary` (CAL:237-249).
- `Needs doing:` chips (aria group, `aria-pressed`): `Follow-ups overdue · n` (open follow-ups in the last 90 days whose time has passed), `Rounds on a blocked date · n` (rounds/talks in the next 7 days on a day that has a Blocked event), `Busy days (3 or more) · n` (all events on days with 3 or more events in the next 7 days). Chips show only when non-zero or picked. Picking one opens a `Card` titled with the chip label, `Close` link, the events (each with its popover) and the hint "Click one for Open[, Move or Done]." (CAL:110-121, 280-286).

### 1A.5 Filters (CAL:301-320)
- Row of five type chips doubling as legend and filter, each with a count for the loaded range (`typeCounts`). Behaviour: with all on, clicking one shows only that type ("Show only rounds" tooltip); clicking more adds ("Show too"/"Hide"); removing the last resets to all (CAL:216-218).
- `Show everything` link appears when any type is off or a company is chosen; resets both (CAL:311).
- `Select` "All companies" (allowClear) with the distinct company names of the loaded range (CAL:124, 312-319). Instant (no Apply).
- No search box, no owner filter (the file header comment mentions owner but no control exists; `ownerId` is returned by the API but unused).

### 1A.6 Week view (WTG, CG)
- Time grid: 7 day columns; header `ddd` + date number, today highlighted; hours 7 AM to 9 PM at 52px/hour; an "all day" strip holds Deadline and Blocked events; a red now-line in today's column; overlapping events share lanes side by side; events outside 7-21h are clamped into the grid; default durations Round 60, Talk 60, Follow-up 30, other 45 minutes (CG:4-26).
- Hint paragraph: "Click an empty time to add a follow-up; drag a follow-up to move it. Rounds are changed from their drive." (CAL:332).
- Click an empty spot snaps to 15 minutes and opens `New follow-up` prefilled with that time (WTG:72, CG:59-64). Keyboard: each day column is focusable (`role=gridcell`, aria-label "{dddd D MMMM}: click a time to add something, or press Enter to add one at {h A}"); Enter/Space opens the modal at the next whole hour today, else 10 AM (WTG:15-19,65-70).
- Drag a follow-up onto another day/time: `PUT ~T/recruiter-leads/follow-ups/{id}/move` with the dropped slot (CAL:170-172). No confirm. Rounds/talks/deadlines are not draggable.

### 1A.7 Month view (CAL:344-351)
antd Calendar without its header; each date shows up to 3 events as colour-dot + title buttons (click = Open) and "+n more" text (not a link) beyond 3. Selecting a date changes the anchor.

### 1A.8 Agenda view (CAL:352-368)
List grouped by day: weekday eyebrow + `D MMMM`, then event pills. Empty: "Nothing scheduled in this period".

### 1A.9 Event pill and popover (CAL:174-212)
- Pill: coloured, shows bold `h:mm A` (not for Blocked or Deadline) and title; `draggable` for follow-ups; focusable with `role=button` and aria-label "{title}, {ddd D MMM, h:mm A}[. Press Enter to move it]". Enter/Space on a follow-up opens Move; on anything else it opens the item.
- Popover (title = event title): `ddd D MMM, h:mm A`, venue, note, buttons `Open` (when jobId or lead id), and for follow-ups `Move` and `Done`.
- `Done`: `POST ~T/recruiter-leads/follow-ups/{id}/done`, no confirm; failure message "Could not mark it done" (or server message). Backend: row-locked, already-done is a silent no-op (RLS:249-254), 204.
- `Move`: modal `Move this follow-up` with a showTime DatePicker; OK disabled until a value exists; calls the atomic `PUT .../move` (CAL:373-389); failure "Could not move it"; "A finished follow-up cannot be moved" (409) and "Choose a date" come from the server (RLC:134-139, RLS:240-246). No future-time validation on Move.
- A single in-flight guard `followUpBusyRef` blocks double submits; all pill buttons disable while one mutation runs.

### 1A.10 Add-follow-up modal `New follow-up` (FUM)
- Opened by clicking a week slot (no other entry point on this page). OK text `Add`. Not closable by mask; Esc/close disabled while saving.
- Fields: `Recruiter` (required "Choose a recruiter"; searchable Select, placeholder "Type a name or company", options from `GET ~T/search?q=` limited to 5 recruiter leads, minimum 2 characters; label `name · company`); `When` (required "Pick a date and time"; must be after now: "Pick a future date and time"; `D MMM YYYY, h:mm A`, 5-minute steps, past days disabled; prefilled with the clicked slot); `Note (optional)` textarea, 2 rows.
- Search failure shows an Alert "Recruiter search unavailable" with the message and disables OK.
- Save: `POST ~T/recruiter-leads/{id}/follow-ups` `{dueAt, note|null}`; success toast `Follow-up added`, modal closes, calendar and summaries reload; failure shows Alert "Follow-up was not saved" with server message plus toast ("Could not save the follow-up" fallback).
- Dirty guard: closing a dirty form asks `Discard this follow-up draft?` / "The recruiter, time or note you entered has not been saved." (`Discard` / `Keep editing`); browser unload and Next route changes also prompt "Discard this follow-up draft?" (FUM:34-53,111-118).
- Backend: no check that `dueAt` is in the future; owner = principal; `created_at` now (RLS:229-237).

### 1A.11 States
- Initial load: `ListSkeleton` "Loading placement calendar"; load failure with no data: `PanelError` with message (fallback "Could not load the calendar") and Retry; refresh failure with data: closable error Alert "This refresh failed. Showing the last successful load." + Retry; refresh in flight: `RefreshStatus` "Refreshing calendar…" (CAL:324-332). Requests are sequence-numbered so stale answers are dropped.
- Empty: only the Agenda has an empty message; Week and Month just render blank.

### 1A.12 Exports, add/edit event, reminders, conflicts
- No export, no ICS, no print on this page.
- No add/edit/cancel of rounds here ("Rounds are changed from their drive"). The only creatable event is a recruiter follow-up.
- Blocked-date conflict handling: the calendar shows BLOCKED and surfaces "Rounds on a blocked date"; the drive Rounds tab calls `GET ~T/calendar/blocked-check?date=` (HUB:74-77, INS:510-515, FE `RoundsTab.js:112-115`) to warn when a round is set on a blocked date.
- Reminders (side effects tied to the calendar's rounds, no UI here): a student gets an email when a round/slot is set or changed (`ROUND_SCHEDULED`, sent by TpoScheduleService) and an evening-before `ROUND_REMINDER` (IRS:21-30). Follow-ups have no reminder email in the code read.

### 1A.13 Responsive and accessibility
Agenda default under 768px; the week grid is the desktop view. Type chips are real buttons with `aria-pressed`; the time grid is `role=grid` with column headers; events are keyboard operable.

## 2A. vNext behaviour (`/tpo/calendar` and siblings)

### 2A.1 Entry points
- Sidebar label `Calendar` (`src/modules/placements/tpo-page-copy.ts:8`), heading `Calendar` via `TPO_OWNER_PAGE_COPY.calendar` (PCW:526-529). The earlier wording-gap item T6 ("Placement Calendar") is closed on current code.
- `CAL-PAGE`: redirects non-TPO to /dashboard (CAL-PAGE:25-30), `requirePersistedTpoMembership` (:32). URL state `date`, `view`, `company`, `kind` validated by `parseTpoCalendarUrl` (`tpo-calendar-url-model.ts`); invalid values show "Invalid calendar filters" with "Reset calendar filters" and no query is run (CAL-PAGE:38-44).
- Three extra links above the workspace: `Export upcoming rounds CSV →`, `Interview schedule readiness →`, `Create, reschedule or cancel a drive round →` (CAL-PAGE:46-58). PageHeader eyebrow `TPO`, action `Placement operations →`.
- Description: "College-wide rounds, application deadlines and recruiter follow-ups. Dates and times are shown in Indian Standard Time." (PCW:532).

### 2A.2 Views, navigation, filters (server rendered, GET forms)
- View links `week | month | agenda` (default **month**, PCW:117-119), previous/next arrows (aria-labels "Previous calendar period"/"Next calendar period"), `Today`, range label (PCW:612-679). Agenda = the anchor month (PCM `placementCalendarWindow` comment lines 119-125). Week step 1 week, others 1 month. No mobile default.
- Form (PCW:681-798): `Date` (date input), `Company` (search input, max 150, "Search company name", server ILIKE with escaped wildcards, PCS:152-165,318-323), `Event type` select (`All events`, `Rounds and talks`, `Application deadlines`, `Recruiter follow-ups`), `Apply filters` submit. For TPO the round-kind filter is forced off (PCW:134-142). All filters live in the URL.
- Summary cards: `Rounds`, `Deadlines`, `Follow-ups`, `All events` for the visible window (PCW:569-593), and a `Next scheduled` card with `Open event →` (PCW:786-823).

### 2A.3 Events (PCS:183-603)
- Rounds: `placement_job_rounds` with status `SCHEDULED` or `COMPLETED`, scheduled in window, job not archived, college via company relationship (PCS:285-325). Title = round name; company in the eyebrow; kind label shows `INTERVIEW`, `GD`, `TALK`... or `Round`.
- Deadlines: jobs with status `PUBLISHED` or `CLOSED` and `application_deadline` in window (PCS:367-401), title "Application deadline: {job title}".
- Follow-ups: all follow-ups of the college in window, **including completed** ones (status badge `DONE`/`OPEN`, PCS:459-492,562-588).
- No blocked-date source; no `Blocked` or `Talk` as separate event types.
- Window max 366 days; times formatted `en-IN` IST (`... IST`).

### 2A.4 Display
- Month and Week are the same 7-column card grid (`min-w-[56rem]`, horizontally scrollable), day cells show up to 2 events (month) or 4 (week) as links with time and title, "+n more" text, "—" for empty days (PCW:825-933). No hour axis, now-line, lanes or all-day strip.
- Below the grid, an agenda section "Events in visible period"/"Agenda" lists all events grouped by day as cards: company eyebrow, title, job title, `Venue:`, note, kind badge and status badge, link `Open round in job →` / `Open placement job →` / `Open recruiter lead →` (PCW:327-423, 936-989). Empty text: "No calendar events match this date range and these filters. Try another date, company or event type."
- Event hrefs: job `/tpo/placements/jobs/{id}` (round: `#round-{roundId}`), lead `/tpo/recruiters/{id}` (PCW:210-241).

### 2A.5 Follow-up create and move
- `TpoCalendarCreateFollowup` is a permanent form section above the summary: `Recruiter lead` native select of the 100 most recently updated leads ("Showing the 100 most recently updated leads..." when more), `Due date and time (IST)` datetime-local, `Note (optional)` max 500, button `Create follow-up` / `Saving…` (CFA:40-119). Success text "Follow-up created. The calendar is refreshing." then `router.refresh()`. Empty: "No recruiter leads found. Create a lead in Engage first."
- `TpoCalendarMoveFollowup` appears only on OPEN follow-up cards: `Move follow-up (IST)` datetime-local + `Reschedule` / `Moving…`; success "Follow-up rescheduled. The calendar is refreshing." (CFA:121-175).
- APIs: `POST /api/placements/tpo/calendar/follow-ups` (201) and `PATCH .../follow-ups/[followupId]` (same-origin check, TPO role, `requirePlacementManageScope`, Zod, reuse CRM `addTpoFollowup`/`moveTpoFollowup`; done follow-ups are rejected with `TPO_CRM_FOLLOWUP_ALREADY_DONE`, 409). Errors surface as `Request failed: <CODE>` (CFA:33).
- **Both forms and APIs depend on env `DB09_TPO_API_READY=DB09_VERIFIED`.** If unset the page shows "Calendar follow-up editing is unavailable until the DB09 CRM write gate is verified. Existing calendar events remain read-only." and the APIs answer 503 `DB09_MIGRATIONS_PENDING` (PCW:504-505,558-562; `follow-ups/route.ts:17-19`). Deployed value UNCONFIRMED (the 2026-10-16 pass6 run had it ON per `docs/audit/pages/tpo/companies.md`). To confirm: call the route on dev or read the dev deployment env.
- No audit event or notification on create/move (`tpo-crm-service.ts` `addTpoFollowup` 306-355, `moveTpoFollowup` 357-390). No "mark done" on the calendar.

### 2A.6 Sibling pages (improvements over legacy, no legacy twin)
- `/tpo/calendar/rounds` (`TpoRoundCalendarControl`): pick an existing PENDING or SCHEDULED round of a PUBLISHED drive (first 200), set IST date/time, mode On campus/Virtual, venue or meeting URL, and `Confirm schedule`/`Confirm reschedule` or `Confirm cancellation` (reason min 3 chars). `window.confirm` text "Create or reschedule {round} for {company}? The action is recorded in the permanent round event history." Optimistic concurrency through `expectedUpdatedAt`; future-only; positive duration required for on-campus; venue overlap check against up to 1000 scheduled rounds; ambiguity when a same-venue round has no duration (TRS:64-130). Blocked dates are **not** checked.
- `/tpo/calendar/interviews`: interview-round readiness with 7/14/30/60/90 day lookahead, counts, per-round card, link to candidate schedule and an inline reschedule form (reason min 10 chars, audited) (`interviews/page.tsx`, `tpo-interview-reschedule-form.tsx`).
- `/tpo/calendar/export`: `from`/`to` IST dates (default today to +6, max 93 days), preview count, `Download rounds CSV` -> `GET /api/placements/tpo/calendar/export`: UTF-8 BOM CSV `tpo-upcoming-rounds.csv`, columns Company, Drive, Round, Kind, Status, Mode, Scheduled (IST), Scheduled (UTC), Venue; PENDING/SCHEDULED rounds of PUBLISHED drives starting from now; capped at 500 with a NOTICE row (`tpo-calendar-export-model.ts`, `tpo-calendar-export-service.ts:78-121`, `export/route.ts`).
- `/tpo/placements/schedule-conflicts`: "Round venue conflicts", window 7/14/30/60/90 days; counters Recorded rounds, Venue overlaps, Assessable rounds, Incomplete scheduling; confirmed overlaps (venue, minutes, both rounds linking to `/tpo/drive-day/{id}`) and "Cannot fully assess" list; cap 1000 rounds; virtual rounds excluded (`schedule-conflicts/page.tsx`). Explicitly "not a student timetable conflict detector."

### 2A.7 States and permissions
`error.tsx` and `loading.tsx` per route (boundary pages, not inline retry). TPO only; redirects others to /dashboard; college resolved from the persisted membership.

---------------------------------------------------------------------------------------------------

# PART B: REPORTS

## 1B. Legacy behaviour (`/tpo/reports`, `/tpo/reports/[name]`)

### 1B.1 Entry points
- Sidebar `Reports` (group Insights). Gallery heading `Reports`, subtitle "Answer placement questions quickly, then drill in and export the underlying data." (RI:57-58). `data-testid="tpo.reports"`.
- `GET ~T/reports/{name}` with optional `seasonId, batch, branch, company, mode, category, batchId` (HUB:79-89); names allowed: placement-summary, by-branch, by-company, ctc, unplaced, offers-acceptance, joining-status, recruiter-leads, failure-reasons, accreditation, outcomes (INS:518); anything else is "Not found". The UI never sends `seasonId` or `batch` (RN:36,90).
- Inbound: gallery cards (`/tpo/reports/{key}`), journey strip numbers, Home links.

### 1B.2 Gallery (RI)
- Snapshot call `GET ~T/reports/placement-summary` (RI:47-51). Failure shows error Alert "The headline numbers could not be loaded." with `Retry` (RI:61).
- `JourneyStrip` (JS): caption "The college's placement journey: {n} offer(s) made. Click any number for its report."; steps `Looking for a job` (registered), `Placed` (placedUnique, % of looking), `Accepted` (acceptedUnique, %); gap buttons between steps `Unplaced` ({looking-placed}) and `Not accepted yet` ({placed-accepted}); each opens a report: looking -> by-branch, placed -> placement-summary, accepted -> offers-acceptance, unplaced -> unplaced, not accepted -> offers-acceptance (RI:63-74). Numbers use `toLocaleString`.
- Three groups, each an H4 + description + card grid (RI:14-37). Cards are buttons with title, arrow icon and one-line help from RM; placement-summary has a `Start here` eyebrow:
  - **Overview and performance** ("Start with the college-wide picture, then compare branches, companies and compensation."): Placement summary, By branch, By company, Packages.
  - **Offers, joining and readiness gaps** ("Understand who is still unplaced, what happened to offers, and where students are dropping out of the funnel."): Unplaced students, Offers and acceptance, Joining status, Why students did not get through.
  - **Recruiter funnel and accreditation** ("Measure employer engagement and export the formal data required for accreditation workflows."): Recruiter engagement, After college, Accreditation export.
- Card help strings are in RM:2-14 (11 reports). No search or category filter on the gallery.

### 1B.3 Report page frame (RN)
- Header: title and help from RM; buttons `Presentation view` / `Exit presentation` (fullscreen, Esc exits) and `All reports`; accreditation adds primary `Export CSV for NAAC / NIRF` (disabled when no rows, runs the completeness check); unplaced adds primary `Act on them on Students` -> `/tpo/students?f_journey=GAP_NOT_APPLYING,GAP_UNPLACED[&f_batch=][&f_branch=]` (RN:162-169).
- Unknown slug: Empty "Unknown report". Initial load: `DashboardSkeleton` "Loading placement report"; failure with no data: `PanelError` + Retry (message `res.userMessage` or "Could not load the report"); stale failure: closable Alert "This refresh failed. Showing the last successful report." + Retry; refresh: `RefreshStatus` "Refreshing report…" (RN:155-171).
- Context line on every report: "For the filters below: **N** students placed · **M** offers · **P%** placement rate · **K** accepted", with "no placement rate yet (nobody has registered)" when registered is 0. These stats are computed with the same filters (INS:540, 73-91) (RN:173-176).
- Filters card (RN:183-218), requests debounced 350 ms and numbered so only the newest answer shows (RN:49-54,87-92): `Batch` (Academic Setup batches, searchable, label "{name} (finished)" for finished; disabled with "Batches unavailable" and a warning Alert "Batch filter unavailable" + `Retry batches` on error), `Branch` (the college's branches plus any seen in rows, searchable, free text allowed), `Company` (AutoComplete from companies seen), `Mode` (On campus, Pool, Off campus), `Pay category` (Regular, Dream, Super-dream). Which filters show is per report (`view.filters`): ALL for placement-summary, by-branch, by-company, ctc, offers-acceptance, joining-status, failure-reasons, accreditation; POP (batch, branch) for unplaced and outcomes; none for recruiter-leads (RV:21-24).
- Saved filters (browser-local, per person and college, per report, max 12, name max 60, replace by name): `Saved filters` select, `Save these filters` (disabled when no filter set) -> name input "Name, e.g. CSE 2027" + `Save`, per-saved `Delete {name}` (RN:185-202, RF:1-45).
- Warning Alert when a report needs a batch and none is picked: outcomes "NAAC 5.2 and NIRF count one graduating batch. Pick the batch above: without one, every batch is mixed together."; accreditation "NAAC 5.2.1 lists the students of one batch. Pick the batch above." (RV:87,96; RN:239).
- One bar chart per report that has one (`view.chart`): bars biggest first, max 12, value text with suffix, aria-label per bar; empty "No chart data for these filters yet." (RN:240-254, RV:112-133). The package chart uses fixed bands instead.
- The table: `TpoDataTable` (spreadsheet grid, 70vh): search (in the URL), column filters, Shift/Ctrl selection, copy rows, saved views, column chooser, numeric-column sorting, row count, Excel/CSV export of what is shown named `report-{name}`; empty "No data for these filters" / "Try a wider filter, or a different report." (RN:255-256; TDT:97-110).
- Per-report info Alert after the table (`view.note`), unplaced only (RV:58).
- Header export: not rendered for general reports. The generic `doExport()` exists (RN:135) but only the accreditation button calls it; other reports export through the table's own export. (Source comment RN:166 says "One export: the table's".)

### 1B.4 Reports: columns, stats and charts (RV, INS)
Values are plain words (no enum codes) and `-` for blanks; packages as `{n} LPA`, percentages as `{n}%`.
1. **Placement summary** (INS:542-543): Offer status, Offers, Students. Statuses in fixed order with words: Selected (not released yet), Being verified, Released waiting for the student, Accepted, Declined, Expired, Withdrawn by company, Reversed. Chart "Offers by status".
2. **By branch** (INS:544-568): Branch, Looking for a job, Placed, Placement rate, Offers, Average package, Highest package; every branch with students registered for placements even if no offers; sorted by placed. Chart "Placement rate by branch".
3. **By company** (INS:569-602): Company (grouped by normalised key), Drives that ran, Students applied, Students placed, Offers, Average package, Highest package; drives counted for PUBLISHED/CLOSED; companies with no drives and no placed are dropped. Chart "Students placed by company".
4. **Packages** (INS:603-610): one row Students with a package, Highest, Median, Average, from each student's best offer with positive CTC (internships excluded) plus bands `<4`, `4-6`, `6-10`, `10-20`, `20+` LPA (compensationSummary, 90-125). Chart "Students by package" from bands.
5. **Unplaced students** (INS:611-625): Student, Roll no., Batch, Branch, Lowest %, UG %, Marks verified (No marks yet / Verified / Not verified), Resume (Uploaded/Missing), Applications, Still in a drive, Last applied (D MMM YYYY or Never); registered for placements (or has applied), no offer counting as placed in the season. Note Alert (RV:58).
6. **Offers and acceptance** (INS:626-637): Company, Released, Waiting for the student, Accepted, Declined, Expired, Withdrawn by company, Acceptance rate (accepted / (accepted+declined+expired), header hint "Of the offers students answered"). Chart "Acceptance rate by company".
7. **Joining status** (INS:641-644): Company, Accepted, Joined, Deferred, Did not join, Not recorded yet (distinct students). Chart "Joined by company".
8. **Why students did not get through** (INS:645-655): Company, Round, Branch, Reason (rejection reason category, "Absent (no-show)", or "Reason not given"), Students, Share of the round (hint "Of everyone in that branch with a result in that round"); only FAIL/ABSENT round results. Chart "Students not through, by reason" (grouped).
9. **Recruiter engagement** (INS:660-678): Company, Contacts, Invited, Joined (recruiter account), Drives that ran, Students placed; "the same numbers as Engage". No filters. Chart "Students placed by company".
10. **After college** (INS:705-726): Student, Roll no., Batch, Branch, After college, Your label, Detail for every student of the filter, plus a summary bar card "Students by what they do after college" with counts and percentages per fixed outcome (placed, higher studies, entrepreneurship, competitive exams...); batch required alert. Empty summary: "No outcome data for these filters yet."
11. **Accreditation export** (INS:679-704, RV:90-97): one row per placed student (best offer): Name of the student placed, Roll no., Programme (degree from marks else branch), Branch, Batch, Employer, Employer contact (recruiter mail or lead email), Package (best offer) LPA, Offers held, Offer status (words), Joining (words, "Not recorded"). Batch required alert.
- "Placed" = offer statuses allowed by the college's `countsAsPlacedAt` rule (INS:47-49); `registered` = students whose latest placement registration is `PLACEMENTS` or who have applied; stats include `liveDrives` and `unplacedReady` (not shown here).

### 1B.5 Export behaviour
- `downloadCsv` (TF:120-133): UTF-8 with BOM (Excel-safe), CRLF, file name `<name>.csv`, columns in the report's own words (`exportValue`), all rows (not only what is shown). Table export (TDT/gridExport) writes the shown/filtered rows as Excel or CSV named `report-<name>`.
- Accreditation: `exportAccreditation` runs `buildAccreditationPreflight(rows)` over seven required fields (Package (CTC), Employer, Employer contact, Joining status, Roll number, Programme, Batch). If any student is incomplete a confirm modal shows "{n} of {total} students are missing data NAAC/NIRF ask for", a line "{Field}: missing for {n}" per field, "You can still export - missing values export as blank cells.", buttons `Export anyway` / cancel (RN:136-153; AP:1-37). Complete data downloads directly.
- Internal ids (`id`, `*Id`) are never shown or exported (RN:26).

### 1B.6 Roles, side effects, responsive
TPO only, college-scoped, read-only, no audit/notifications. Fullscreen presentation mode for review rooms. Layout uses antd cards/grid; the data grid scrolls in 70vh.

## 2B. vNext behaviour (`/tpo/reports` and report routes)

### 2B.1 Gallery (`reports/page.tsx`)
- Eyebrow `TPO · Insights`, heading `Reports`, description "Explore read-only placement performance inside your college." Action `Open management view` -> placement summary (:161-173). TPO only (:34-36).
- Shared `ReportFilters` (RUI:43-123): `Placement season` select + `Apply season`, `Drive` select ("All drives in selected season") + `Apply drive`; note "Changing the season clears the drive filter...". Four metric cards (Placement rate, Students placed, Offers, Students accepted) and a "Reporting methodology" box (RUI:125-191). Empty state "No placement season available" when none (:179-184).
- `Find a report` search (max 80) and `Report category` select (All, Overview and performance, Student outcomes, Relationships and compliance), `Search`, `Clear`; live count "{n} matching reports in the selected scope." Cards are alphabetised inside each group (`tpo-report-gallery-filter-model.ts`). Invalid search shows "Invalid report search".
- Groups and cards (titles are the card titles):
  - Overview and performance: Placement summary, Placed students by branch, Season pipeline, Company funnel & compensation intelligence, By branch, CTC.
  - Student outcomes: Unplaced students, Offer expiry watchlist, Offers & acceptance, Joining outcomes, Failure reasons.
  - Relationships and compliance: By company, Leads report, Accreditation export.
- Each card ends "Open report →" and carries the chosen season/drive in the link.

### 2B.2 Report pages (all server rendered, GET filters in URL: `seasonId`, `jobId`)
Common frame: PageHeader eyebrow `TPO · Reports`, title, description, `Export CSV` link; `ReportNavigation` pill row of 15 reports (RUI:193-238); `ReportFilters`; metrics/notes; `ReportTable` (static table, horizontally scrollable, empty state "No report rows"); `ReportScopeNote` with the methodology text, which states "A placed student is counted once when holding a currently accepted offer" (RUI:137-141). No charts, no search/sort, no saved filters, no presentation mode. Money is formatted as `₹` Indian-grouped full INR (`reportCurrency`, RUI:21-23), percentages `n%`, blanks `—`.
| Route | Page title | Content |
|---|---|---|
| placement-summary | Placement summary | 4 headline cards + 8 detail cards (Registered, Unique applicants, Applications, Accepted offers, Shortlisted, Rejected, Average/Highest annual CTC); tables Drive performance (10 cols) and Company performance (9 cols); CSV `tpo-placement-summary.csv` |
| by-branch | Placement by branch | Branch performance: Branch, Registered, Unique applicants, Applications, Offers, Accepted offers, Placed learners, Placement rate, Average/Highest annual CTC; link to branch-season; CSV `tpo-placement-by-branch.csv` |
| by-company | Placement by company | Search company, outcome filter, 7 sort orders, paging with Previous/Next, table (9 cols), `Export visible companies CSV`, `Open company records` drill-down links; CSV `tpo-placement-by-company.csv` |
| ctc | Compensation (CTC) | 6 cards (Accepted full-time offers, Offers with known CTC, Average, Median, Highest annual CTC, Offers without CTC) and a band table "Annual CTC range / Accepted full-time offers"; counts offer records not students (page text :87-92) |
| unplaced | Unplaced students | 2 cards; table Student, Branch, Membership ID; scope: "Current registered placement-pool learners with no accepted offer" |
| offers-acceptance | Offers and acceptance | 6 cards (Released, Accepted, Declined, Withdrawn, Outstanding, Expired outstanding); tables by drive and by company; `TpoReportRecordLinks` drill-downs |
| joining-status | Joining outcomes | 5 cards; tables by drive and by company; link `Review joining follow-ups →`; record links |
| failure-reasons | Failure reasons | total card; tables Outcomes by type, Reasons across selected drives (Outcome, Recorded reason, Count), Reasons by drive; kinds cover screening rejections, applied round failures, withdrawals, offer declines/withdrawals |
| leads | Recruiter leads | 6 cards (leads, invites, clicks, linked recruiter accounts, linked company relationships, linkage rate), "Outreach health · last 14 days" (7 cards + recent contact rate), tables Leads by manual stage and by acquisition source; not season filtered |
| accreditation | Accreditation evidence export | Reporting scope text, "Completeness preflight" bullet list (also written into the CSV), preview of Overall/Branch/Company aggregate rows (Section, Dimension, Applicants, Applications, Accepted offers, Placed learners; first 50), `Export evidence CSV` -> `tpo-accreditation-evidence.csv` (UTF-8 BOM) |
Extra reports with no legacy twin: `intelligence` (Company funnel and compensation), `branch-season`, `placed-branch` (Placed students by branch), `season-pipeline`, `offers-expiry` (Offer expiry watchlist), `joining-followups`. Each has its own CSV.
- CSV API: `GET /api/placements/reports?kind=&seasonId=&jobId=` (RAPI:28-45), TPO role check (:521), per-kind file names (`tpo-*.csv`, :547-613). The BOM appears on the accreditation response (:543); other kinds: UNCONFIRMED (not seen in the first 120 lines; confirm by downloading `?kind=by-branch` and checking the first bytes).
- Placement definition: service reads the college's `countsAsPlacedAt` rule (`report-service.ts:82-123`), yet the on-page methodology text says "currently accepted offer". UNCONFIRMED which is used per metric; confirm by running a college with `OFFER_RELEASED` and comparing page note with numbers.
- No `outcomes` ("After college") report route exists (`find src/app -path '*reports*'` shows 17 pages, none for outcomes).

---------------------------------------------------------------------------------------------------

## 3. Gaps
IDs `TPO-calendar-reports-NN`. NN 01-30 are Calendar, 31-70 are Reports. Severity S1 blocks a workflow, S2 degrades one, S3 cosmetic/rare, S4 nice to have.

### 3A. Calendar
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-calendar-reports-01 | Blocked (exam) dates are never shown on the TPO calendar: no `Blocked` event type, no all-day grey entries | MISSING-FIELD | S2 | CAL:18,19; INS:483-491,496-508 | absent: `placement-calendar-service.ts` has only rounds, deadlines, follow-ups (:237-498); blocked dates exist only in `/tpo/settings/blocked-dates` and `tpo-configuration-read-service.ts` |
| TPO-calendar-reports-02 | Scheduling a round does not warn or block on a blocked date (legacy calls blocked-check when a round date is picked) | VALIDATION | S2 | HUB:74-77; INS:510-515; FE `drive/RoundsTab.js:112-115` | `tpo-round-calendar-service.ts:64-130` and `tpo-round-calendar-control.tsx` have no blocked-date check |
| TPO-calendar-reports-03 | Week view is a card grid, not a time grid (no hour axis 7 AM-9 PM, now line, all-day strip, side-by-side overlaps, durations) | MISSING-TAB | S3 | WTG:31-90; CG:1-26,32-56,66-71 | PCW:825-933 same 7-column cell grid for week and month, max 4 events per day |
| TPO-calendar-reports-04 | Cannot add a follow-up by clicking a slot; no modal; the add form is a permanent block above the page (no pre-filled time) | MISSING-ACTION | S3 | WTG:60-75; CAL:338-339; FUM:121-160 | CFA:40-119 inline form at top of page |
| TPO-calendar-reports-05 | Follow-up recruiter picker is a plain select of only the 100 most recently updated leads; older leads cannot be picked (legacy searches all leads by name/company/email, 2+ characters) | MISSING-FILTER | S2 | FUM:55-71,141; INS:761 | PCW:506-513 (`slice(0,100)`); CFA:79-84,93-99 |
| TPO-calendar-reports-06 | No `Done` on a calendar follow-up (legacy marks it done from the popover); the only action on a card is Reschedule | MISSING-ACTION | S2 | CAL:186; RLC:127-132; RLS:249-254 | CFA:121-175, PCW:398-405; done lives on `/tpo/follow-ups` and `api/placements/tpo/follow-ups/[followupId]/done` only |
| TPO-calendar-reports-07 | No drag-and-drop move of a follow-up to another day/time | MISSING-ACTION | S4 | CAL:170-172,189-193; WTG:73-74 | absent (move is a datetime form, CFA:132-150) |
| TPO-calendar-reports-08 | Create has no "future time" check and no past-day blocking (legacy: "Pick a future date and time", past days disabled); a follow-up can be created in the past | VALIDATION | S3 | FUM:143-157 | `tpo-calendar-followup-model.ts:3-26`; `tpo-crm-validation.ts:73-77` (only ISO datetime) |
| TPO-calendar-reports-09 | No "Today" panel (today's items with times, "done" marker, "Nothing scheduled today") and no "Next 7 days" summary line | MISSING-FIELD | S3 | CAL:250-279 | PCW:786-823 only a single "Next scheduled" card within the visible window |
| TPO-calendar-reports-10 | No "Needs doing" shortcuts: Follow-ups overdue (90-day lookback), Rounds on a blocked date, Busy days (3 or more) | MISSING-FIELD | S2 | CAL:110-121,270-286 | absent (no overdue concept on the calendar; follow-up queue is a separate page) |
| TPO-calendar-reports-11 | Event-type filter is a single select (All / Rounds and talks / Deadlines / Follow-ups). Legacy has multi-toggle colour chips with per-type counts, separate Talk and Blocked types, and a colour legend; vNext has no colours and no counts | MISSING-FILTER | S3 | CAL:18,126-127,216-218,301-311 | PCW:60-74,723-740; badges are only info/warning/success tones (PCW:308-325) |
| TPO-calendar-reports-12 | No `Show everything` reset link while filters are active (reset only on the invalid-filter page) | MISSING-ACTION | S4 | CAL:311 | CAL-PAGE:43; PCW has none |
| TPO-calendar-reports-13 | Company filter needs a typed term plus `Apply filters` (legacy: dropdown of companies in the period, instant) | MISSING-FILTER | S4 | CAL:124,312-319 | PCW:711-721 |
| TPO-calendar-reports-14 | Default view is Month on every device; legacy defaults to Week on desktop and Agenda below 768px. The month/week grid forces `min-w-[56rem]` so phones scroll sideways | RESPONSIVE | S3 | CAL:28,52 | PCW:117-119,830; no mobile default |
| TPO-calendar-reports-15 | Event sets differ: legacy shows rounds of DRAFT and PUBLISHED drives with any round status and only OPEN follow-ups, deadlines of PUBLISHED drives; vNext shows only SCHEDULED/COMPLETED rounds (PENDING or CANCELLED rounds with a date are hidden) of any non-archived job, deadlines of PUBLISHED or CLOSED drives, and includes completed follow-ups | STATE | S3 | INS:457-481 | PCS:285-297,367-379,459-492 |
| TPO-calendar-reports-16 | Event titles/labels differ: legacy `Company · Round name`, `Deadline: Company`, `Follow up: Person` and a popover (time, venue, note, Open/Move/Done); vNext `round name` with company eyebrow, `Application deadline: {job title}` | COPY | S3 | INS:462-471,479; CAL:177-187 | PCS:507-525,539-557,565-568; PCW:339-423 |
| TPO-calendar-reports-17 | Header/subtitle wording differs from legacy subtitle; extra eyebrow `TPO`, action `Placement operations →`, and three extra link buttons | COPY | S3 | CAL:225-226 | PCW:517-551,532; CAL-PAGE:46-58 |
| TPO-calendar-reports-18 | Month label/range text, "{n} item(s) in this week" counter, "+3 more" behaviour, empty copy: legacy agenda empty "Nothing scheduled in this period" vs vNext "No calendar events match this date range and these filters. Try another date, company or event type." | COPY | S3 | CAL:297,354 | PCW:603-605,959-963 |
| TPO-calendar-reports-19 | Success/failure messages differ: legacy toast `Follow-up added`, errors "Could not move it", "Could not mark it done", "Could not save the follow-up" with Alert "Follow-up was not saved"; vNext "Follow-up created. The calendar is refreshing.", "Follow-up rescheduled. The calendar is refreshing." and raw `Request failed: TPO_CRM_FOLLOWUP_ALREADY_DONE` style codes | COPY | S3 | FUM:88-94; CAL:171,186 | CFA:33,64,143 |
| TPO-calendar-reports-20 | Follow-up writes are gated by `DB09_TPO_API_READY`; when unset the calendar is read-only and the API returns 503. Deployed value UNCONFIRMED | STATE | S1 (if unset) | n/a (legacy always writable) | PCW:504-505,558-562; `follow-ups/route.ts:17-19`; `[followupId]/route.ts:60-62` |
| TPO-calendar-reports-21 | No unsaved-draft protection on the add form (legacy confirm on close, beforeunload and route change) | STATE | S4 | FUM:34-53,102-119 | CFA:51-71 (form.reset only) |
| TPO-calendar-reports-22 | No stale/partial-data states: legacy shows "This refresh failed. Showing the last successful load.", "Calendar summary is partially unavailable" with Retry; vNext renders server errors through the route `error.tsx` boundary with no partial data | STATE | S4 | CAL:237-249,324-332 | `tpo/calendar/error.tsx`, `loading.tsx` |
| TPO-calendar-reports-23 | Student interview emails on schedule/reschedule (`ROUND_SCHEDULED`) and the evening-before `ROUND_REMINDER` were not found for the TPO round scheduling path; no reminder logic exists in `src/modules/placements` for rounds (only assessment reminders) | SIDE-EFFECT | S2 | IRS:21-30 | grep of `src/modules/placements` finds only `learner-assessment-reminders.ts`; `round-service.ts` `actOnPlacementRound` has no notification/outbox call. UNCONFIRMED whether another module (notifications fan-out, drive-day) sends them: confirm by scheduling a round on dev and checking the outbox/learner inbox |
| TPO-calendar-reports-24 | Follow-up create/move write no audit event | SIDE-EFFECT | S3 | n/a (legacy none either; listed because the vNext audit rule expects it) | `tpo-crm-service.ts:306-390` |
| TPO-calendar-reports-25 | Calendar keyboard model: legacy lets Enter on a follow-up open Move and Enter on a day column start a new follow-up; vNext relies on links and forms only (no grid semantics, no day-level add) | A11Y | S4 | WTG:32,63-70; CAL:196-205 | PCW:863-870 (aria-label on day cell only) |

### 3B. Reports
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-calendar-reports-31 | Reports cannot be filtered by Batch, Branch, Company, Mode or Pay category; only Season and Drive exist. Legacy per-report filter sets: ALL for 8 reports, Batch+Branch for unplaced and after-college | MISSING-FILTER | S2 | RN:36,183-218; RV:22-24; INS:530 | RUI:43-123 (season + drive only); every REP page |
| TPO-calendar-reports-32 | Missing report `After college` (outcomes): per-student post-college outcome plus counts per outcome (NAAC 5.2 / NIRF) with batch/branch filters | MISSING-PAGE | S2 | RM:12; RV:82-88; RN:220-238; INS:705-726 | absent (no `reports/outcomes`; gallery `page.tsx:55-155` has no card). Not to be confused with `/tpo/settings/after-college` |
| TPO-calendar-reports-33 | Accreditation export is an aggregate worksheet (Section/Dimension rows), not one row per placed student with Name, Roll no., Programme, Branch, Batch, Employer, Employer contact, Package (best offer), Offers held, Offer status, Joining; no per-student list is available for NAAC 5.2.1 | MISSING-EXPORT | S1 | RV:90-97; INS:679-704; RM:13 | `accreditation/page.tsx:112-150`; `report-accreditation-model.ts:24-40`; RAPI:543-547 |
| TPO-calendar-reports-34 | Accreditation does not require/prompt for one batch; legacy warns "NAAC 5.2.1 lists the students of one batch. Pick the batch above." and has the batch filter | VALIDATION | S2 | RV:96; RN:239 | no batch control (see -31) |
| TPO-calendar-reports-35 | Accreditation completeness check is a static bullet list; legacy checks seven required fields per student and shows "{n} of {total} students are missing data NAAC/NIRF ask for", per-field "missing for {n}", `Export anyway` | VALIDATION | S2 | AP:9-37; RN:136-153 | `accreditation/page.tsx:80-93` (report.issues text only) |
| TPO-calendar-reports-36 | Gallery titles and card help differ from the old LMS: `Packages` vs `CTC`, `Joining status` vs `Joining outcomes`, `Why students did not get through` vs `Failure reasons`, `Recruiter engagement` vs `Leads report`, `Offers and acceptance` vs `Offers & acceptance`, `After college` absent; help strings differ for all cards (RM:2-14) | COPY | S2 | RM:2-14 | `reports/page.tsx:59-153` |
| TPO-calendar-reports-37 | Gallery group sub-headings differ: legacy group 2 `Offers, joining and readiness gaps`, group 3 `Recruiter funnel and accreditation`, with eyebrow-less descriptions; vNext `Student outcomes` and `Relationships and compliance`; legacy has 11 cards in 3 groups, vNext 14 with 6 extras; no `Start here` marker | COPY | S3 | RI:14-37,97 | `reports/page.tsx:55-155` |
| TPO-calendar-reports-38 | Gallery/page headings and descriptions differ: subtitle "Answer placement questions quickly, then drill in and export the underlying data." vs "Explore read-only placement performance inside your college."; report page titles "Placement by branch", "Placement by company", "Compensation (CTC)", "Recruiter leads", "Accreditation evidence export" vs legacy meta titles | COPY | S2 | RI:57-58; RM:2-14; RN:161 | `reports/page.tsx:161-164`; REP titles |
| TPO-calendar-reports-39 | Gallery lacks the placement journey strip (Looking for a job -> Placed -> Accepted, gaps Unplaced and Not accepted yet, each opening its report) and the "{n} offers made" caption; vNext shows four static cards | MISSING-FIELD | S3 | RI:63-74; JS:15-65 | RUI:147-191 |
| TPO-calendar-reports-40 | Report pages have no per-report bar chart (offers by status, placement rate by branch, placed by company, package bands, acceptance rate by company, joined by company, reasons, engagement) | MISSING-FIELD | S3 | RV:30,36,42,48,64,69,75,80; RN:240-254 | no chart component under `src/components/placements/placement-report-ui.tsx`; REP pages table-only |
| TPO-calendar-reports-41 | Tables are static: no search, no column sort, no column filters, no copy, no column chooser, no saved views, no row count line; only `by-company` has search/sort/paging | MISSING-ACTION | S3 | TDT:97-110; RV:101-109 | RUI:276-330 |
| TPO-calendar-reports-42 | The "For the filters below: N students placed · M offers · P% placement rate · K accepted" line is not on every report; vNext shows headline cards only on gallery, placement-summary, by-branch, by-company | MISSING-FIELD | S3 | RN:173-176 | REP ctc/unplaced/offers/joining/failure/leads pages |
| TPO-calendar-reports-43 | Unplaced report lacks Roll no., Batch, Lowest %, UG %, Marks verified, Resume, Applications, Still in a drive, Last applied; shows only Student, Branch, Membership ID | MISSING-COLUMN | S2 | RV:52-57; INS:611-625 | `unplaced/page.tsx:78-85` |
| TPO-calendar-reports-44 | Missing `Act on them on Students` action from the unplaced report (opens Students with the journey filter, batch and branch) and the explanatory note about Applications/Resume/Marks | MISSING-ACTION | S2 | RN:168-169; RV:58 | absent in `unplaced/page.tsx` |
| TPO-calendar-reports-45 | Placement summary lacks the offers-by-status breakdown (Selected, Being verified, Released, Accepted, Declined, Expired, Withdrawn, Reversed with offers and students); vNext has drive and company tables | MISSING-COLUMN | S3 | RV:26-31; INS:542-543 | `placement-summary/page.tsx:102-156` |
| TPO-calendar-reports-46 | By-branch columns differ: legacy `Looking for a job`, `Placed`, `Placement rate`, `Offers`, `Average package`, `Highest package` in `LPA`; vNext adds applicants/applications/accepted offers and prints full INR (`₹…`) instead of LPA | COPY | S3 | RV:32-37 | `by-branch/page.tsx:79-102`; RUI:21-23 |
| TPO-calendar-reports-47 | Offers-and-acceptance has no `Acceptance rate` column (accepted / answered, with hint), and no per-company `Expired` and `Waiting for the student` counts in the legacy words; no chart | MISSING-COLUMN | S3 | RV:60-66; INS:626-637 | `offers-acceptance/page.tsx:100-143` |
| TPO-calendar-reports-48 | Failure reasons lacks Round and Branch dimensions and `Share of the round` (%); vNext groups by outcome kind, reason and drive | MISSING-COLUMN | S2 | RV:71-76; INS:645-655 | `failure-reasons/page.tsx:90-139` |
| TPO-calendar-reports-49 | Recruiter engagement is per company (Contacts, Invited, Joined, Drives that ran, Students placed, "same numbers as Engage"); vNext `leads` report is per stage and source with no company rows and no drives/placed | MISSING-COLUMN | S2 | RV:77-81; INS:660-678 | `leads/page.tsx:120-189` |
| TPO-calendar-reports-50 | No saved filters (name, reapply, delete; per report, max 12) | MISSING-ACTION | S4 | RN:185-202; RF:1-45 | absent |
| TPO-calendar-reports-51 | No `Presentation view` (fullscreen review-room mode) | MISSING-ACTION | S4 | RN:71-84,162 | absent |
| TPO-calendar-reports-52 | Export model differs: legacy gives every report a CSV of all rows in the report's own column words named `<report>.csv` (BOM, CRLF) plus table export (Excel/CSV, shown rows, `report-<name>`); vNext `tpo-*.csv` section-style files, no Excel export of the shown table, BOM only confirmed on accreditation | MISSING-EXPORT | S3 | TF:120-133; RN:135 | RAPI:543-613 (BOM at :543 only). UNCONFIRMED CSV columns per kind beyond the first 120 lines of RAPI |
| TPO-calendar-reports-53 | No full-width state parity: legacy has stale-refresh Alert, `Retry`, "Refreshing report…", "Batch filter unavailable"; unknown slug shows "Unknown report"; vNext uses route error boundaries and framework 404 | STATE | S4 | RN:155-171,177-182 | `tpo/reports/error.tsx`, per-route `error.tsx` |
| TPO-calendar-reports-54 | Package statistics differ: legacy uses each student's best offer (unique students) in Packages, vNext CTC page counts accepted full-time offer records; legacy "Students with a package/Highest/Median/Average" row and bands vs vNext six cards and band table (vNext notes its own distinction) | MISSING-FIELD | S3 | INS:603-610,90-125 | `ctc/page.tsx:45-102` |
| TPO-calendar-reports-55 | Gallery has no snapshot-error alert ("The headline numbers could not be loaded." + Retry) | STATE | S4 | RI:61 | `reports/page.tsx` (server throw to boundary) |
| TPO-calendar-reports-56 | `Placed` definition: legacy uses the college's `countsAsPlacedAt` rule everywhere; vNext reads the rule but its visible methodology and cards say "currently accepted offer", risking contradictory numbers (UNCONFIRMED) | VALIDATION | S2 | INS:47-49,73-91 | RUI:137-141; `report-service.ts:82-123` |
| TPO-calendar-reports-57 | vNext requires a placement season; with none every report is an empty state, whereas legacy reported across all seasons when no `seasonId` is sent | STATE | S3 | RN:36,90; INS:530 | `placement-summary/page.tsx:95-100`, `by-branch/page.tsx:71-76` |
| TPO-calendar-reports-58 | `Recruiter engagement` report has no Engage cross-check numbers linked ("same numbers as Engage") and no company drill-down; vNext offers record links on other reports only | MISSING-ACTION | S4 | RM:11 | `leads/page.tsx` |

## 4. Intentional differences (improvements in vNext, or approved deviations)
- URL-driven calendar state (`date`, `view`, `company`, `kind`) with validation and a reset page; legacy keeps nothing in the address (`CAL-PAGE:35-44` vs `CAL:28-34`).
- Explicit IST handling: forms say "(IST)" and convert to `+05:30`; legacy stored UTC-without-offset via `serverTime()` (`tpo-calendar-followup-model.ts:13-26` vs `DJ:20-30`).
- Calendar company filter is a server-side substring search with escaped wildcards (any company, not only those in the loaded range) (`PCS:152-165`).
- Calendar shows completed rounds and done follow-ups with a status badge for history; legacy hides done follow-ups (PCS:294-297,562-588).
- Round scheduling from the calendar family (`/tpo/calendar/rounds`): create, reschedule, cancel with reason, optimistic `expectedUpdatedAt`, venue overlap check and permanent round history; legacy only links to the drive Rounds tab (CAL:23-24).
- `/tpo/calendar/interviews` readiness page with audited inline reschedule and `/tpo/placements/schedule-conflicts` venue-overlap audit (honest "cannot fully assess" list); legacy has no equivalent.
- `/tpo/calendar/export` rounds CSV (IST+UTC columns, 500 cap, NOTICE row, formula-safe); legacy has no calendar export.
- Reports: season and drive filters instead of free-text branch/company; gallery search and category filter with live count; per-company page with search/sort/paging, visible-rows CSV and company record links; record links on offers/joining reports; honest scope notes that avoid claiming a certified NAAC/NIRF template (`accreditation/page.tsx:100-150`); CTC page states that it counts offer records and that the summary uses the best offer; Leads report adds a 14-day outreach-health block; six extra reports (intelligence, branch-season, placed-branch, season-pipeline, offers-expiry, joining-followups).
- No decision file explicitly approves any of the above; they follow the phase-1 "no invented data" rules in the TPO parity notes (`docs/parity/tpo.md`, e.g. calendar W38 entry at line 465). Decision 13 (exact wording) in `docs/decisions/2026-10-14-orchestrator-defaults.md` still applies to the COPY gaps.

## 5. Test hooks
Existing automated coverage (names only, not re-run):
- Unit: `tests/unit/placement-calendar-model.test.ts`, `chat2-tpo-calendar-deep-link-validation.test.ts`, `chat2-tpo-calendar-persisted-access-contract.test.ts`, `tpo-calendar-export-model.test.ts`, `tpo-calendar-followup-model.test.ts`, `chat2-tpo-report-gallery-count.test.ts`, `chat2-tpo-report-gallery-group.test.ts`, `chat2-tpo-reports-gallery-order.test.ts`, `tpo-report-gallery-filter.test.ts`, `tpo-report-record-links.test.ts`, `tpo-company-report-*.test.ts`, `placement-report-model.test.ts`, `placement-report-accreditation.test.ts`, `placement-report-extras.test.ts`.
- Integration (DB): `tests/integration/tpo-calendar-followups.test.ts`, `tpo-calendar-export-denials.test.ts`, `placement-reports-service.test.ts`, `db09-tpo-report-record-links.test.ts`.
- None found for: blocked dates on the calendar, follow-up done from the calendar, batch/branch/company/mode/category report filters, per-student accreditation rows, outcomes report, unplaced columns.

Browser script needed (Playwright, `scripts/verify/pages/tpo-calendar-reports.mjs`, seeded local data, 1280px and 375px):
1. Calendar: load `/tpo/calendar`; switch week/month/agenda; navigate; filter company and type; verify URL state; create a follow-up (valid, invalid past time, no leads), reschedule it, check a done follow-up has no reschedule; verify behaviour with and without `DB09_TPO_API_READY`.
2. Calendar siblings: `/tpo/calendar/rounds` schedule/reschedule/cancel with conflict and stale `updatedAt`; `/tpo/calendar/interviews`; `/tpo/calendar/export` range limits and CSV parse (BOM, columns); `/tpo/placements/schedule-conflicts` windows.
3. Blocked date: add a blocked date in `/tpo/settings/blocked-dates`, confirm it should appear on the calendar and on round scheduling (currently expected to fail).
4. Reports: gallery search/category; each report with season/drive, empty season; download each CSV and parse headers; accreditation preflight; unplaced columns; confirm a college admin or recruiter cannot open `/tpo/reports` or `/api/placements/reports`.
5. Confirm UNCONFIRMED items: `DB09_TPO_API_READY` on dev, BOM on non-accreditation CSV, round-scheduled email/outbox on schedule, `countsAsPlacedAt` vs methodology text.
