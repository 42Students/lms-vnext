# Verified TPO prototype ZIP — acceptance evidence ledger

Source: user-uploaded `42LMS pages prototype-png-tpo(1).zip`. Archive SHA-256: `0bfb8ffa1e8f69e28324000850fc5e248bf9b360c44235afbc438bfb7869fe84`.

The archive has exactly **33 PNG entries**. Names below are decoded for legibility from legacy mojibake encoding; the truncated per-entry SHA-256 prefixes identify the corresponding actual PNG bytes. **Listing a PNG does not mean visually opening or accepting it.** This replaces acceptance assumptions made from unrelated/generated images.

| # | Original PNG entry | PNG SHA-256 prefix | Image visually inspected? | Prototype acceptance |
|---:|---|---|---|---|
| 01 | Companies › Today.png | `a05f03b37437` | Yes | Open |
| 02 | Companies › Recruiters.png | `6e98580fcef9` | Yes | Open |
| 03 | Companies › Companies.png | `1625f246f3b7` | No | Open |
| 04 | Agenda.png | `c2141f21471f` | No | Open |
| 05 | Brief.png | `f30770b9601d` | No | Open |
| 06 | EmailSent.png | `4e149e85c7d3` | No | Open |
| 07 | Companies › Emails (a sent email open).png | `a9779118e975` | No | Open |
| 08 | Companies › Emails (writing a new email).png | `5ea6df74973e` | No | Open |
| 09 | Companies › Messages.png | `88ad8f13d2ef` | No | Open |
| 10 | Students › All students.png | `41cbb709abc4` | No | Open |
| 11 | Students › Who’s in placements.png | `420fadf229d6` | No | Open |
| 12 | Students › To verify.png | `034ab1edaed9` | No | Open |
| 13 | Students › Requests.png | `cd08dd37423b` | No | Open |
| 14 | Students › Announcements.png | `4ae17a7de616` | No | Open |
| 15 | Drives.png | `c0c53ad75502` | No | Open |
| 16 | Drives › A recruiter’s drive request.png | `c9b273e210fe` | No | Open |
| 17 | Drives › New drive (and edit).png | `f3a08d2716a2` | No | Open |
| 18 | Drive › Students (review one by one, share with company).png | `fa5858818245` | No | Open |
| 19 | Drive › Rounds (results, slots).png | `45610502dbb9` | No | Open |
| 20 | Drive › Offers.png | `7c72b4402fc8` | No | Open |
| 21 | Drive day (at the gate).png | `42077d978c1d` | No | Open |
| 22 | Drive › Talk (recruiter, change requests, team).png | `458937985d38` | No | Open |
| 23 | Drive › About.png | `7e3aaa257b42` | No | Open |
| 24 | Home.png | `42bd09911e33` | No | Open |
| 25 | Calendar.png | `c3ff3b0a71c4` | No | Open |
| 26 | Team › Chat.png | `319c83cb6b77` | No | Open |
| 27 | Team › People.png | `c5dd75a88252` | No | Open |
| 28 | Reports.png | `0b2fd59f6521` | No | Open |
| 29 | Reports › One report.png | `d2a869fa1ca4` | No | Open |
| 30 | Settings.png | `f0343ccfcbef` | No | Open |
| 31 | Settings › Audit log.png | `728c6ec39352` | No | Open |
| 32 | Everywhere search, bell, notifications, profile.png | `3d8e49f8ac34` | No | Open |
| 33 | Companies › One recruiter (full page).png | `b42a2c98a07d` | No | Open |

## Screen 01 — Companies › Today (source image visually inspected)

Original PNG dimensions: **2880 × 1912**. Verified design: fixed left role navigation; Companies section tab strip; a compact two-column master/detail focus workspace; 7 weekday/date/count cells; six screenshot-sample tasks in a left list; selected recruiter panel with company-verification/trust warning, factual checklist, Call/Email/Open page, Verify Company/Open recruiter, Tomorrow, Later & next, keyboard shortcuts and context cards. Sample company names/counts/dates in the PNG are **design fixture content, not vNext production data**.

### Functional reference

Old LMS `42Students/lms@lms-dev-2026`:
- `src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java`: recruiter stages are derived from persisted facts rather than guessed from appearance.
- `src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java`: follow-up create/move/complete and concurrency requirements.
- `src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java` and `src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java`: college-scoped company trust is an explicit mutation, separate from recruiter contact tasks.

Current vNext:
- `src/app/(authenticated)/tpo/companies/today/page.tsx`: college-only CRM and inbox reads.
- `src/components/tpo/tpo-companies-today.tsx` and `tpo-companies-today.module.css`: prototype queue/date/detail first-pass alignment.
- `src/modules/placements/tpo-followup-queue-service.ts`: authorized, atomic, concurrency-checked Tomorrow/Done workflow.
- `src/modules/placements/tpo-company-trust-service.ts`: college-scoped trust confirmation and audit.

### Changes made for screen 01

Commits: `c08bc5ff2f2f6e4fa94e6e8732fb131dfa297244`, `827c8a179278825ba08270ab45349d11886c1860`, `cb3aa832e29d1888d58f6e0264bd395fa545d9e7`, `e0dfcd45446a1ace9e511f91b6ed96209ca2eb06`, `01cdca04419898fb89047ac0fe63dc287194dc56`, `12ac7f7f03a5753de578dfc964eb928c97f66512`.

Changes: move strong outcome-taking workflow into an accessible advanced disclosure; add source-backed lead title, stage, owner and sanitized email contact; align selected recruiter panel, count cells and in-queue persisted recruiter replies; keep recruiter pages and messages live-linked; "Later & next" only advances UI selection **without modifying or falsely snoozing** the previous due follow-up, and explains this to the operator.

### Still open — do not claim page 01 accepted

1. Prototype has a genuine **new company verification/trust task** and other non-follow-up task types; current queue still primarily lists persisted CRM follow-ups and a limited inbox preview. A company trust decision needs verified relationship lookup and authorization, never inferred from a recruiter note.
2. Today feed paginates (50 ranked follow-ups; limited inbox preview), so a complete count and exact sample ordering cannot be claimed.
3. Full real-data browser interaction test, failure cases, and same-viewport screenshot diff have **not been run/accepted**.
4. Screen 01 remains **partially implemented, visual acceptance open** until task-kind completeness and interactive acceptance are established.
5. TPO render tests in `tests/unit/tpo-today-prototype-views.test.ts` were committed but CI outcome must be checked on the exact containing SHA.

## Screen 02 — Companies › Recruiters (source image visually inspected)

Original PNG dimensions: **2880 × 2264**. The image shows a visible Recruiters heading and Add recruiter lead/Invite/Import actions; **eight mutually exclusive pipeline-count cells** (Everyone, Not contacted, In touch, Invited, Joined, Drive planned, Hired from you, Paused); a compact filterable table with Recruiter, Company, Where you are, Next step, Last contact, Handled by; and a right selected-recruiter pane with Next step, Log activity/Call/Email, How they joined, Last time, Company and Handled by. Screenshot data and names are design fixtures only.

### Current and legacy references

- Legacy: `42Students/lms@lms-dev-2026` `src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java` and `TpoRecruiterLeadService.java`. Recruiter stages are computed from saved activities/grants/jobs/offers; no display-only promotion of an unverified lead.
- vNext: `src/app/(authenticated)/tpo/recruiters/page.tsx`; `src/components/tpo/recruiter-leads-workspace.tsx`; `src/components/tpo/recruiter-prototype-inspector.tsx`; `src/modules/placements/tpo-recruiter-attention-model.ts`.
- The screenshot's right inspector was partly present before recovery, but its Next step previously used a generic due/planned label.

### Changes committed for screen 02

- `4022b4d7bc572c09b9fada600a438d370285e303`: create `recruiter-prototype-stage-ribbon.tsx`, eight real college-scoped stage counts with accessible interactive tabs.
- `1eeab47bb2cf548f0fede1935217835ee4540044`: wire stage summary to existing `updateFilter("stage",value)`; retains existing spreadsheet, advanced filters, exports, opt-out rules, bulk operations and contact inspector.
- `b20991e61b5bb7790a97712eadefd178e249ed29` and `9bb2e9bb5a6142fb947241429c9af8114e3615f6`: compute urgency by local IST date and display factual overdue days in selected inspector; no fabricated note, source or company trust status.
- `517492f6d98ae94472c48ce1166259b9984dd84d` and `58d675343ab64295495c001c6dd4bbc991babd79`: add stage strip rendered tests, authorization source guard, IST boundary regression cases.

### Still open — screen 02 not accepted

- Prototype has a compact six-column default table; vNext currently exposes a larger configurable CRM grid with additional controls. Exact visible layout/column order and header title need another same-viewport review without discarding stronger features.
- "How they joined", detailed last conversation, and the screenshot company-history summary need verified source-specific data wiring. The inspector must not fabricate recruiter event notes, join method, placements or a college trust decision.
- Browser selection/filter/close, keyboard, responsive and screenshot comparisons remain open. Screen 02 implementation **partial** until these pass.

## Evidence accounting

- Actual PNG ZIP entries inventoried: **33/33**
- Original PNGs visually opened in this recovery pass: **2/33**
- Code-complete screens established by this recovery pass: **not established**
- Browser-accepted screens established by this recovery pass: **0/33**
- Visually accepted screens established by this recovery pass: **0/33**
- Screens 01 and 02 both have evidence-backed partial implementation; remaining source screenshots are not yet visually inspected and no screen is fully accepted.
