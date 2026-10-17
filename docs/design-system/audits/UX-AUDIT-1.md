# UX Audit 1 — independent, read-only audit (chat-18)

**Baseline:** `42Students/lms-vnext`, `main` at `1de2a083e5358c32add437cc1b255ed5be6e2380`; audit branch `chatgpt/chat-18-b` was created from that `main`. **Date:** 2026-10-18 (IST). **Auditor:** chat-18. **Verdict: BLOCKED.** This report changes no product code.

**Scope/evidence:** Read the author brief, `UX-AUDIT-RUBRIC.md` checks A1–F21, full `UX-PLAYBOOK.md`, changelog, token source `src/app/globals.css` and `lms-color-parity.md`. Inspected **all 31 new/upgraded shared UI files named in the changelog**, the four reference page sources plus `mentor-project-tabs.tsx`, the eight reference route loading/error files, affected shell and quiz implementations, and **25 route entries across seven roles plus auth/quiz** from `docs/orchestrator/ui-ux/pages-*.md`. Spot-checked **50 literal shared-component JSX call sites across 18 sampled authenticated page source files**, plus further call sites in pages outside that subset. This was a remote **source audit**, not a rendered/browser test: **no build, lint, typecheck, test execution, DOM measurement, VoiceOver/TalkBack, 320/360/390 screenshot, Android/iOS WebView, or real network throttling was available**. Source-backed faults are findings; unexecuted tests are not credited as passing.

## Findings — every entry specifies location, defect, consequence and exact repair

### A. Completeness

**A-01 — MAJOR — `UX-PLAYBOOK.md` §12, routes `/learn`, `/learn/courses/[deliveryId]`, `/college/people`; respective `page.tsx` files.** **Wrong:** the prescribed dashboard, course-detail and people-directory archetypes are mapped to route files that *only redirect* (to `/learn/courses`, `/learn/courses/[deliveryId]/home`, `/college/contacts`). **Why:** builders will copy nonexistent page compositions and mark false parity. **Exact fix:** replace these table entries with the true destination/leaf implementations and actual archetypes; link redirect aliases only as aliases, and audit the leaf component.

**A-02 — MAJOR — `UX-PLAYBOOK.md` §§4, 6, 12; `tpo/students/page.tsx`, `hr/placements/jobs/[jobId]/page.tsx`, `placement-calendar-workspace.tsx`.** **Wrong:** generic one-column wireframes do not specify which of the dense TPO student columns, hiring applicant controls, round stages, meeting collisions and permission-scoped actions survive as mobile primary/secondary/hidden fields. **Why:** two builders can suppress different critical fields or leave horizontal grids. **Exact fix:** add per-complex-page column/action priority and overflow matrices, tab/action order, permission-specific state examples, and actual 320/360/390 annotated wireframes for these three cases.

**A-03 — MAJOR — `UX-PLAYBOOK.md` §5 catalogue and §5.1 matrix versus the 31 `src/components/ui/*` implementations.** **Wrong:** the table gives shorthand rather than a complete implementable API and explicit do/don't and state examples for *each* component; e.g. it does not contract required `aria-describedby` ownership for `Input/Select/Textarea`, legal disabled tabs in link mode, file type validation, or fallback link behaviour. **Why:** callers must guess semantics and errors remain unaffiliated. **Exact fix:** supply an individual typed prop/variant/size contract, default/disabled/pending/invalid examples, copy-paste mobile JSX and accessibility obligations for each component, not a generic sentence that defers them.

**A-04 — MINOR — `UX-PLAYBOOK.md` §§3, 6, 7.** **Wrong:** instructions such as “fixed-width ~256px”, “tablet optional 2 columns”, “where domain permits”, “hide sticky positioning if keyboard overlap is observed”, “only after product privacy review” and “in-app navigation interception as supported” delegate decisions without thresholds or implementations. **Why:** different lanes will implement divergent solutions. **Exact fix:** give exact class/range thresholds, the WebView host capability matrix and keyboard-overlap action, autosave privacy fallback, and a complete guarded-form snippet.

**A-05 — MINOR — `UX-PLAYBOOK.md` §§4, 8, 11; `UX-PLAYBOOK-CHANGELOG.md` “Unit and audit evidence”.** **Wrong:** although seven states are named, not every archetype has a worked ready/loading/empty/error/partial/denied/read-only/stale example with known authorizing action; role notes contain jobs but not every associated route/state contract. **Why:** a lane can display an enabled retry for a denied response or treat absent metrics as zero. **Exact fix:** one exact eight-state specimen per archetype and route links from each role job; include approved legacy text source and expected aria region.

### B. Consistency and source-code fidelity

**B-01 — BLOCKER — `src/app/globals.css` root `--primary-foreground: var(--lms-white)` (around line 75) and `--color-on-primary` (around line 97); `UX-PLAYBOOK.md` §2; `admin/colleges/page.tsx` around line 141 and `teacher/courses/[deliveryId]/gradebook/page.tsx` around line 59.** **Wrong:** playbook correctly mandates dark text on `#26bac7`, and `Button` uses `text-foreground`, but legacy semantic `text-on-primary`/`text-primary-foreground` still means white; sampled real submit buttons use `bg-primary text-on-primary`. **Why:** measured white/teal contrast **2.35:1**, failing 4.5:1. **Exact fix:** reconcile semantic foreground aliases with the documented *dark-on-teal* pairing; migrate/audit all uses, preserve scoped dark-theme behaviour, add computed AA snapshot tests and a lint restriction on mismatched combinations.

**B-02 — MAJOR — `src/components/ui/data-table.tsx` mobile `primary/secondary/extra` algorithm, `UX-PLAYBOOK.md` §§5–6.** **Wrong:** columns explicitly marked `mobilePriority="hidden"` vanish completely on phone without the documented redundancy requirement being enforceable; all remaining action-cell renderers may be buried inside `<details>`, and a primary cell may embed controls inside a heading. **Why:** authorized data and key actions can be inaccessible in mobile workflow. **Exact fix:** require an explicit `mobileHiddenReason`/`mobileDetailsHref` for hidden fields, extract always-visible row actions, use a plain heading for text-only primary, and test every column's recoverability at phone width.

**B-03 — MAJOR — `src/components/ui/tabs.tsx` route-link branch and controlled branch; `UX-PLAYBOOK.md` §5.** **Wrong:** `renderPanel={false}` renders `<Link>` even when `item.disabled` is true; `renderPanel=true` accepts no `onValueChange` and still renders clickable no-op tabs. **Why:** disabled destinations can be opened and apparent controls fail. **Exact fix:** render disabled route tabs as noninteractive `aria-disabled` text, require change handler for interactive panel tabs (or explicitly use read-only semantics), and test click/keyboard/roving focus for both modes.

**B-04 — MAJOR — `src/components/ui/filter-bar.tsx` lines around 17–33; `UX-PLAYBOOK.md` §§4, 6.2.** **Wrong:** the documented phone shape is visible “Search + Filters (N)”, but implementation renders only a “Filters (N)” button plus optional action and hides all provided search fields inside the sheet. Its server-first nonmobile version also differs from the final phone tree. **Why:** core list-search workflow and phone composition diverge from the blueprint. **Exact fix:** give `FilterBar` separate always-visible `search` and sheet `filters` slots; define which query control is exposed; render SSR-stable variants, and test both breakpoint compositions.

**B-05 — MAJOR — `src/app/quiz/page.tsx` line 10, `college/contacts/page.tsx` line 45, `teacher/profile/details/page.tsx` line 20 and further named route links; `UX-PLAYBOOK.md` §2.** **Wrong:** real small-size links still use `text-primary-text` (legacy `#1a95a1`) on a white/surface background although the playbook explicitly forbids this at normal text size. **Why:** computed **3.59:1**, below WCAG 4.5:1. **Exact fix:** reserve `text-primary-text` for qualifying large/bold decorative use, convert normal interactive link text to existing `--lms-teal-deep` (**4.94:1**) and add contrast tests for page call sites.

**B-06 — MINOR — `src/app/globals.css` tracker dark scope, `src/components/ui/button.tsx`, `UX-PLAYBOOK.md` §2.** **Wrong:** tracker `data-tracker-theme="dark"` reverses `--lms-foreground` to pale while canonical bright primary remains bright; `Button`'s `text-foreground` rule is not independently contrast-safe in this scope. **Why:** a theme-scoped primary control risks returning to pale-on-bright-teal. **Exact fix:** supply a scoped `--lms-on-primary` dark text value for both themes and verify contrast under the tracker attribute.

**B-07 — MINOR — `UX-PLAYBOOK.md` §§2–3 versus `src/components/shell/app-shell.tsx` lines ~89–110.** **Wrong:** document declares tablet 640–1023 and desktop shell at ≥1024, while actual 256px fixed sidebar activates at `md:768` and content gets `md:pl-64`. **Why:** width 768–1023 becomes a narrow desktop layout rather than prescribed tablet layout. **Exact fix:** either move shell/sidebar switch to `lg` or document and test a genuine 768px sidebar exception with measured content width.

### C. Phone and native-app WebView — highest priority

**C-01 — BLOCKER — `src/components/courses/learner-quiz-attempt.tsx` lines 241–263; `src/app/quiz/page.tsx`; `UX-PLAYBOOK.md` §§1.9, 6.11, 7, 13.** **Wrong:** quiz cancel and irreversible submission still invoke **`window.confirm`**, and exit uses `router.back()` based on history length, not a known LMS parent. **Why:** native-app WebView confirmation may be unsupported or disruptive, and Back can escape the LMS or strand a draft. **Exact fix:** use accessible shared `ConfirmDialog` with pending/deadline awareness; cancel/leave should navigate to `/learn/allQuizzes` after preserving draft, with a tested host-back policy; test Android/iOS back and duplicate submit.

**C-02 — BLOCKER — `src/app/(authenticated)/tpo/students/page.tsx` lines ~763–764; `UX-PLAYBOOK.md` §§4, 6.1, 12.** **Wrong:** the mission-critical TPO students directory still renders an `overflow-x-auto` container with a desktop `min-w-[52rem]` table instead of the required priority-defined cards below 640px. **Why:** on 320px phones, most columns/actions are available only through sideways table scrolling and thumb reach fails; this directly violates the explicitly highest-complexity scenario. **Exact fix:** render a true mobile card list with student, eligibility and action priorities; put additional columns in an accessible disclosure, keep dense table at ≥640, and test 320/360/390 with the full column set.

**C-03 — BLOCKER — `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx` ~71; `src/components/placements/placement-drive-workspace.tsx` ~467,484; `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` ~570–575; `UX-PLAYBOOK.md` §6.11.** **Wrong:** live LMS workflow links still specify `target="_blank"`. **Why:** native WebViews often block new windows or lose the user's route context; the rule explicitly forbids popup-only navigation. **Exact fix:** use same-tab validated links or an app-supported external intent with visible selectable URL fallback and safe return path; audit every `target=_blank` occurrence and add a static check.

**C-04 — MAJOR — `src/components/ui/filter-bar.tsx` `useEffect(matchMedia)` conditional JSX; `college/contacts/page.tsx` lines 49–193.** **Wrong:** switching 639↔640px unmounts and remounts the full uncontrolled GET form (23+ visible options), resetting unsent selections to `defaultValue` and changing focus; initial phone hydration flashes desktop controls. **Why:** user-entered search/filter work can vanish on rotation, split-view resize or keyboard viewport changes. **Exact fix:** preserve one stable form subtree, or hoist controlled draft state with explicit Apply/Cancel/Reset semantics and persistent focus; add resize/rotation/hydration tests with unsent edits.

**C-05 — MAJOR — `src/components/ui/dialog.tsx`, `drawer.tsx`, `bottom-sheet.tsx` `onCancel`/`onClose`; `UX-PLAYBOOK.md` §6.11.** **Wrong:** Escape and native dialog closure are implemented, but there is no route-history/native host-back protocol, nor an example of reentrancy when a WebView back event fires while a sheet is open. **Why:** Android hardware back may navigate away underneath a modal or close the page with unsaved data. **Exact fix:** specify a single host ↔ WebView Back contract and implement/test popstate/hardware-back dismissal before page navigation, including pending nondismissible states and opener focus restoration.

**C-06 — MAJOR — `src/components/ui/dialog.tsx`/`drawer.tsx`/`bottom-sheet.tsx` 100dvh fixed panels and `UX-PLAYBOOK.md` §§3, 6.3–6.4.** **Wrong:** safe-area footer classes exist, but none contains an implemented keyboard-overlap mitigation, visual viewport keyboard test, or sticky-action disable path; full-height editors can still leave save bars under the OS keyboard. **Why:** core submit becomes unreachable in embedded WebViews. **Exact fix:** define exact scroll/resize/keyboard visual-viewport fallbacks and demonstrate at 320/360/390 in iOS WKWebView and Android WebView; keep action reachable without an obscuring fixed bar.

**C-07 — MAJOR — `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx` links `min-h-10`; `src/app/(authenticated)/tpo/calendar/page.tsx` `min-h-10`; `admin/colleges/page.tsx` links `min-h-10` and pagination; `UX-PLAYBOOK.md` §6.5.** **Wrong:** link/button targets at 40px height appear in phone-facing workflows against the ≥44px design-system mandate. **Why:** touch precision and WCAG 2.2 touch comfort degrade, especially on midrange devices. **Exact fix:** replace those targets with shared `Button` or `min-h-11 min-w-11` inline-link utilities; inspect adjacent 8px spacing at 320px.

**C-08 — MAJOR — `src/components/ui/file-upload.tsx` handler and `UX-PLAYBOOK.md` §§5, 6.11.** **Wrong:** `accept` is an OS hint only; handler rejects oversize but never checks MIME/extension despite claiming size/type validation. After rejection it clears only DOM input without notifying `onFiles(null)`, leaving an earlier parent selection possible. No upload-unavailable/paste-link fallback prop is implemented. **Why:** stale file can be submitted and restricted WebView pickers strand forms. **Exact fix:** validate accepted MIME/extensions server-side and before callback; call `onFiles(null)` on error; expose explicit unavailable-file-picker alternative/parent-provided URL field and feedback, with tests.

**C-09 — MINOR — `src/app/quiz/page.tsx` line 7, `src/components/ui/page-loading.tsx` and `graceful-page-loading.tsx`; `UX-PLAYBOOK.md` §6.10.** **Wrong:** quiz entry uses `min-h-screen` plus a plain Suspense “Loading quiz…” block rather than dvh and bounded skeleton/retry; shared 12s retry helpers do not apply to it. **Why:** viewport and slow-network handling differ from mobile policy. **Exact fix:** use `min-h-dvh` and a shape-matched quiz loading boundary with 12s visible Retry without sacrificing the attempt draft.

### D. Accessibility — WCAG 2.2 AA

**D-01 — MAJOR — `src/components/shell/app-shell.tsx` shell structure; `src/components/shell/mobile-navigation.tsx` and `UX-PLAYBOOK.md` §9.** **Wrong:** shell exposes `<main>` but no identifiable skip-to-content anchor/link before its extensive role navigation; the native mobile navigation uses a custom dialog, not shared modal, with no back/viewport parity evidence. **Why:** keyboard and screen-reader users must traverse the entire shell on every page. **Exact fix:** insert a visible-on-focus skip link before the shell nav, give `main` a stable ID and autofocus semantics on route transition, and test Tab/focus return in mobile navigation.

**D-02 — MAJOR — `src/components/ui/input.tsx`, `select.tsx`, `textarea.tsx` `error` prop; `UX-PLAYBOOK.md` §§5.1, 7, 9.** **Wrong:** `error=true` sets `aria-invalid` but cannot guarantee an associated help/error element; `aria-describedby` is entirely caller-dependent. **Why:** AT may report “invalid” without telling the user how to fix it. **Exact fix:** add explicit `errorId/errorMessage` or compose a shared `FormField` that sets id, label, helper and error relationships deterministically; add aria association tests including submit-focus-first-error.

**D-03 — MINOR — `src/components/ui/skeleton.tsx` `role=status aria-label` plus an `sr-only` duplicate label.** **Wrong:** the same message is supplied twice as an accessible name and text in a live region. **Why:** some screen readers may double-announce. **Exact fix:** use one sr-only child as the status accessible text (not both) and test VoiceOver/TalkBack.

**D-04 — MINOR — `src/components/ui/pagination.tsx` `span role=status aria-live`; `UX-PLAYBOOK.md` §9.** **Wrong:** page count announcement is static server markup, and no focus management/live-route update contract is supplied for Next.js client transitions. **Why:** page-change announcements are browser/route dependent, not demonstrated. **Exact fix:** make the active page result heading focusable/announced after navigation or add a route announcer; test direct links and client-side transitions with a screen reader.

### E. Engineering, compatibility, runtime and reference quality

**E-01 — MAJOR — Four “copy these” references `UX-PLAYBOOK.md` §14 and changelog reference table; `teacher/profile/details/page.tsx` lines 14–24, `mentor/projects/[projectId]/page.tsx` lines 61–148, `college/contacts/page.tsx` lines 49–219.** **Wrong:** Faculty reference can resolve to an unavailable storage message instead of a working editor; Mentor and Contacts retain extensive bespoke nested widgets and no fully demonstrated phone/desktop eight-state exemplar. Contacts presents its own cards, not the mapped `DataTable`; mentor detail has no route-level `PageHeader` before the tabs. **Why:** four implementations are not demonstrably flawless copyable standards, as required by brief deliverable 3 and rubric check 19. **Exact fix:** provide fixture-backed fully operable form, dashboard, directory and tab page with all eight states, legacy text, mobile layout and keyboard tests; mark *conditional unavailable* as a state specimen, not a complete editor.

**E-02 — MAJOR — `src/app/(authenticated)/tpo/home/page.tsx` lines 49–62, 77–102 and `UX-PLAYBOOK.md` §§1.10, 8.** **Wrong:** primary and optional TPO home reads use a broad `Promise.all` with multiple nonoptional services; any reject forces the route error boundary even if other tiles/actions could render. Invite-candidate eligibility requests also sequentially scan batches. **Why:** violates partial-data and priority-first graceful-load contracts, and can delay vital actions. **Exact fix:** classify required versus auxiliary fetches, use `allSettled`/local fallbacks for independent reads, expose `—` with reason and per-section retry, and cap/concurrently prefetch eligible batch summaries.

**E-03 — MAJOR — `UX-PLAYBOOK-CHANGELOG.md` “Unit and audit evidence”; `tests/ux-playbook-primitives.test.tsx`; entire shared set.** **Wrong:** changelog explicitly states tests were never executed. The nine named tests only assert static markup and small helpers, not keyboard focus trap/return, FilterBar hydration/resize, file picker, native back, slow/offline behaviour or four phone references. **Why:** strict TypeScript, a11y and compatibility are unproven, so no sign-off evidence exists. **Exact fix:** run and publish commit-linked results for typecheck, lint, targeted/full Vitest, Playwright at 320/360/390/768/1280 and manual Android/iOS/AT matrix; add stateful integration tests before audit rerun.

**E-04 — MAJOR — `UX-PLAYBOOK.md` §5 backwards compatibility, `src/components/ui/*`, 50 observed JSX call sites across 18 sampled route files.** **Wrong:** source-only spot checks found mixed raw buttons, links, custom tables and converted controls; there is no before/after prop-type assertion or migration compatibility test. **Why:** preserving exported types does not establish that existing behaviour and styles are unchanged after replacement. **Exact fix:** add compile-time contract/type fixtures for pre-existing props, compare visual snapshots for at least 30 *affected* call sites and execute full typecheck, with a documented intentional-change list.

**E-05 — MINOR — `src/components/ui/data-table.tsx` two responsive trees.** **Wrong:** desktop table and mobile card maps render simultaneously in React/HTML and hide one via CSS. For 100 rows the cell functions execute twice and all row contents are serialized twice. **Why:** increases payload/hydration work on the very phones targeted by the brief. **Exact fix:** paginate aggressively, cap secondary renderers, or adopt SSR-safe viewport-specific delivery without discarding mobile accessibility; benchmark 100 rows with midrange device throttling.

### F. Anti-drift safeguards

**F-01 — MAJOR — `UX-PLAYBOOK.md` §14 100-point rubric.** **Wrong:** category point pools are supplied, but terms like “works”, “good hierarchy”, “real browser proof” and “when states apply” lack an atomic scoring ledger, exact denominator for N/A checks, and failing/passing fixture examples. **Why:** two lanes can award different scores by much more than 5 points for the same page. **Exact fix:** define individual 0/1/2 scored conditions with identical test steps, N/A redistribution, evidence URLs/screenshots and 3 benchmark annotated sample page scorecards.

**F-02 — MAJOR — `UX-PLAYBOOK.md` §13 anti-patterns; repository enforcement.** **Wrong:** most guardrails are prose, while confirmed code still contains `window.confirm`, `target="_blank"`, `min-h-10` actions and low-contrast `text-on-primary` and `text-primary-text`. **Why:** 13 lanes can independently reintroduce violations without a failing build. **Exact fix:** ship repo-scoped ESLint or AST rules for forbidden API/popup/size/color pairs plus a required page-review matrix and type-tested component import policy; grandfather existing code only with tracked, expiring waivers.

**F-03 — MINOR — `UX-PLAYBOOK.md` §§12–14; `UX-PLAYBOOK-CHANGELOG.md`.** **Wrong:** references are described as “patterns, not fixtures” and there are no source-linked canonical state snapshots or stable visual regression baselines. **Why:** builders cannot tell an intended deviation from a regression. **Exact fix:** provide fixed sanitized data fixtures and screenshots at each required viewport for all four references, plus approval owner and expected snapshot hashes.

## Required 25-route walk (checked source, including redirect/re-export resolution)

The “required composition” column derives from playbook §12; **Observed issue** is from the actual named route source and, where a re-export/redirect was seen, its resolved implementation. This is **static inspection**, not a claim of viewport validation. Multiple routes can share a single root-cause finding.

| # / role | Real route / source | Archetype + required components | Source-level observation / finding |
|---|---|---|---|
| 1 Learner | `/learn` | dashboard: PageHeader/StatTile/Card | Alias redirects to `/learn/courses`; not a dashboard. **A-01** |
| 2 Learner | `/learn/courses` | directory: FilterBar/DataTable/Pagination | 131-line route uses PageHeader, no named list primitives at route level; verify actual roster widgets before migration. **A-02/E-04** |
| 3 Learner | `/learn/courses/[deliveryId]` | detail: Breadcrumbs/Tabs/Card | Redirects to `/home`, so leaf—not alias—requires audit. **A-01** |
| 4 Learner | `/learn/allAssignments/[assignmentId]` | form/detail: Card/FileUpload/ConfirmDialog | Direct `target="_blank"` submission link at ~71; route itself uses PageHeader. **C-03/E-01** |
| 5 Faculty | `/teacher/courses` | directory: DataTable/Pagination | PageHeader with existing handoff, no named DataTable/Pagination in route. **A-02/E-04** |
| 6 Faculty | `/teacher/courses/[deliveryId]/gradebook` | report: StatTile/DataTable | Bespoke learner cards, GET form and raw white-on-teal Search submit; no StatTile/DataTable in route. **B-01/E-04** |
| 7 Faculty | `/teacher/profile/details` | editor: PageHeader/Card/Input/Textarea | Shared Card/Breadcrumbs, conditional unavailable-storage state instead of active editor. **E-01** |
| 8 Mentor | `/mentor/projects` | directory: FilterBar/DataTable | Large bespoke (~352-line) list; no shared FilterBar/DataTable in route. **A-02/E-04** |
| 9 Mentor | `/mentor/projects/[projectId]` | detail: Tabs/Card/StatusBadge | Breadcrumbs/Card; `MentorProjectTabs` wraps shared route-link Tabs; no top-level PageHeader. **E-01** |
| 10 Mentor | `/mentor/calendar` | calendar: FilterBar/Card | PageHeader + bespoke calendar, no FilterBar/Card at route level. **A-02/E-04** |
| 11 TPO | `/tpo/students` | dense directory: FilterBar/BottomSheet/DataTable/Pagination | 1,034-line page, desktop `min-w-[52rem]` raw table. **C-02** |
| 12 TPO | `/tpo/placements/jobs/[jobId]` | drive detail: Tabs/Card/ConfirmDialog | Delegates to `PlacementDriveWorkspace`; 40px actions and external popups in leaf. **C-03/C-07** |
| 13 TPO | `/tpo/messages` | inbox: DataTable/Card | 568-line page with bespoke `min-w-[50rem]` desktop table; distinct mobile content requires device verification. **A-02/E-03** |
| 14 TPO | `/tpo/calendar` | calendar: FilterBar/Card | Delegates to 1,133-line `PlacementCalendarWorkspace`; 40px export/navigation links, bespoke calendar. **C-07/E-04** |
| 15 College Admin | `/college/people` | directory: FilterBar/DataTable/Pagination | Redirect to `/college/contacts`, not independent directory. **A-01** |
| 16 College Admin | `/college/contacts` | directory: FilterBar/DataTable/mobile cards | FilterBar+Pagination+custom contact cards; many native uncontrolled GET fields remount at breakpoint. **C-04/E-01** |
| 17 College Admin | `/college/branding` | settings: Card/Input/FileUpload | Delegates to `CollegeLogoUploader` and `CollegeBrandingForm`; shared FileUpload not used by route. **C-08/E-04** |
| 18 Recruiter | `/recruiter/drives` | directory: FilterBar/DataTable | Re-export of `hr/drives/page.tsx` (233 lines) with custom list + PageHeader. **A-02/E-04** |
| 19 Recruiter | `/recruiter/drives/[jobId]` | detail: Tabs/Card | Re-export of `hr/placements/jobs/[jobId]/page.tsx` (893 lines) with custom tabs/side drawer and popup links. **C-03/C-06** |
| 20 Recruiter | `/recruiter/home` | dashboard: StatTile/Card | Re-export of `hr/home/page.tsx` (328 lines); custom task/card construction, not shared StatTile. **E-04** |
| 21 Super Admin | `/admin/colleges` | directory: FilterBar/DataTable | Shared DataTable at ≥1024 only, custom card branch below and 40px links; search uses white-on-teal text. **B-01/C-07** |
| 22 Super Admin | `/admin/module-access` | settings: Switch/Card/ConfirmDialog | Route delegates content; no named settings controls at route level; must test delegated permissions/states. **E-03/E-04** |
| 23 Super Admin | `/admin/audit` | report/directory: FilterBar/DataTable | Route uses PageHeader and ErrorState, delegates report; no shared FilterBar/DataTable at route level. **A-02/E-04** |
| 24 Public/auth | `/login` | auth: Card/Input/Button | Four-line alias re-exports `src/app/page.tsx`; live LoginForm is delegated, not a stand-alone reference specimen. **E-03** |
| 25 Quiz | `/quiz` | wizard: Card/Radio/Button | Loads `LearnerQuizAttempt`; native confirm twice, history-based exit, min-h-screen and unbounded text suspense fallback. **C-01/C-09** |

**Additional usage spot-check sample (beyond the 25 route walk):** `/learn/allAssignments`, `/learn/allQuizzes/[quizId]`, `/learn/calendar`, `/teacher/calendar`, `/teacher/contacts`, `/teacher/allQuizzes`, `/mentor/task-reviews`, `/mentor/sprint-progress`, `/tpo/verification`, `/tpo/requests`, `/college/students`, `/college/faculty`, `/recruiter/calendar`, `/recruiter/messages`, `/admin/settings` and `/admin/tenants`. Also inspected the source of the re-exported HR home/drives/detail routes, live quiz, placement-drive and placement-calendar workspaces. 50 literal JSX usages counted only from 18 named authenticated files above; not all are *upgraded* usage paths, so backward compatibility is **not** considered passed.

## 21-check rubric coverage ledger

| Rubric | Evidence assessed | Result |
|---|---|---|
| A1 required concrete sections | §§1–14 versus author brief | **FAIL** A-03/A-04 |
| A2 25 pages, ≥3 per role and key complex routes | 25-route walk; 4 Learner, 3 Faculty, 3 Mentor, 4 TPO, 3 College, 3 Recruiter, 3 Admin, 2 public/quiz | **FAIL** A-01/A-02/C-01/C-02 |
| A3 every component anatomy/variants/sizes/states/props/mobile/a11y/file | 31 files versus §5/5.1 | **FAIL** A-03/B-02/B-03/D-02 |
| A4 loading/empty/error/partial/denied/read-only/stale | §§4/8, route boundaries | **FAIL** A-05/E-02 |
| B5 token values, text 4.5/UI 3 ratios | `globals.css`, parity map, code usages | **FAIL** B-01/B-05/B-06 |
| B6 scales/overrides/conflicts | §§2/3, shell | **FAIL** B-07 |
| B7 exact labels/navigation | static authored labels sampled, legacy strings not exhaustively machine-diffed | **UNVERIFIED** E-03 |
| B8 code equals catalogue | all 31 upgraded UI sources | **FAIL** B-02/B-03/B-04 |
| B9 backwards props + ≥30 call sites | 50 JSX calls observed; no executable regression typecheck | **UNVERIFIED** E-04 |
| B10 no hover-only, browser popup/confirm/raw errors | quiz, recruiter/TPO/learner flows | **FAIL** C-01/C-03 |
| C11 widths/44px/thumb reach | source classes, no visual viewport run | **FAIL** C-02/C-07 |
| C12 cards/sheets/sticky safe keyboard | DataTable/filter/dialog/drawer source | **FAIL** C-04/C-06 |
| C13 native WebView hazards | popup/back/file and CSS code | **FAIL** C-01/C-03/C-05/C-08 |
| C14 offline/slow skeleton/retry/layout stability | route loading boundaries, TPO Promise.all, quiz | **FAIL** C-09/E-02 |
| D15 landmarks/focus/keyboard/errors/reduced motion | shell and primitives source | **FAIL** D-01/D-02 |
| D16 AT toast/loading/pagination | toast/Skeleton/Pagination/test sources; no AT run | **UNVERIFIED** D-03/D-04 |
| E17 strict TS/tests/dead code | nine authored, unexecuted unit tests; no build | **UNVERIFIED** E-03 |
| E18 render cost/list scalability | DataTable duplicates; TPO load graph | **FAIL** E-02/E-05 |
| E19 four complete working responsive references | four route files + eight boundaries | **FAIL** E-01 |
| F20 consistent 100-point scored audit | §14 | **FAIL** F-01 |
| F21 ten builder drift paths and safeguards | §13 vs code | **FAIL** F-02/F-03 |

**Measured light-palette contrast pairs (WCAG sRGB relative luminance, rounded):** `#1a1d21` on `#26bac7` **7.19:1**; `#fff` on `#26bac7` **2.35:1 FAIL**; `#0e7c87` on `#fff` **4.94:1**; `#1a95a1` on `#fff` **3.59:1 FAIL normal text**; `#54505d` on white **7.83:1**; `#6b7280` on white **4.83:1**; success green `#059669` on white **3.77:1 FAIL normal text**; warning `#d97706` on white **3.19:1 FAIL normal text**; error `#ef4444` on white **3.76:1 FAIL normal text**; passive border `#e5e9f0` vs white **1.22:1 FAIL as sole active-control indicator**. Dark panel `#1e363f` and white **12.69:1**. Values for canonical tokens matched `lms-color-parity.md`; not all theme/role pairings were tested.

## Ten most likely multi-lane UX drift paths and the prevention to implement

| Likely drift | Preventing concrete rule/lint |
|---|---|
| 1. White-on-teal native submit/link | Disallow `bg-primary` together with `text-on-primary` or `text-primary-foreground`; computed token contrast test |
| 2. Small legacy teal text on white | Disallow `text-primary-text` on normal-size linked text; use deep-teal |
| 3. Desktop grids in phone view | Require DataTable mobile labels and field priorities or validated bespoke card snapshot at 320px |
| 4. Native confirm/alert/prompt in flows | TypeScript AST/ESLint ban for `window.confirm/alert/prompt` |
| 5. External popup without WebView fallback | Ban `target=_blank`/`window.open` without audited host-intent wrapper |
| 6. Lost filter drafts on orientation | Shared stable FilterBar form and Playwright breakpoint-state-preservation fixture |
| 7. Incorrect role labels/sidebar ordering | Golden role nav snapshots and parity-string comparison against legacy copy |
| 8. Inaccessible forms and tiny links | Enforce `FormField` association plus 44px minimum target check for common actionable classes |
| 9. One-off calendar/wizard modal implementations | Shared sheet/dialog required; require safe-area/keyboard/back integration tests |
| 10. Unbounded loading and partial metric failure | Route-level 12s state test and injected auxiliary API failure test |

## Counts and disposition

| Severity | Findings |
|---|---:|
| **BLOCKER** | **4** |
| **MAJOR** | **20** |
| **MINOR** | **9** |
| **NIT** | **0** |
| **Total** | **33** |

**VERDICT: BLOCKED.** No sign-off while any BLOCKER/MAJOR remains. This is audit 1, not audit 3 and not a page-level rollout authorization. Author should fix faults first; the next independent audit must re-check the exact source and execute the validation matrix, not copy this verdict.

### Three riskiest things not verifiable in this audit

1. **Real phone/native WebView safety** on iOS WKWebView and Android WebView: 320/360/390 portrait/landscape, notches, keyboard, native Back, file-picker/download permissions and embedded window restrictions. Source cannot prove whether users can exit or complete the quiz, upload or apply filters without losing work.
2. **Actual WCAG 2.2 AA operation:** VoiceOver/TalkBack announcements, 200% zoom, reduced-motion, focus traps/return, live pagination announcements, color combinations under the scoped theme and error focus, with hydrated Next.js navigation.
3. **Build and production resilience:** strict typecheck/lint/full Vitest results, 30+ backward-compatibility interaction tests, performance and layout shifts at 100+ rows on midrange phones, slow/offline route retries, and real multi-tenant permission/error state fixtures.
