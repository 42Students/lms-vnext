# Round R review: TPO / Calendar and Reports (slug `calendar-reports`)

Reviewer: Claude Sonnet 5.5 (Round R, code only, 2026-10-16). Round A file: `docs/audit/pages/tpo/calendar-reports.md` (opened only after my own audit). Judged against CURRENT origin/main (includes chat-9 accreditation work: `d7ef7e5fb` per-student batch export, `f3fd945bf`/`8d67a7c5c`/`44ee67d44` counts-as-placed rule and internship exclusion).

## 1. Summary

Round A gaps: 53 (IDs 01-25 and 31-58; IDs 26-30 do not exist, a numbering gap only). Verdicts: CONFIRMED 48, WRONG 2, SEVERITY-CHANGE 3. MISSED (new): 8.
Discrepancy rate = (8 + 2 + 3) / (53 + 8) = 13 / 61 = 21.3%.

Round A is thorough on both pages; its weak spots are (a) three accreditation gaps made stale by chat-9, (b) the new per-student accreditation export it could not see, which carries its own defects (MISSED R01 to R05), and (c) a few unread corners (unplaced report internal ID, caps, server cost).

Legacy sources I re-read: `_hr-tpo-fe` `pages/tpo/calendar.js` (CAL), `WeekTimeGrid.jsx`, `ui/calendarGrid.js`, `FollowUpModal.jsx`, `pages/tpo/reports/index.js`, `reports/[name].js`, `reportViews.js`, `reportsMeta.js`, `accreditationPreflight.js`, `ui/reportFilters.js`, `tpoFiles.js`; backend (`lms-dev-2026`) `TpoHubController` (calendar, blocked-check, reports), `TpoInsightsService` (calendar, blockedDates, stats, report, placedStatuses), `TpoRecruiterLeadController`/`Service` (follow-up add/move/done). vNext: `tpo/calendar/*`, `placement-calendar-workspace.tsx`, `placement-calendar-service.ts`, `tpo-calendar-followup-*`, `api/placements/tpo/calendar/*`, `tpo/reports/*`, `placement-report-ui.tsx`, `api/placements/reports/route.ts`, `tpo-accreditation-students-*`.

## 2. Round A gap verdicts

All gap IDs are prefixed `TPO-calendar-reports-`.

| ID | Verdict | Note |
|---|---|---|
| 01 | CONFIRMED | `BLOCKED` event built from `placement_season.blocked_dates` (INS:483-491); vNext calendar service has no blocked source; `/tpo/settings/blocked-dates` has no consumer outside settings pages. |
| 02 | CONFIRMED | `blockedCheck` only used by drive `RoundsTab.js:112-115`; `tpo-round-calendar-service.ts` has no check. Note the drive-workspace owner may close it too. |
| 03 | CONFIRMED | |
| 04 | CONFIRMED | |
| 05 | CONFIRMED | Also see R07 (all leads loaded on every render, then sliced). |
| 06 | CONFIRMED | Done route exists (`api/placements/tpo/follow-ups/[followupId]/done`) but is not reachable from the calendar card. |
| 07 | CONFIRMED | |
| 08 | CONFIRMED | Legacy backend (`addFollowUp`, RLS:229) does not check past either; the check is client-side only in legacy. vNext has neither. Fix server-side. |
| 09 | CONFIRMED | |
| 10 | CONFIRMED | Legacy 90-day overdue lookback, blocked-day and 3-or-more busy-day lists (CAL:110-121). |
| 11 | CONFIRMED | |
| 12 | CONFIRMED | |
| 13 | CONFIRMED | |
| 14 | CONFIRMED | Default is `month` (workspace fallback), grid `min-w-[56rem]`. |
| 15 | CONFIRMED | Deadlines in vNext: `PUBLISHED`/`CLOSED` (service lines 372-380); legacy `PUBLISHED` only. |
| 16 | CONFIRMED | |
| 17 | CONFIRMED | |
| 18 | CONFIRMED | |
| 19 | SEVERITY-CHANGE | S3 to S2. Users see raw API codes (`Request failed: TPO_CRM_FOLLOWUP_ALREADY_DONE`, `DB09_MIGRATIONS_PENDING`); that is a workflow-visible error text, not a cosmetic wording gap, and Decision 13 (exact wording) applies. |
| 20 | CONFIRMED | Gate present in the calendar workspace, both calendar follow-up API routes and `/tpo/follow-ups`. Deployed value UNCONFIRMED (see section 5). |
| 21 | CONFIRMED | |
| 22 | CONFIRMED | |
| 23 | CONFIRMED | `tpo-round-calendar-service.ts` and `round-service.ts` contain no notification, outbox, email or audit call (grep empty). Still UNCONFIRMED whether another fan-out exists. |
| 24 | SEVERITY-CHANGE | S3 to S4. Legacy writes no audit for follow-ups either (RLS:229-258); it is an improvement request, not parity. |
| 25 | CONFIRMED | |
| 31 | CONFIRMED | Narrowed by chat-9: `accreditation` now has a Batch picker. Every other report still has season and drive only. |
| 32 | CONFIRMED | No `reports/outcomes`; the batch-per-student post-college outcomes table with counts is still absent from the gallery. |
| 33 | WRONG | Closed on main by `d7ef7e5fb`: `accreditation?batchId=` renders a per-student table (Name, Roll no., Programme, Branch, Batch, Employer, Package, Offers held, Offer status, Joining) and `/api/placements/reports?kind=accreditation-students` returns a per-student CSV with the 11 legacy headings. Residual defects are new gaps R01 to R05. |
| 34 | WRONG | Closed: the batch picker and the "NAAC 5.2.1 lists the students of one batch" prompt exist, and the export needs a batch. Residual: link not truly disabled and copy says "above" while picker is below (R05). |
| 35 | CONFIRMED | No per-field "missing for N", no "N of M students are missing data", no `Export anyway` gate. Only a static warning and a WARNING footer row (see R03). |
| 36 | CONFIRMED | |
| 37 | CONFIRMED | Factual slip: gallery has 14 cards of which 4 are extras (`placed-branch`, `season-pipeline`, `intelligence`, `offers-expiry`); `branch-season` and `joining-followups` are routes outside the gallery. Verdict unaffected. |
| 38 | CONFIRMED | |
| 39 | CONFIRMED | |
| 40 | CONFIRMED | |
| 41 | CONFIRMED | |
| 42 | CONFIRMED | Not re-verified page by page. |
| 43 | CONFIRMED | Also see R06: the one extra column vNext shows is the internal Membership ID. |
| 44 | CONFIRMED | |
| 45 | CONFIRMED | |
| 46 | CONFIRMED | |
| 47 | CONFIRMED | |
| 48 | CONFIRMED | |
| 49 | CONFIRMED | |
| 50 | CONFIRMED | |
| 51 | CONFIRMED | |
| 52 | CONFIRMED | Observed filenames: `tpo-*.csv`, `naac-5.2.1-students.csv`, `tpo-accreditation-evidence.csv` (route.ts:549,562,582-632). Legacy `<report>.csv`. |
| 53 | CONFIRMED | |
| 54 | CONFIRMED | |
| 55 | CONFIRMED | |
| 56 | SEVERITY-CHANGE | S2 to S3. Main metrics now honour `placement_college_rules.counts_as_placed_at` (`report-service.ts:86-123`, commits f3fd945bf, 8d67a7c5c). What remains is stale methodology text ("currently accepted offer", `placement-report-ui.tsx:138`) which now contradicts the numbers when the rule is OFFER_RELEASED (the default fallback). The accreditation student export still ignores the rule (R01). |
| 57 | CONFIRMED | |
| 58 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-calendar-reports-R01 | The per-student accreditation export counts only `ACCEPTED` offers and ignores the college `counts_as_placed_at` rule, so it can disagree with the headline "students placed" (which now honours the rule) and with the legacy list, which includes every offer in the placed statuses. A student who holds only a released offer is omitted from a NAAC list that the college counts as placed. | VALIDATION | S2 | INS:47-49,679-704 (`o.status IN placed`) | `tpo-accreditation-students-model.ts` (`accepted = group.filter(x=>x.status==="ACCEPTED")`; `offersHeld` = ACCEPTED+ISSUED); `tpo-accreditation-students-service.ts` (no rule lookup) |
| TPO-calendar-reports-R02 | Accreditation table and CSV show raw values: offer status as the code (`ACCEPTED`), joining as stored status, package as a bare rupee number under "Package (best offer)" with no unit (legacy: `Accepted`, `Joined`/`Not recorded`, `12 LPA`). Null joining prints a dash in the table and an empty cell in the CSV (legacy "Not recorded"). | COPY | S3 | RV:89-97 (`OFFER_STATUS`, `JOINING`, `lpa()`) | `accreditation/page.tsx` student table (`student.packageInr`, `offerStatus`, `joining`); `tpo-accreditation-students-model.ts` CSV mapping |
| TPO-calendar-reports-R03 | `naac-5.2.1-students.csv` ends with a `WARNING` pseudo-row inside the data. Anything that sorts, pivots, counts rows or imports the file (NAAC portal upload, Excel table) counts it as a student. Legacy keeps the caution in a confirm dialog, not in the file. | SIDE-EFFECT | S3 | AP:1-7; RN:136-153 (warning in modal, file is clean) | `tpo-accreditation-students-model.ts` `accreditationStudentCsv` (WARNING row appended) |
| TPO-calendar-reports-R04 | `Employer contact` is always empty by design (hard-coded `employerContact:null`), so one of the seven NAAC fields is blank for every student, and the table drops the column entirely. Legacy fills it from the recruiter's contact mail or the matching recruiter lead email. A decision is needed: derive it from the TPO lead or recruiter record linked to the company relationship, or keep blank and say so in the table. | MISSING-FIELD | S3 | INS:679-690 (`COALESCE(h.contact_mail, tl.email_norm)`) | `tpo-accreditation-students-model.ts` (`employerContact:null`); service comment "no vetted employer contact"; page table omits the column |
| TPO-calendar-reports-R05 | Accreditation page states and copy: with no batch the primary `Export student list CSV` stays a normal enabled button pointing to `#accreditation-batch` (`aria-disabled` does not stop the click, and nothing explains it); with a batch but zero rows the export is still enabled (legacy disables when no rows); the student preview silently stops at 50 rows with no "showing 50 of N" note (the overview table has one); the prompt says "Pick the batch above" but the picker is below it. | STATE | S4 | RN:253,280 (`disabled={rows.length===0}`) | `accreditation/page.tsx` header action, `slice(0,50)` student rows, status line above the form |
| TPO-calendar-reports-R06 | Unplaced report shows and exports the internal `Membership ID` (a UUID) as its third column. Legacy hides every `id`/`*Id` field from screen and file ("Internal ids mean nothing to a reader", RN:139) and shows Roll no. instead. Beyond the S2 missing columns (Round A 43), the ID is noise in a file a TPO forwards. | COPY | S3 | RN:136-139,248; RV:52 | `unplaced/page.tsx` headings `["Student","Branch","Membership ID"]`; `api/placements/reports/route.ts:260-268` `unplacedCsv` |
| TPO-calendar-reports-R07 | Every `/tpo/calendar` render loads all recruiter leads (`listTpoLeads`) when the DB09 gate is on, only to slice the first 100 for the picker. Cost grows with the lead book and is paid on every view/filter change. Pair with Round A 05 (search-as-you-type fix removes it). | PERFORMANCE | S4 | FUM:55-71 (query on demand, 2+ chars) | `placement-calendar-workspace.tsx:524-533` |
| TPO-calendar-reports-R08 | `/tpo/calendar/rounds` and `/tpo/calendar/interviews` cap at 200 rounds with only a notice, no search, filter or paging. A college with more than 200 rounds cannot reach the rest to schedule, reschedule or cancel from the calendar; the export caps at 500. Legacy never caps (events by date range). | PERFORMANCE | S3 | INS:454-494 (range query, no cap) | `tpo/calendar/rounds/page.tsx` ("Only the first 200 rounds were loaded"); `interviews/page.tsx` (200 cap note); `calendar/export/page.tsx` (500) |

## 4. WRONG and SEVERITY-CHANGE details

- 33 (WRONG): at the time of the Round A write-up the page was an aggregate worksheet; main now has `getTpoAccreditationStudentExport` (batch scoped, one row per placed student, best offer by CTC, deterministic order, formula-safe CSV via `placementReportCsv`). The 11 legacy headings are all present. Not a gap any more; defects are R01 to R05.
- 34 (WRONG): batch is selectable, `batchId` is validated against the college (`Choose a batch from this college.`), export link carries `batchId`. Residual behaviour is R05.
- 19 (S3 to S2): raw error codes shown to users on the only write paths of the page; combined with the DB09 gate (20) a TPO sees `DB09_MIGRATIONS_PENDING` style text.
- 24 (S3 to S4): not a parity item; legacy has no audit either.
- 56 (S2 to S3): computation fixed, text stale. Keep as COPY/VALIDATION on the methodology paragraph; fix with the 36/38 wording pass.

False gaps checked: none of the Round A "absent" claims about done/blocked/week-grid/outcomes/unplaced columns/filters are contradicted by current main. Round A section 4 "intentional differences" are accurate (company substring search, URL state, IST handling). One more intentional improvement worth recording: `by-company` groups by company entity, whereas legacy merges "Infosys"/"Infosys Ltd" by a key (INS:560-570); vNext needs no merging because companies are entities.

## 5. UNCONFIRMED (batch for the live check on dev)

1. `DB09_TPO_API_READY` value on dev (Round A 20, my R07): open `/tpo/calendar`; if the "Calendar follow-up editing is unavailable" text shows, writes are off. Also `/tpo/follow-ups`.
2. Joining value shape in the accreditation table/CSV (R02): add a batch with a joined offer; check whether the cell reads `JOINED` or a word.
3. Does a completed export contain exactly one `WARNING` row at the end (R03): download `naac-5.2.1-students.csv` and open in a text editor.
4. Employer contact: confirm whether `placement_tpo_leads` email or a recruiter-company link can supply it (R04) before deciding.
5. `#round-<id>` deep link from a calendar card: open a round event and check that `/tpo/placements/jobs/<id>` scrolls to the round (legacy opens `/tpo/drives/<id>?tab=rounds`).
6. Round scheduled/reminder emails (Round A 23): schedule a round on dev, then check outbox and learner inbox.
7. Failure-reasons: legacy counts `ABSENT` as "Absent (no-show)" with a share of round; confirm vNext's persisted failure kinds include no-show (not found in `report-extra*`).
8. Counts-as-placed rule (56, R01): set rule to `OFFER_RELEASED` and compare gallery "Students placed", by-branch, unplaced and the accreditation student list for the same batch.
9. Whether Round A 42 (headline strip missing on CTC, unplaced, offers, joining, failure, leads) holds on each page.
10. Whether `/tpo/reports/*` pages should require the persisted-membership check that `/tpo/calendar` got in `29d6770f2` (reports redirect on role only; the service enforces `placements.manage`).
