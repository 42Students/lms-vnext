# TPO / Students: Round R review (adversarial re-audit)
Reviewed: 2026-10-16 by Claude Sonnet 5.5 (Round R, code only). Round A file: `docs/audit/pages/tpo/students.md` (opened only after my own independent audit).

## 1. Summary
Round A gaps: 54. CONFIRMED 51 (one with a correction note), WRONG 0, SEVERITY-CHANGE 3, MISSED 8 (new IDs `TPO-students-R01` to `R08`).
Discrepancy rate = (8 MISSED + 0 WRONG + 3 SEVERITY-CHANGE) / (54 + 8) = 11 / 62 = 17.7%.
Round A is thorough on the legacy side (every action, filter, bulk step and the import carry file:line). My independent read agrees with it almost everywhere. What it missed is mostly on the vNext side (what the new page does wrongly or oddly), plus one population gap (finished-batch students).

Sources re-read: legacy FE `_hr-tpo-fe` (lms-dev-2026) `pages/tpo/students/index.js`, `components/tpo/students/{StudentsTop,StudentActions,studentGridRules,academics,outcomes}`, `StudentPanel.js`, `ImportPreviewModal.js`, `AddToDriveModal.jsx`, `ui/journeyRules.js`, `grid/GridWorkspace.jsx`, `bulk/BulkAction.jsx`, `tpoFiles.js`; legacy BE via `git show lms-dev-2026:` in `_hr-tpo-be` (`TpoStudentsHubController`, `TpoStudentsReadService`; the `_hr-tpo-be` checkout itself sits on `feat/tpo-v1-complete`, the `lms-dev-2026` ref is newer and is the one with the bulk endpoints); vNext `tpo/students/page.tsx`, `tpo-students-{service,model,csv,url-guard}.ts`, `tpo-students-spreadsheet.tsx`, `tpo-students-bulk-add.tsx`, `tpo-bulk-action-panel.tsx`, `tpo-spreadsheet-grid.tsx`, `tpo-grid-filter-panel.tsx`, `tpo-debar-control.tsx`, participation and history pages, `after-college/route.ts`.

## 2. Round A gaps: verdicts
| Round A gap ID | Verdict | Note |
|---|---|---|
| TPO-students-01 | CONFIRMED | See R01: vNext also hides students without an ACTIVE enrollment (finished batch), the opposite problem. |
| TPO-students-02 | CONFIRMED | Rows are plain text; only two per-row links. |
| TPO-students-03 | CONFIRMED | |
| TPO-students-04 | CONFIRMED | Legacy validation text: "Write the message first", "Keep the message under 1,000 characters" (bulkNudge). |
| TPO-students-05 | CONFIRMED | `after-college/route.ts` has no caller except settings (grep). |
| TPO-students-06 | CONFIRMED | `debarment-service.ts` is only imported by `application-service.ts` and `learner-job-service.ts`; no TPO UI. |
| TPO-students-07 | CONFIRMED | |
| TPO-students-08 | CONFIRMED | |
| TPO-students-09 | CONFIRMED | |
| TPO-students-10 | CONFIRMED | |
| TPO-students-11 | CONFIRMED | `placementTpoStudentNotes` only appears in the schema file. |
| TPO-students-12 | CONFIRMED | |
| TPO-students-13 | CONFIRMED | |
| TPO-students-14 | CONFIRMED | `window.confirm` and cap 100 verified in `tpo-students-bulk-add.tsx`. |
| TPO-students-15 | CONFIRMED | vNext side effects still UNCONFIRMED (section 5). |
| TPO-students-16 | CONFIRMED | |
| TPO-students-17 | CONFIRMED | See also R03 (two separate selection lists). |
| TPO-students-18 | CONFIRMED | |
| TPO-students-19 | CONFIRMED | See also R07 (vNext tile counts ignore filters). |
| TPO-students-20 | CONFIRMED | |
| TPO-students-21 | CONFIRMED | |
| TPO-students-22 | CONFIRMED | |
| TPO-students-23 | CONFIRMED | |
| TPO-students-24 | CONFIRMED | See also R04. |
| TPO-students-25 | SEVERITY-CHANGE | S2 to S3, see section 4. Behaviour confirmed (`tpo-students-url-guard.ts:5-8`). |
| TPO-students-26 | CONFIRMED | |
| TPO-students-27 | CONFIRMED | |
| TPO-students-28 | CONFIRMED (correction) | Round A says vNext shows "only a generic text". It shows round kind, sequence and outcome (for example "TECHNICAL INTERVIEW round 2: NOT_SELECTED", `tpo-students-model.ts:244-247`), never the company, and prints the raw enum (see R06). Stays S2. |
| TPO-students-29 | CONFIRMED | |
| TPO-students-30 | CONFIRMED | |
| TPO-students-31 | CONFIRMED | |
| TPO-students-32 | CONFIRMED | |
| TPO-students-33 | CONFIRMED | Legacy also caps a file at 5000 rows ("That file has more than 5000 rows. Split it and upload in parts.", `tpoFiles.js` readRowsFromFile) and accepts only .xlsx/.csv. |
| TPO-students-34 | CONFIRMED | |
| TPO-students-35 | CONFIRMED | `placement_tpo_saved_views` is only referenced in the schema. |
| TPO-students-36 | CONFIRMED | |
| TPO-students-37 | CONFIRMED | |
| TPO-students-38 | SEVERITY-CHANGE | S2 to S3, see section 4. |
| TPO-students-39 | CONFIRMED | |
| TPO-students-40 | CONFIRMED | |
| TPO-students-41 | CONFIRMED | |
| TPO-students-42 | SEVERITY-CHANGE | S2 to S3, see section 4. |
| TPO-students-43 | CONFIRMED | |
| TPO-students-44 | CONFIRMED | |
| TPO-students-45 | CONFIRMED | No drive link in `history/page.tsx` (grep). |
| TPO-students-46 | CONFIRMED | See also R05 for the extra developer-style text. |
| TPO-students-47 | CONFIRMED | |
| TPO-students-48 | CONFIRMED | |
| TPO-students-49 | CONFIRMED | Still UNCONFIRMED (section 5). |
| TPO-students-50 | CONFIRMED | Still UNCONFIRMED (section 5). |
| TPO-students-51 | CONFIRMED | |
| TPO-students-52 | CONFIRMED | Overlaps 02 and 43 (same missing panel). |
| TPO-students-53 | CONFIRMED | `ISSUED` / `ACCEPTED` seen at `tpo-students-model.ts:184-195`. |
| TPO-students-54 | CONFIRMED | Overlaps 05. |

False-gap check: I looked for things vNext already does that Round A called missing and found none. The two strongest candidates (13 and 28) are accurate apart from the correction on 28.

## 3. MISSED gaps
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-students-R01 | Students of a finished or completed batch cannot be reached at all. Legacy keeps them in the list, hides them by default and shows them (tagged "From <batch>") once the Batch selector picks that batch; used for NAAC/NIRF outcome follow-up. vNext lists only learners with an ACTIVE program enrollment, so anyone whose enrollment is no longer ACTIVE has no row, no count and no export. Round A 01 only says vNext "has no finished-batch rule", which understates it. UNCONFIRMED: which status graduation gives an enrollment | STATE | S2 | `studentGridRules.js:23,527-531`; `StudentsTop.jsx:44-52`; `index.js:121-122` | `tpo-students-service.ts:146-162,300-330` (join on enrollment status ACTIVE); unique index `learner_program_enrollments_active_membership_uq` (`academics.ts:303`) |
| TPO-students-R02 | Bulk add keeps its ticked ids when the roster page, filter or search changes. `TpoStudentsBulkAdd` has no `key` (its sibling `TpoBulkActionPanel` has one), so on a soft navigation its state survives; "N learner(s) selected" then counts hidden ids and "Review and add selected" fails with "The current-page selection or role is invalid. Review the roster." although the text promises the selection resets. UNCONFIRMED live | STATE | S3 | `GridWorkspace.jsx:475-487` (legacy auto-unticks hidden rows with a toast) | `page.tsx` (`TpoBulkActionPanel key=...`, `TpoStudentsBulkAdd` without key); `tpo-students-bulk-add.tsx:84-90,112-121` |
| TPO-students-R03 | Two separate, unconnected selection lists under the table (bulk actions panel, then Add to drive), each with its own checkboxes for the same rows; the table has no checkboxes and no "N selected" line, so a TPO ticks the same names twice to do two things. Legacy has one selection in the grid feeding one Act bar | STATE | S3 | `GridWorkspace.jsx:456-478`; `index.js:220-240` | `page.tsx` (`TpoBulkActionPanel` then `TpoStudentsBulkAdd`); `tpo-bulk-action-panel.tsx:92-107`; `tpo-students-bulk-add.tsx:171-193` |
| TPO-students-R04 | Duplicate, differently behaving filter controls: a GET form (Journey, Branch, Search, Page size, "Apply filters") AND the `TpoGridFilterPanel` aside with its own Journey and Branch selects that apply instantly through `router.replace`. Same filter twice, two interaction models, two clear links ("Clear filters" / "Clear grid filters") | STATE | S3 | `GridWorkspace.jsx:379-387,438` (one panel, one chips row) | `page.tsx` (form in the roster section); `tpo-students-spreadsheet.tsx:30-35`; `tpo-grid-filter-panel.tsx` |
| TPO-students-R05 | Builder-style text shown to the TPO: a permanent "Readiness unverified" badge, "Browser and legacy parity remain unverified.", "Provisional rate. An unavailable registration table produces no usable denominator", "registered in the database", "not available in the registered database". Round A 46/50 note the long description and the banner but not these | COPY | S3 | `index.js:248-253` (plain subtitle only) | `page.tsx` (Placement intelligence badge, Branch intelligence footnote, the two data-unavailable banners) |
| TPO-students-R06 | Raw enum text in the roster: Journey, Readiness and Participation cells print `value.replaceAll("_"," ")`, so the TPO sees "READY NOT APPLYING", "NEEDS READINESS SUPPORT", "ELIGIBLE"; Best so far prints "TECHNICAL INTERVIEW round 2: NOT_SELECTED". The tiles on the same page use human labels ("Ready, not applying"); the legacy grid shows tags like "Not registered" and "Not selected at Technical interview" | COPY | S3 | `studentGridRules.js:9-14,66`; `journeyRules.js:555-563`; `index.js:59-70` | `tpo-students-spreadsheet.tsx:20-23,28-29`; `tpo-students-model.ts:224-246`; `page.tsx` `JOURNEY_LABELS` (tiles only) |
| TPO-students-R07 | Journey tiles ignore the filters: the five tile counts and the three summary cards come from `summarizeTpoStudents(studentRows)` over the whole college, not the filtered set. Pick a Branch and the tiles still show college totals. Legacy strip follows Batch, Program, Department and Class and prints "Journey of the N students in <scope>" | STATE | S3 | `StudentsTop.jsx:101-126,131-134` | `tpo-students-service.ts:817` (summary over unfiltered rows; roster filtered at 821); `page.tsx` tiles |
| TPO-students-R08 | Repeated identical link names on every row ("Placement history", "Change participation") with no student name in the accessible name, so a screen-reader link list is unusable; the student name itself is not a link. Legacy name cell is a button that opens the panel | A11Y | S3 | `index.js:36-43` | `tpo-students-spreadsheet.tsx:36-39`; `tpo-spreadsheet-grid.tsx` (actions column) |

## 4. SEVERITY-CHANGE details
- TPO-students-25 (search and deep links) S2 to S3. Behaviour is as Round A says (unknown keys such as `?q=` and `?student=` give "Unsupported Students filter"). But vNext's own entry points (`/tpo/find`, journey tiles, branch drill) all use `?search=`, so nothing inside vNext breaks; only external bookmarks and old team-thread links do, and the `?student=` half is really TPO-students-02. A clearer error or a silent alias for `q` is a small fix.
- TPO-students-38 (Paste roll numbers) S2 to S3. A selection convenience; it only matters once TPO-students-17 and R03 give a real whole-view selection. It blocks no workflow today and a TPO can search by roll.
- TPO-students-42 (Requests tab per student) S2 to S3. vNext has the global requests queue with approve/reject and a name/roll search at `/tpo/students/requests`; only the per-student shortcut and the "N waiting" badge are missing. The decision workflow exists.
Not raised: 05, 06, 33 stay as rated (S1, S2, S1). I considered 06 (timed debarment) for S1, but the Ineligible-with-Debar-tag substitute exists, so S2 is fair.

## 5. UNCONFIRMED items and how to confirm (batch for the live check on the dev site)
1. R01: after a batch is marked finished or graduated, does its learners' enrollment leave ACTIVE? Check `learner_program_enrollments.status` values on dev, then open `/tpo/students` and search a graduated student; compare with the legacy Batch selector "(finished)".
2. R02: on `/tpo/students`, tick two learners in "Add selected students to a drive", click Next page (or change Branch), then read the "N learner(s) selected" line and the error after "Review and add selected".
3. R03 and R04: screenshot the lower half of the page at desktop and phone widths to judge the two lists and the double filter UI.
4. R06: load a student with a round result and read the Best so far and Journey cells.
5. R07: open `/tpo/students?branchId=<id>` and compare the tile numbers with the roster count.
6. Carried from Round A (unchanged): -15 (bulk add notifies the student, 48 h opt-out, bell), -49 (who else may reach the page: college admin, team members), -50 (registration derived from batch registrations vs legacy "any application = looking for a job"), and the audit line written by vNext bulk confirm.
7. Legacy BE note for the live check: in lms-dev-2026 `table()` is called with `department = null` in `TpoStudentsHubController` (no team department scope), unlike the older `feat/tpo-v1-complete` branch; confirm with a department-limited team member on the dev site.
