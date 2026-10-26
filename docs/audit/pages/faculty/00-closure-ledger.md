# Faculty vNext — single closure ledger

## LIVE FOCUSED ACCEPTANCE REGISTER — 27 October 2026

**Counting policy:** "GREEN-FOCUSED" means a dedicated authenticated browser/DB/unit workflow ran successfully on a commit including the applicable screen source; it does **not** certify all code acceptance gates, global build, merged legacy feature parity, external migration readiness or pixel matching. Keep "ACCEPTED-CODE" separately until every required negative and functional gate is closed. A red global CI from other accounts is reported independently rather than silently deleting tests.

| Prototype | Focused witness | Evidence link | Residual code gate |
| --- | --- | --- | --- |
| #02 Today | **GREEN-FOCUSED** | [40394512630](https://github.com/42Students/lms-vnext/actions/runs/40394512630) | account-level final integration/regression |
| #03 Courses | **VERIFYING** | [40394520458](https://github.com/42Students/lms-vnext/actions/runs/40394520458) | newest Course directory browser run |
| #04 Overview | **GREEN-FOCUSED** | [40394978075](https://github.com/42Students/lms-vnext/actions/runs/40394978075) | full account-wide regression |
| #05 Blueprint | **GREEN-FOCUSED** | [40394477603](https://github.com/42Students/lms-vnext/actions/runs/40394477603) | DB05 server read/write scope and activation remain fail-closed |
| #06 Students | **GREEN-FOCUSED** | [40394531043](https://github.com/42Students/lms-vnext/actions/runs/40394531043) | broader intermittent-progress and integrated signals |
| #07 Attendance | **GREEN-FOCUSED** | [40387070834](https://github.com/42Students/lms-vnext/actions/runs/40387070834) | account-wide regression/legacy checks |
| #08 Discussions | **GREEN-FOCUSED** | [40394452864](https://github.com/42Students/lms-vnext/actions/runs/40394452864) | Learner shared-component and deeper cross-tenant history |
| #09 Assessments | **VERIFYING** | [40394462989](https://github.com/42Students/lms-vnext/actions/runs/40394462989) | advanced All Assignments/All Quizzes parity before redirects |
| #10 Grading | **VERIFYING** | [40394468740](https://github.com/42Students/lms-vnext/actions/runs/40394468740) | publish/save/conflict/grade-and-next DB negative coverage |
| #11 Assignment Report | **GREEN-FOCUSED** | [40388424119](https://github.com/42Students/lms-vnext/actions/runs/40388424119) | final integration across reporting destinations |
| #12 Class Schedule | **GREEN-FOCUSED** | [40394414616](https://github.com/42Students/lms-vnext/actions/runs/40394414616) | verify authorized calendar service against shared route updates |
| #13 Find/Bell/Profile | **VERIFYING** | [40395216104](https://github.com/42Students/lms-vnext/actions/runs/40395216104) | Ctrl/Cmd+K hydration focus + scoped notifications |

**Verified at writing:** eight GREEN-FOCUSED / twelve prototype references. Other four were still under focused verification, **not** green at writing. The 25 additional functional screens and 5 compatibility redirect contracts remain in [01-canonical-page-inventory.md](01-canonical-page-inventory.md) and are not counted as automatically passed because a prototype parent is green.

**Global CI:** `npm run typecheck` still fails in TPO selected-rounds `name: string|null` versus `SelectedSlots` contract, and other separate lint/unit/build failures exist. Dedicated Faculty workflow green is not a claim of globally green `main`. Exact screenshot rendering comparison is deliberately deferred.

---

## CURRENT CODE IMPLEMENTATION / TEST GATES — 27 October 2026 (supersedes older status descriptions)

**Route inventory is frozen** at [01-canonical-page-inventory.md](01-canonical-page-inventory.md). Work below is real code committed directly to main, not merely design notes; **a focused test pass and a globally green workflow are separate outcomes**.

| Screen | Latest code change | Focused verification | Acceptance limitation |
| --- | --- | --- | --- |
| #05 Blueprint | [a5866ae](https://github.com/42Students/lms-vnext/commit/a5866ae4eb6456191805079fb7c4d0af1c0c6905) preserves Section-authoritative content order across assessment slots and resets stale local snapshots | [40384839745](https://github.com/42Students/lms-vnext/actions/runs/40384839745): **21/21 targeted unit tests and authenticated browser pass**, workflow red in unrelated TPO TS2322 | DB05 stage unverified; content-write snapshot/permission scope still needs adversarial DB05 resolution; visuals deferred |
| #06 Students | [2bc7a5f](https://github.com/42Students/lms-vnext/commit/2bc7a5f62009c9109ab249d953b54938e2b360a3): unavailable/no-denominator Behind filter is disabled; fake behind rows prevented | [40385171351](https://github.com/42Students/lms-vnext/actions/runs/40385171351): prototype + retained desktop/mobile privacy browser **passed**; global TypeScript gate red in unrelated TPO | global CI and broader error-state acceptance open; visuals deferred |
| #07 Attendance | [75588fd](https://github.com/42Students/lms-vnext/commit/75588fd94851f577f0b1abd95ef98781a818600a), [2d0bb1e](https://github.com/42Students/lms-vnext/commit/2d0bb1e1e77a63b5857dd3c012543044ee48db1c), [0c9d402](https://github.com/42Students/lms-vnext/commit/0c9d40299256b68a70956dc7af69c6e5367c82c2): unknown-save locks, month empty state, confirmed correction becomes clean snapshot | [40386744605](https://github.com/42Students/lms-vnext/actions/runs/40386744605): **all browser, DB integration and model tests passed** on 2d0bb1e; [40387070834](https://github.com/42Students/lms-vnext/actions/runs/40387070834) is newer post-0c9d402 validation | newest advanced failure-handling code needs post-change browser; visuals deferred |
| #08 Discussions | [137e427](https://github.com/42Students/lms-vnext/commit/137e42727f87a0dd866222a6c79111f73041ebdf): uncertain POST locks send until readback, retains draft; fault-injected browser test | [40386236966](https://github.com/42Students/lms-vnext/actions/runs/40386236966): focused recovery unit passed; browser not yet established at recording | compatibility with Learner sharing component and browser acceptance still pending; visuals deferred |
| #09 Assignments & Quizzes | [ff8f98a](https://github.com/42Students/lms-vnext/commit/ff8f98aaed6bab1fde4c5dc144997360202534f0) adds deep-linked All/Assignments/Quizzes; [db84281](https://github.com/42Students/lms-vnext/commit/db8428132c45d0fbd8afa9bf46d76a1ea630cd95) fixes duplicate course-code cross-Section filter | [40381543032](https://github.com/42Students/lms-vnext/actions/runs/40381543032): focused browser passed on ff8f; [40387287192](https://github.com/42Students/lms-vnext/actions/runs/40387287192): newest Section filter unit passed, browser pending | keep old full editing/lifecycle pages until full feature parity proven; global TPO TS failing; visuals deferred |

**External cross-account blocker:** `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx:76` TS2322 remains the shared `npm run typecheck` failure. Do not present red global CI as accepted or modify another lane's owned TPO page from this Faculty workstream.

**Product policy / deploy exceptions:** Faculty cannot rename College Admin-owned shared syllabus or add shared lessons. `DB05_CONTENT_ORDER_READY=DB05_VERIFIED` remains fail-closed unless migrations verified. Audit that `listLessonContents` Faculty authorship filtering and ordering-service full visible-content set agree **before** activating DB05. Do not convert historical All Assignments/All Quizzes URLs to redirects before advanced functionality is reachable through `/teacher/assessments`.

**Code gate next:** complete #05 DB05/permissions exception classification; finish newer #07/#08/#09 focused results, then #10 grading and secondary specialized routes. Continue one screen at a time through #13 and regress #02–#04. All 12 prototype references and 25 secondary screens remain inside the acceptance inventory; **pixel review is deferred**.

---

## CANONICAL PRODUCT PAGE INVENTORY — 27 October 2026

**Decision:** The newest Faculty prototype defines the primary user experience and design, **not** an instruction to remove distinct vNext features. The complete [canonical screen and route disposition](01-canonical-page-inventory.md) now classifies the 12 original Faculty screenshot references, 25 additional rendered Faculty routes and 5 compatibility redirects. The 12 references include one shared-shell interaction screenshot, so screenshot count and Next.js route count are different.

**Safe consolidation rule:** `/teacher/assessments` is the canonical Assignments & Quizzes directory. `/teacher/allAssignments` and `/teacher/allQuizzes` are **candidates for future compatibility redirects only after full review/edit/publication/results functionality and existing deep-link behavior are demonstrated in the combined destination**. Do not remove or redirect them prematurely. Faculty Profile vs About & Details is likewise conditional on form and deep-link parity. Manage builders, reports, gradebooks, submissions and other specialized tools remain functional secondary routes unless independently proved redundant.

**Acceptance order:** #05 Blueprint current-code closure → #06–#13 source, authorization, mutation and browser acceptance → current-SHA regress #02–#04 → merge proven duplicates with independent regression → all 25 distinct secondary routes + 5 redirect contract checks → independent visual comparison LAST. Completion of a prototype page is not completion of its associated secondary route.

## CURRENT CODE PHASE — 26 October 2026 (newest state; supersedes stale descriptions below)

**User decision:** Finish Faculty CODE and functional behavior first. Pixel-level visual checking is deferred, not passed.

**Active screen #05 Blueprint.** Source commits:
- [5544f45](https://github.com/42Students/lms-vnext/commit/5544f45fc366d6a63f79c15357de30e16f25b605) opens real Resource / YouTube / Live / Video forms and video upload.
- [a415234](https://github.com/42Students/lms-vnext/commit/a415234c2c6f59eadc6eea9c4af696ea185e1059) validates requested lesson for Assignment and Quiz and expands browser coverage to all six destinations.
- [9e2c689](https://github.com/42Students/lms-vnext/commit/9e2c68995e1b4ae0aac277caef4538f9b2d901a9) handles ambiguous order/archive writes and focuses the requested form.
- [4ea7cf1](https://github.com/42Students/lms-vnext/commit/4ea7cf15882f5602b52710fc8542982e6c9056e0) plus [e3cea6b](https://github.com/42Students/lms-vnext/commit/e3cea6b61ecf5842dbb6f4889fa83e9a14b5e00d) calculate real lesson activity for the authorized roster; absent average time/resource-open telemetry is never invented.
- [ee9de9e](https://github.com/42Students/lms-vnext/commit/ee9de9e1ed6b86f89eff04ebe86399984248d00c) repairs the dedicated acceptance workflow to run focused unit and browser gates before global TypeScript.

**Confirmed focused evidence:** [Blueprint run 40345554751](https://github.com/42Students/lms-vnext/actions/runs/40345554751) at ee9de9e completed **5 passing Vitest files, 17 unit tests and the authenticated desktop/mobile Playwright test**. Its final overall status is failed because unrelated TPO rounds/page.tsx:76 produces TypeScript TS2322. This run predates the later engagement implementation and must be refreshed.

**Still open:** post-engagement current-SHA test acceptance, DB05_CONTENT_ORDER_READY=DB05_VERIFIED prerequisite to live persisted reorder, Faculty syllabus editing permission deliberately disabled for College Admin-owned structure, unknown-outcome/multiscope browser edge proof, and separate visual signoff. **Do not mark #05 fully code-accepted yet.**

---

**Scope and design authority:** original uploaded `42LMS pages prototype-png-faculty.zip`. Use **only** the 12 Faculty screenshots numbered **#02–#13**; #01 is TPO. Legacy behavior authority is `docs/legacy-source/frontend` and existing vNext domain services. Preserve better, secure, authorization-checked vNext workflows. All work is committed directly on `main` with current blob SHAs, and other lanes may change `main` between checks.

**Continuing in a fresh chat?** Start with [NEXT-CHAT-HANDOFF.md](NEXT-CHAT-HANDOFF.md), then the [#05 Blueprint action audit](screen-05-action-audit.md). The handoff includes original image locations, current code, acceptance caveats and the first exact fixes to implement.\n\nThis ledger is the **single entry point** for the Faculty work. Detailed page evidence can live in `docs/audit/pages/faculty/*` and the relevant tests/workflows, but completion status is updated **here only after evidence**.

## One-page-at-a-time policy

1. **Open the uploaded screenshot.** Write down every section, row, button, badge, empty state, and click path, not hypothetical imagery.
2. **Read vNext and old LMS code** for this screen. Record what differs and what vNext already does better.
3. **Make only this page's concrete changes.** Keep ownership and cross-account files isolated. Never make screenshot sample learner counts or statuses into fake production data.
4. **Test the behavior against a disposable DB:** unit contracts, real authenticated desktop/mobile browser flows, and authorization/failed-request paths. If an unrelated lane breaks repo-wide TypeScript, record the external blocker and still run the page browser test independently, without mislabeling the whole workflow green.
5. **Record evidence (commit + run URL), limitations and next action.** A page is **functional accepted** only with relevant passing tests after the last page-affecting change. **Visual signed off** requires a captured rendered desktop/mobile comparison against the actual uploaded PNG; source-only review is not visual sign-off.
6. **Move to the next numbered page.** Revalidate earlier screens if a shared component changes. After #13 do a cross-screen adversarial regression pass, then the separate pixel-level visual pass.

**Status vocabulary:** `ACCEPTED-CODE` = post-change focused acceptance pass; `ACTIVE` = only page in implementation; `RECHECK` = older success but subsequently changed or blocker; `PENDING` = initial implementation only; `BLOCKED-EXTERNAL` = source is not yet validated because another account broke shared CI. `VISUAL-PENDING` is independent and applies to all screens until screenshots are compared.

## Ordered Faculty screen register

| ID | Uploaded reference (exact ZIP name) | Code validation / most pertinent evidence | Next required action | Visual |
|---|---|---|---|---|
| #02 | `Faculty › Today.png` | **ACCEPTED-CODE**; [Today run 40282276117](https://github.com/42Students/lms-vnext/actions/runs/40282276117); [page audit](today-prototype-02.md) | Recheck if shared shell changed; later render comparison | PENDING |
| #03 | `Faculty › Courses.png` | **ACCEPTED-CODE for prototype test**; [Courses run 40283586626](https://github.com/42Students/lms-vnext/actions/runs/40283586626); expanded legacy regression needs independent review; [page audit](courses-prototype-03.md) | Review expanded course test failure, then visual | PENDING |
| #04 | `Course › Overview.png` | **ACCEPTED-CODE**; [Overview run 40284557334](https://github.com/42Students/lms-vnext/actions/runs/40284557334); [page audit](course-overview-prototype-04.md) | Recheck shared changes and visual | PENDING |
| **#05** | **`Course › Blueprint.png`** | **ACTIVE**; [prior passing Blueprint run 40296893661](https://github.com/42Students/lms-vnext/actions/runs/40296893661) is older than later edits; [latest Blueprint run 40298561321](https://github.com/42Students/lms-vnext/actions/runs/40298561321) blocked at shared TPO TypeScript error before browser execution | Close authoring deep links, explicit disabled syllabus operations, sequence/receipt tests; collect **post-change browser evidence** without claiming shared TypeScript green | PENDING |
| #06 | `Course › Students.png` | **RECHECK**; [Students run 40293289182](https://github.com/42Students/lms-vnext/actions/runs/40293289182) blocked by unrelated TPO type error and earlier Blueprint type error | Validate new 4 KPIs, behind filter, roster export and privacy with browser; fix issues | PENDING |
| #07 | `Course › Attendance.png` | **RECHECK after changes**; [Attendance run 40295364519](https://github.com/42Students/lms-vnext/actions/runs/40295364519) previously passed | Confirm live-session selection, mark and scheduling link with latest code | PENDING |
| #08 | `Course › Discussions.png` | **RECHECK after changes**; [Discussions run 40295982638](https://github.com/42Students/lms-vnext/actions/runs/40295982638) previously passed | Confirm latest class-scope copy, moderation and responsive layout | PENDING |
| #09 | `Assignments & quizzes.png` | **RECHECK**; [unified Assessments run 40295538156](https://github.com/42Students/lms-vnext/actions/runs/40295538156) previously passed | Confirm new create dialogs, filters and assignment/quiz review; retain stronger tools | PENDING |
| #10 | `Assignments › Grade.png` | **PENDING dedicated acceptance**; save/publish and next-student navigation implemented; no post-change dedicated green run verified | Test grading authorization, save-private vs publish, Grade-and-next receipt, missing learner and mobile | PENDING |
| #11 | `Assignments › Report.png` | **RECHECK**; [Report run 40298015791](https://github.com/42Students/lms-vnext/actions/runs/40298015791) passed before later edits | Verify report counts, CSV, empty/missing students and charts | PENDING |
| #12 | `Class schedule.png` | **RECHECK**; [Schedule run 40296450235](https://github.com/42Students/lms-vnext/actions/runs/40296450235) previously passed | Verify live schedule, week/day/month and accurate attendance links | PENDING |
| #13 | `Find, bell, profile.png` | **RECHECK**; [Find run 40296795155](https://github.com/42Students/lms-vnext/actions/runs/40296795155) failed keyboard focus assertion | Close Ctrl+K keyboard focus, Enter navigation, notifications read state and profile, mobile | PENDING |

## Current work packet — #05 Blueprint

- [x] Open `Course › Blueprint.png`, treat screenshot as source (14-lesson rail, selected Lesson 4, six mixed items, inline Edit/Remove, add menu, section-scoped reorder, engagement footer).
- [x] Identify the preexisting authorized vNext learning path, content, lesson, quiz and assignment mutation services; do not change College Admin lesson ownership.
- [x] Preserve exact lesson/assessment mixed persisted sequences and unit-check stable ties.
- [x] Add inline Edit, Archive confirmation, verified archive receipts and keep non-owned actions unavailable.
- [ ] Complete six `+ Add content` flows: distinct route targets have been coded, but `create=RESOURCE/YOUTUBE/LIVE_CLASS` is not yet consumed by the page/editor and the video target anchor has not been found. Verify the correct *opened form and selected lesson*, not only distinct URLs.
- [ ] Browser verify desktop/mobile selected lesson, Edit, Cancel Archive, relevant create flow, persisted order including feature-gated disabled state, and authorization.
- [ ] Record passing post-change acceptance or actionable exact blocker. **Do not mark #05 closed on old passing run.**
- [ ] Later pixel-level screenshot parity.

**Known screenshot-vs-policy divergences:** `+ Lesson` and `Rename` are visually shown but disabled for Faculty because shared syllabus lessons are owned by College Admin; do not enable these mutations without approved permission redesign. Section-scoped reorder is gated by `DB05_CONTENT_ORDER_READY=DB05_VERIFIED`; a disabled capability is not considered functional. Engagement footer currently links to genuine student reporting rather than copying prototype sample metrics. These remain explicit gaps/decisions, not hidden completions.

## Shared CI / cross-lane handling

The 2026-10-26 full CI run [40299045317](https://github.com/42Students/lms-vnext/actions/runs/40299045317) failed in multiple other lanes, including a TypeScript error in `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx`. **Do not say all CI is green.** Do not alter TPO or Recruiter logic from this Faculty lane simply to silence unrelated failures. Keep the post-change Faculty browser gate visible even when shared typecheck is red. Once those lanes are green, rerun the full CI and targeted Faculty suites.

## Next packet

After #05 code acceptance: #06 Students. After #13: adversarial 12-screen interaction sweep and final separate prototype screenshot visual acceptance, including desktop/mobile screenshots and differences tracked here.

## Per-screen actionable audit register

**One screen at a time; #05 Blueprint remains active.** Each audit explicitly maps **the original user-uploaded PNG** to existing vNext source, confirmed gaps, actions, safety checks and acceptance evidence. The reference screenshots themselves are in `42LMS pages prototype-png-faculty.zip`; the downloadable visual companion supplied alongside this ledger embeds all 12 original images and provides zoomable side-by-side code-linked audit navigation. Do **not** substitute mock images.

| Screen | Uploaded design reference | Open the actionable audit |
|---|---|---|
| #02 Today | `Faculty › Today.png` | [F02 audit checklist](screen-02-action-audit.md) |
| #03 Courses | `Faculty › Courses.png` | [F03 audit checklist](screen-03-action-audit.md) |
| #04 Course Overview | `Course › Overview.png` | [F04 audit checklist](screen-04-action-audit.md) |
| #05 Blueprint | `Course › Blueprint.png` | [F05 audit checklist](screen-05-action-audit.md) |
| #06 Students | `Course › Students.png` | [F06 audit checklist](screen-06-action-audit.md) |
| #07 Attendance | `Course › Attendance.png` | [F07 audit checklist](screen-07-action-audit.md) |
| #08 Discussions | `Course › Discussions.png` | [F08 audit checklist](screen-08-action-audit.md) |
| #09 Assignments & Quizzes | `Assignments & quizzes.png` | [F09 audit checklist](screen-09-action-audit.md) |
| #10 Assignment Grading | `Assignments › Grade.png` | [F10 audit checklist](screen-10-action-audit.md) |
| #11 Assignment Report | `Assignments › Report.png` | [F11 audit checklist](screen-11-action-audit.md) |
| #12 Class Schedule | `Class schedule.png` | [F12 audit checklist](screen-12-action-audit.md) |
| #13 Find / Bell / Profile | `Find, bell, profile.png` | [F13 audit checklist](screen-13-action-audit.md) |

### Audit vs closure — the difference matters

The 12-page **source-to-image audit register** covers 115 screen-specific checks, plus seven mandatory acceptance gates per screen (desktop screenshot, mobile/accessibility, authorization, write safety, empty/error states, post-change CI and final visual sign-off). **Checklist creation is not task closure.** An item marked CODE is evidence that matching source exists, *not* that it has passed the current commit's browser suite or the visual comparison.

**No screen gets pixel-level sign-off until the real vNext page has been captured** beside the uploaded reference and every observable layout/content divergence has been closed or explicitly approved as a stronger vNext behavior.

**Work order:** #05 Blueprint post-change CI / create deep links / lesson engagement → #06 Students → #07 Attendance → #08 Discussions → #09 Assignments & Quizzes → #10 Grading → #11 Report → #12 Schedule → #13 Find/Bell/Profile. Regress #02–04 after shared shell changes.

### Evidence gate for every checkbox

- Record the concrete change commit and a run ID from a workflow executed **after** that change.
- Check browser flows with authorized AND unauthorized Faculty accounts; include 1440px and 390px viewport.
- Record whether mismatch is an implementation bug, deployment prerequisite (DB05), policy restriction (Faculty cannot rename College Admin syllabus), or approved better vNext functionality.
- If shared CI fails in unrelated TPO/Recruiter, record the exact error and retain the Faculty page as not accepted until page-specific browser proof is possible; don't claim generic CI green.

