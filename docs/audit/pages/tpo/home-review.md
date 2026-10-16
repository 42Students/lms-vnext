# TPO / Home: Round R review (adversarial re-audit)
Reviewed: 2026-10-16 by Claude Sonnet 5.5 (Phase 2 Round R, read-only, code only). Round A file: `docs/audit/pages/tpo/home.md` (opened only after the independent audit). Judged against CURRENT origin/main (609c3f372), which includes chat-9's TPO-home-03/11/12/14 fixes (commits e684042e4, 1a97dd384, dba5ae0da, d2c6d1bd1).

Legacy sources: `_hr-tpo-fe/src/pages/tpo/home.js`, `pages/tpo/index.js`, `components/tpo/home/homeRows.js`, `TpoTopBar.js`, `TpoBellPanel.jsx`, `TpoCommandPalette.jsx`, `ui/shortcuts.js`, `ui/ShortcutHelp.jsx`, `Sidebar.js`, `common/lists.js`; backend `TpoHubController.home` (L46-66) and `TpoInsightsService.home` (L278-410) at lms-dev-2026. vNext: `src/app/(authenticated)/tpo/{page,layout,home/page,find/page}.tsx`, `src/modules/placements/tpo-home-{next-up,legacy-rows,deadline-signals,request-action-model}.ts`, `tpo-operations-service.ts`, `src/components/tpo/tpo-bell-panel.tsx`, `tpo-find-shortcut.tsx`, `shell-model.ts`.

## 1. Summary
44 Round A gaps: 38 CONFIRMED (some only narrowed because main moved on: 04, 05, 08, 10), 5 WRONG against current main (03, 11, 12, 15, 16), 1 SEVERITY-CHANGE (14, S1 to S2), 8 MISSED (TPO-home-R01 to R08).
Discrepancy rate = (8 MISSED + 5 WRONG + 1 SEVERITY-CHANGE) / (44 + 8) = 14 / 52 = 26.9%.
Note: the Round A file was written before chat-9's fixes landed, so the WRONG verdicts mean "closed on main since", not bad analysis.

## 2. Round A gap verdicts
| Round A gap ID | verdict | note |
|---|---|---|
| TPO-home-01 | CONFIRMED | No date line, greeting or first name; `home/page.tsx` header is eyebrow "TPO", title "Home", invented description. |
| TPO-home-02 | CONFIRMED | No need-line (`needLine`, `homeRows.js:127-131`). |
| TPO-home-03 | WRONG (closed) | `buildTpoLegacyHomeRows` now renders the seven legacy rows in legacy order with legacy titles (`tpo-home-legacy-rows.ts`, `home/page.tsx`). Residual data gaps are in 04 to 10 and R02, R06. |
| TPO-home-04 | CONFIRMED (narrowed) | Row exists. `placed` is hard-coded `null` so ", N placed" never shows; eligible/registered are fetched for ONE batch only (uninvited-first); other batches pass null. Attention rule is R02. |
| TPO-home-05 | CONFIRMED (narrowed) | Row exists but status is "N live drive(s)" (legacy "N live"), never appends the first attention bit, and href is always `/tpo/placements` (legacy `/tpo/drives?tab=requests` when requests exist). Attention uses `jobsNeedingAttention`, not the legacy card set. |
| TPO-home-06 | CONFIRMED | `registered`/`placedUnique` passed as null; row shows invented "Open student roster". |
| TPO-home-07 | CONFIRMED | recruiterLeads, followUps, recruiterAccess all null; no "new accounts to approve"; attention never true. |
| TPO-home-08 | CONFIRMED (narrowed) | Requests half works (`getPendingTpoRequestsCount`); `messages: null`, so the recruiter-message (>1 day) half is missing. |
| TPO-home-09 | CONFIRMED | All team inputs null; TEAM_ASKS never raises Next up. |
| TPO-home-10 | CONFIRMED (narrowed) | Row now exists; its data differs, see R05. |
| TPO-home-11 | WRONG (closed) | `buildTpoLegacyNextUp` sorts by priority and uses the legacy per-type ACTION table (`tpo-home-next-up.ts`). Residual mislabels are R03. |
| TPO-home-12 | WRONG (closed) | "Invite the {batch} to register" / "{N} eligible students haven't registered; ..." / "Invite {N} students" -> `/tpo/batches/{id}` is implemented. Deliberate deviation: the card shows only when eligible > registered and the summary is complete; legacy shows it whenever a batch is un-invited (even "Invite 0 students"). vNext is saner, keep. |
| TPO-home-13 | CONFIRMED | `checklist:[]` is hard-coded in `home/page.tsx`; the fallback branch is dead code. |
| TPO-home-14 | SEVERITY-CHANGE S1 -> S2 | REGISTRATION_CLOSED, DEADLINE_TODAY (IST), CLOSING_SOON, NO_DEADLINE and REQUESTS now exist. Still absent: DRIVE_REQUESTS, RECRUITER_ACCESS, SHARE_APPLICANTS, SLOTS_TO_CONFIRM, SELECTIONS_TO_VERIFY, RECRUITER_MESSAGES, real FOLLOW_UPS, TEAM_ASKS, urgent REQUESTS (escalated, or round within 24 h). Each is reachable from its own page, so no workflow is blocked: S2. |
| TPO-home-15 | WRONG (closed) | `home/page.tsx` shows "Nothing is waiting on you." + "New requests, results and replies show up here first." exactly as legacy. |
| TPO-home-16 | WRONG (closed) | Title/text/button follow the legacy shape and strings ("Then N more thing(s) after this.", "That is the only thing waiting."). Remaining problems for work-queue items are R03. |
| TPO-home-17 | CONFIRMED | Dot is aria-hidden, no "Needs you" text, row is not one button, extra visible h2 "Your placement work". |
| TPO-home-18 | CONFIRMED | Single stacked column. |
| TPO-home-19 | CONFIRMED | Server render only; no visibilitychange refresh. |
| TPO-home-20 | CONFIRMED | `loading.tsx` is one line of text. |
| TPO-home-21 | CONFIRMED | `error.tsx` copy differs ("Unable to load TPO Home."). |
| TPO-home-22 | CONFIRMED | Absent; S4 right. |
| TPO-home-23 | CONFIRMED | The developer message "Batch attention is unavailable until its lifecycle migration is registered." is still printed. |
| TPO-home-24 | CONFIRMED | Duplicate "Pending placement requests" band still rendered. |
| TPO-home-25 | CONFIRMED (scope UNCONFIRMED) | Operations read is college-wide; legacy `team=false` filters on `owner_faculty_id`. vNext job table carries `createdByUserId` only (no faculty owner seen in `src/db/schema/placements*.ts`). See U1. |
| TPO-home-26 | CONFIRMED | No module-off handling in `tpo/layout.tsx` or the page. See U3. |
| TPO-home-27 | CONFIRMED (UNCONFIRMED) | `hasTpoTooling` needs the persisted TPO role; team-added faculty behaviour needs a live check (U4). |
| TPO-home-28 | CONFIRMED | `/tpo/find` is a full page with a submit button; no live search, recents or keyboard navigation. |
| TPO-home-29 | CONFIRMED | Placeholder and empty/no-match strings differ (`find/page.tsx`). |
| TPO-home-30 | CONFIRMED | `TPO_TOPBAR_QUICK_LINKS` order is Follow-up, Recruiter lead, Drive. |
| TPO-home-31 | CONFIRMED | "Follow-up" is a link to `/tpo/follow-ups`; no creation modal. That page is also gated by `DB09_TPO_API_READY` (U2). |
| TPO-home-32 | CONFIRMED | Static list. |
| TPO-home-33 | CONFIRMED | Plain "Messages" link, no unread badge. |
| TPO-home-34 | CONFIRMED | No polling. |
| TPO-home-35 | CONFIRMED | Bell item offers only an "Open record" link. |
| TPO-home-36 | CONFIRMED | 10 items (`layout.tsx` slice(0,10)), no date. |
| TPO-home-37 | CONFIRMED | Server snapshot, no on-open load. |
| TPO-home-38 | CONFIRMED | `window.confirm` is extra; S4 right. |
| TPO-home-39 | CONFIRMED | Not a dialog; no Esc or outside click. |
| TPO-home-40 | CONFIRMED | Not re-verified by me beyond Round A's evidence (U5). |
| TPO-home-41 | CONFIRMED | No `g`/`n`/`?` handler anywhere in `src` (search for "Keyboard shortcuts" and `resolveShortcut` is empty). |
| TPO-home-42 | CONFIRMED | No badge support in `src/components/shell`. |
| TPO-home-43 | CONFIRMED (UNCONFIRMED) | Not re-read by me either; verify live at phone width (U5). |
| TPO-home-44 | CONFIRMED | Tooling row lives in `tpo/layout.tsx` and is skipped when `!hasTpoTooling`. |

## 3. MISSED gaps
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-home-R01 | Sidebar "Verification" row is shown to every TPO. Legacy hides it unless `GET /tpo/verification-access` returns `canVerify` (college admin lets the placement cell verify profiles). Round A section 1.6 describes the rule but no gap row was raised. | PERMISSION | S2 | `Sidebar.js` `tpoCanVerify` state and the `.filter((m) => m.path !== "verification" || basePath !== "/tpo" || tpoCanVerify)` | `shell-model.ts:195` unconditional entry; no filter anywhere in `src/components/shell` |
| TPO-home-R02 | Placement-eligibility row attention rule differs: legacy flags attention if ANY batch in placements is not invited (`batches.some(!invitedAt)`) or no batch exists; vNext inspects only `batches.batches[0]`, so a first batch that is already invited (or finished) hides un-invited batches 2..n and only "+k more" hints at them. The Next-up invite card likewise considers only the first un-invited, not-finished batch and only when eligible > registered. | STATE | S2 | `homeRows.js:72,93` | `tpo-home-legacy-rows.ts` batches row `needsAttention:!batch||!batch.invited`; `home/page.tsx` (`firstBatch`, `uninvitedBatch`) |
| TPO-home-R03 | Next-up items from the vNext work queue are mislabelled and under-explained. (a) `OFFERS_AWAITING_RESPONSE` and `JOINING_OUTCOME_PENDING` are mapped to type `FOLLOW_UPS`, so the button says "See follow-ups" but links to a drive page. (b) `SCREENING_PENDING`, `DRIVE_NOT_SCHEDULED`, `EVALUATION_PLAN_MISSING`, `JOB_DRAFT` are invented types absent from the ACTION table, so the button says "Open". (c) Titles are bare "Company · Title" where legacy says what to do ("{round} results ready to apply for X (waiting N h)", "Verify N selections for X"). (d) Every DRAFT drive becomes a Next-up candidate (priority 30), so a college with one forgotten draft never reaches the setup checklist or the quiet state; legacy has no draft signal. | COPY | S2 | `homeRows.js:18-23`; `TpoInsightsService.java` card titles at ~L293-330 | `tpo-home-next-up.ts` `operationalHomeNeeds`; `tpo-operations-service.ts` (workQueue pushes, ~L466-520) |
| TPO-home-R04 | Priority ordering differs. Legacy: REGISTRATION_CLOSED 0, DEADLINE_TODAY 0, urgent REQUESTS 0, TEAM_ASKS 0 or 1, REQUESTS/NO_DEADLINE/CLOSING_SOON/SLOTS/RESULTS/SELECTIONS 1, DRIVE_REQUESTS/RECRUITER_ACCESS 2. vNext: invite 0, DEADLINE_TODAY 1, REQUESTS 5, work queue HIGH 10 / MEDIUM 20 / LOW 30, NO_DEADLINE 30, CLOSING_SOON 35. A closing-soon or no-deadline drive ranks below every work-queue item (legacy ranks them with requests), and the "Then N more" count therefore differs. Legacy also links NO_DEADLINE to `/tpo/drives/{id}/edit`; vNext links to the drive page. | STATE | S3 | `TpoInsightsService.java:288-368` (priority arguments) | `tpo-home-deadline-signals.ts` (priorities 1/30/35); `home/page.tsx` (REQUESTS priority 5); `tpo-home-next-up.ts` |
| TPO-home-R05 | "This week" row data is wrong. Legacy = calendar events in the next 7 days (rounds, talks, deadlines; DRAFT and PUBLISHED; follow-ups and blocked dates excluded), title "Company · Round", time "Today 10 AM" / "Tomorrow" / "Ddd 10:30 AM" (minutes dropped on the hour). vNext = every future SCHEDULED round with no 7-day cut-off, no deadlines or talks, title is only the round name (no company), "+k more" counts all future rounds, time formatted with `en-IN` ("10:00 am", lowercase) and never "Tomorrow". | MISSING-FIELD | S3 | `TpoInsightsService.java` `thisWeek` and `calendar()`; `homeRows.js:56-62,104` | `home/page.tsx` (`upcoming: operations.upcomingRounds.map`); `tpo-home-legacy-rows.ts` `showWhen`; `tpo-operations-service.ts` upcomingRounds |
| TPO-home-R06 | Fallback copy that legacy does not have (breaks exact-wording parity): Students "Open student roster", Engage "Open recruiter relationships", Inbox "Open requests and messages", Team "Open team", eligibility "{batch} · Registration summary unavailable", Engage "Follow-ups unavailable". Because the inputs are currently null, these strings are what users actually see. | COPY | S3 | `homeRows.js:96-102,121` | `tpo-home-legacy-rows.ts` (statuses for null inputs) |
| TPO-home-R07 | Finder result details differ beyond Round A 28/29: students link to `/tpo/students?search={name}` (legacy `?q={roll}&student={id}`, so the student drawer never opens); no roll-number/branch hint; drives have no status hint; no "Recently opened"; an extra "Batches" section; no 2-character minimum and no per-group cap of 5 (vNext shows up to 30). | MISSING-FIELD | S3 | `TpoCommandPalette.jsx:172-175` | `find/page.tsx` student and drive `<Link>` rows |
| TPO-home-R08 | Performance and failure isolation. Home awaits `listTpoBatches`, then `getPlacementTpoOperations` (loads the college's whole job/application/round/result/offer graph to derive three counts and a queue), then the requests count, then two batch summaries, serially; `tpo/layout.tsx` also runs `getTpoPersonalInbox` on every TPO page; the finder loads the same operations graph per search. Any single rejection replaces the whole page with `error.tsx`, whereas legacy uses one light call and keeps the page. | PERFORMANCE | S3 | `home.js:32-48` (single call) | `home/page.tsx`, `tpo-operations-service.ts`, `tpo/layout.tsx`, `find/page.tsx` |

## 4. WRONG / SEVERITY-CHANGE details
- TPO-home-03, 11, 12, 15, 16: commits e684042e4 (seven rows), 1a97dd384 (Next up), dba5ae0da (invite) and the clear-state copy are on main; the Round A "absent" evidence is stale. Track them as closed, with residuals R02, R03, R05, R06.
- TPO-home-14 S1 -> S2: five of the legacy signals are now computed; the rest surface on their owning pages (recruiters, settings, messages, team), so Home no longer blocks a workflow. Keep one S2 row for the eight missing cards and split by data source when fixing.

## 5. UNCONFIRMED items and how to confirm on the deployed dev site
- U1 (25, R04): ownership scope. Sign in as a TPO team member who does not own a drive and check whether DEADLINE_TODAY/CLOSING_SOON cards appear for drives created by someone else; compare with legacy `team=false`.
- U2 (31): `follow-ups/page.tsx` renders its queue only when `DB09_TPO_API_READY === "DB09_VERIFIED"`. Open `/tpo/follow-ups` on dev; confirm the queue is visible and find which page can create a follow-up (check `/tpo/recruiters/[id]`).
- U3 (26): switch the placements module off for a test college and open `/tpo/home`; confirm whether a clean "Placements is switched off for this college" page appears.
- U4 (27, 44): sign in as a faculty member added to the placement team; check the sidebar "Placement cell" row and whether `/tpo/home` opens.
- U5 (40, 43): at 375 px width check the TPO mobile navigation (legacy footer: Home, Engage, Drives, Students, More) and whether the global header shows a second Notifications link.
- U6 (R05): create a round for tomorrow and a drive with a deadline in 3 days; compare "This week" with legacy output.
- U7 (R07): confirm whether `findTpoPeopleAndCompanies` matches roll numbers (legacy empty-state hint says "21CS001").
