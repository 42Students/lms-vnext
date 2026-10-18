# UX Audit 2 — independent adversarial review (chat-19)

**Verdict: BLOCKED — NOT SIGNED-OFF.** Do not start page UX rollout. Audit 1 remediation has genuine source changes, but 5 previously reported issues are reopened, 4 remain acceptance-open, and new mobile/WebView/a11y failures exist. This is an evidence-backed static audit, not a claim of executed iOS/Android/Playwright/AT verification.

**Repository:** 42Students/lms-vnext. **Source:** main at ee631bb198b5c4655ce6af1bebbf998930dc2f42, 2026-10-18 (IST). **Audit branch:** chatgpt/chat-19-b. **Scope:** documentation and existing code review only, no page edits. The author was chat-17; auditor chat-19 is independent.

**Method:** read UX-AUDIT-RUBRIC.md (21 checks), UX-PLAYBOOK.md §§1–18, CHANGELOG, AUDIT-1 and its 33-row crosswalk; inspect all 33 named shared UI files and two shell files, code/guards/tests/capture recipe, canonical CSS, all 25 route sources (resolving redirects/re-exports) and selected delegated critical components. Source lines below are 1-based from main. Verified browser outcomes are explicitly not claimed; no checkout or runnable browser/device test environment was available through the GitHub connection. Latest CI run on source revision, GitHub Actions run 39081122938, was **queued** on inspection, not a passed acceptance test. Existing scripts were inspected, NOT executed. Evidence claims are restricted to source.

## Audit 1 re-verification — all 33

Statuses: **SOURCE-FIX** = implementation/document repair present, provisional until runnable/device evidence; **PARTIAL** = meaningful repair but unresolved implementation or acceptance issue; **REOPENED** = original obligation demonstrably still violated; **OPEN-EVIDENCE** = explicit acceptance deliverable not supplied. None of these status words means user/device sign-off.

| Audit 1 ID | Independent verdict | Exact source evidence | Reason |
|---|---|---|---|
| A-01 | SOURCE-FIX | UX-PLAYBOOK.md:236-267 | Redirect aliases are now identified; destination leaf still needs browser validation. |
| A-02 | SOURCE-FIX | UX-PLAYBOOK.md:311-383 | Dense page phone-priority and permission matrices exist; no 320/360/390 screenshots. |
| A-03 | PARTIAL | UX-PLAYBOOK.md:95-166,445-483; src/components/ui/file-upload.tsx:29-56 | Catalogue and examples expanded, but typed field/error and fallback usage remains opt-in. |
| A-04 | PARTIAL | UX-PLAYBOOK.md:384-443 | lg threshold and host contract written; sample save never calls a mutation (N-08). |
| A-05 | SOURCE-FIX | UX-PLAYBOOK.md:484-503 | Eight-state/archetype table and role routes exist, but states are not exercised. |
| B-01 | SOURCE-FIX | src/app/globals.css:15,78,100-105; src/components/ui/button.tsx:10-20 | Canonical teal retained; on-primary ink alias corrected; live computed CSS tests outstanding. |
| B-02 | PARTIAL | src/components/ui/data-table.tsx:28-62 | Actions and hidden-field metadata added; detail-route recoverability is not validated at runtime. |
| B-03 | SOURCE-FIX | src/components/ui/tabs.tsx:26-69 | Disabled route link becomes inert; no-handler panel tabs disabled; roving-keyboard testing outstanding. |
| B-04 | SOURCE-FIX | src/components/ui/filter-bar.tsx:22-78; src/app/(authenticated)/college/contacts/page.tsx:50-63 | Search separate and persistent filter form subtree; hydration/focus tests unrun. |
| B-05 | SOURCE-FIX | src/app/globals.css:16,104-105; src/components/ui/data-table.tsx:62 | text-primary-text maps to deep-teal alias; source-site contrast sweep outstanding. |
| B-06 | SOURCE-FIX | src/app/globals.css:148-162 | Tracker dark-scope on-primary remains dark ink; actual dark computed pairing not measured. |
| B-07 | SOURCE-FIX | src/components/shell/app-shell.tsx:81-112,169 | lg:pl-64 and w-64 match documented 1024px shell threshold. |
| C-01 | SOURCE-FIX | src/components/courses/learner-quiz-attempt.tsx:247,429-436 | Shared ConfirmDialogs and known learner exit replaced native confirm/router.back; host-back testing absent. |
| C-02 | REOPENED | src/components/tpo/tpo-students-spreadsheet.tsx:209; src/components/tpo/tpo-spreadsheet-grid.tsx:143-149 | Branch intelligence cards exist, but actual student row actions are behind collapsed Actions details on phone, contrary explicit always-visible priority. |
| C-03 | REOPENED | src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx:69-70; src/components/placements/placement-drive-workspace.tsx:409-412 | target=_blank survives in TWO named audited workflows; source guard and UX-PLAYBOOK-20 test cannot pass as written. |
| C-04 | SOURCE-FIX | src/components/ui/filter-bar.tsx:22-78 | One filter subtree is retained through breakpoint; unsent form/focus browser scenario untested. |
| C-05 | REOPENED | src/components/ui/use-overlay-webview.ts:31-40,51-60 | New shared hook can close underlying modal after explicitly closing nested top modal (N-02); no native host suite. |
| C-06 | PARTIAL | src/components/ui/use-overlay-webview.ts:41-50; src/components/ui/dialog.tsx:40-51 | VisualViewport and safe-area hooks exist, but 240px clamp and keyboard positioning are unsafe/unverified (N-10). |
| C-07 | PARTIAL | src/app/(authenticated)/mentor/calendar/page.tsx:46-110; src/app/(authenticated)/tpo/messages/page.tsx:89,167-174 | Audited targeted controls improved; expanded phone-facing pages retain many 40px targets (N-04). |
| C-08 | PARTIAL | src/components/ui/file-upload.tsx:20-56 | MIME/extension precheck + onFiles(null) added; fallback optional even when pickerUnavailable; server/device proof absent. |
| C-09 | SOURCE-FIX | src/app/quiz/page.tsx:8-17; src/components/ui/page-loading.tsx:9-18 | dvh and 12s bounded PageLoading exist; slow-network/attempt-draft outcome not tested. |
| D-01 | SOURCE-FIX | src/components/shell/app-shell.tsx:81,169; src/components/shell/mobile-navigation.tsx:68-108 | Skip link/main target implemented; real tab/focus test missing. |
| D-02 | PARTIAL | src/components/ui/form-field.tsx:3-23; src/components/ui/input.tsx:4-8 | Correct shared ARIA composition available but not enforced for existing raw controls; no screen reader/first-invalid test. |
| D-03 | SOURCE-FIX | src/components/ui/skeleton.tsx:18-28 | Single sr-only live status child; physical AT double-announcement test absent. |
| D-04 | PARTIAL | src/components/shell/route-announcer.tsx:7-26; src/components/ui/pagination.tsx:19-38 | Route announcer added, but query/navigation screen-reader updates and focus behaviour not observed. |
| E-01 | OPEN-EVIDENCE | UX-PLAYBOOK-CHANGELOG.md:96-97; scripts/ux-capture-references.mjs:13-47 | Reference routes improved; no eight-state operable browser fixtures or approved screenshots. |
| E-02 | REOPENED | src/app/(authenticated)/tpo/home/page.tsx:50-63 | Promise.all still has unguarded required/auxiliary reads; one rejected read can blank all Home despite local fallbacks. |
| E-03 | OPEN-EVIDENCE | UX-PLAYBOOK-CHANGELOG.md:100-102; package.json:46-51 | Source tests authored, but no passing typecheck/lint/Vitest/browser/WebView/AT results on baseline; latest CI still queued. |
| E-04 | OPEN-EVIDENCE | scripts/ux-callsite-audit.mjs:25-47; tests/ux-playbook-compatibility.test.tsx:17-65 | AST count is not 30 affected visual/interaction snapshots; compile and before/after checks unrun. |
| E-05 | PARTIAL | src/components/ui/data-table.tsx:35-43,45-76 | Formatter called once, but two full responsive DOM subtrees still constructed; 100-row benchmark absent. |
| F-01 | SOURCE-FIX | UX-PLAYBOOK.md:504-575 | Per-point ledger and no-evidence zero rules written; inter-rater reproducibility not empirically checked. |
| F-02 | REOPENED | scripts/check-ux-anti-drift.mjs:10-28,50-65; src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx:69 | Guard only audits a small allowlist AND current audited paths contain prohibited attributes; lint gate would fail. |
| F-03 | OPEN-EVIDENCE | scripts/ux-capture-references.mjs:24-48; UX-PLAYBOOK-CHANGELOG.md:100-107 | Fixture manifest recipe exists; no captured, approved, source-linked golden screenshots/hashes. |

**Audit 1 verdict totals:** SOURCE-FIX: 15; PARTIAL: 9; REOPENED: 5; OPEN-EVIDENCE: 4 = 33. **Five reopened:** C-02, C-03, C-05, E-02, F-02. The crosswalk has 33 entries, but the crosswalk alone is not evidence of any functional closure.

### Particular failures in previously alleged blocker repairs

- **C-03:** learner assignment resource link still uses target="_blank" at line 69 with min-h-10 at line 70, and placement drive employer portal still uses target="_blank" at approximately line 411. Both paths are in scripts/check-ux-anti-drift.mjs allowlist (lines 17–18). Both are also scanned by tests/ux-audit1-source.test.mjs lines 6–24. This means the test/guard source is inconsistent with the actual main branch, independent of whether CI has executed.
- **C-02:** branch aggregation is now mobile-card-based; the original audit's 52rem table was branch intelligence, not the student roster. However the real roster uses mobileActionsCollapsible=true, then renders rowActions only under a closed details/summary Action drawer on each mobile card. Visible student status is not equivalent to visible actionable affordance; the priority contract still fails.
- **C-05:** newly introduced popstate cleanup bug is demonstrated in A2-02 below and must be fixed before any nested modal use.
- **E-02:** adding .catch to the batches and operations tasks does not guard getPendingTpoRequestsCount, getTpoStudentsIntelligence, countTpoUnreadRecruiterMessages, tpoCrmTablesReady, getCollegePlacementRules, getTpoPlacementTeam or listMyTpoInternalThreads in the same Promise.all. One failure still rejects the entire route render.
- **F-02:** even a passing narrow AST guard would not prove all pages clean; currently it cannot pass on included C-03 source. AST analysis only examines named files rather than all changed routes.

## NEW Audit 2 findings — independently identified root causes

### A2-01 — BLOCKER
**Evidence:** src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:537-556. **Defect and effect:** The recruiter applicant review overlays a manual section role=dialog with aria-modal but no showModal/inert, focus trap/return, Escape or host Back handling; h-screen/85vh and 40px close controls compound keyboard/WKWebView failure. **Required fix:** Replace with shared Drawer/Dialog, preserve URL-selected applicant and browser history, test tab containment/Escape/hardware Back, save focus and keyboard geometry at all required widths.

### A2-02 — BLOCKER
**Evidence:** src/components/ui/use-overlay-webview.ts:31-40,51-60. **Defect and effect:** On a nested modal, explicit close of top B removes B from activeOverlayStack and calls history.back(); the ensuing popstate is handled by underlying still-open A, so ONE close also dismisses A. Current hook has no suppression/ownership token for self-initiated history cleanup. **Required fix:** Do not let cleanup back be consumed by surviving overlay; track pop destination/marker ownership and suppress synthetic cleanup popstate, or use a single centralized overlay history controller; test A+B close, hardware Back B then A, and pending nondismissible nested cases.

### A2-03 — MAJOR
**Evidence:** src/app/(authenticated)/mentor/calendar/page.tsx:43-110. **Defect and effect:** Native search/select inputs inherit 14px text from parent text-sm and use min-h-10; iOS input-focus zoom can occur, and selection is difficult on 320px phones. **Required fix:** Use shared Input/Select at 16px and >=44px, redesign dense filters into persistent Search+FilterBar sheet and run iOS zoom/orientation regression.

### A2-04 — MAJOR
**Evidence:** src/app/(authenticated)/tpo/messages/page.tsx:89,167-174,268; src/app/(authenticated)/admin/module-access/page.tsx:68; src/app/(authenticated)/college/contacts/page.tsx:33-44. **Defect and effect:** Multiple live actions/tabs outside the author's targeted list still use min-h-10 or px-3 py-2 without 44px bounds. At least TPO Messages, Module Access and Contacts are direct mobile workflow surfaces. **Required fix:** Upgrade exact controls to shared Button/Link target utility min-h-11/min-w-11, measure tappable rects and spacing on 320/360/390, extend the guard to these routes.

### A2-05 — MAJOR
**Evidence:** src/components/ui/permission-action.tsx:9-23. **Defect and effect:** PermissionAction silently renders fallback=null by default whenever can() denies permission, conflicting with the playbook's visible read-only or disabled-reason rule. Important status/action context simply disappears. **Required fix:** Require an explicit denied fallback/reason for discoverable actions, or limit silent omission to audited data-security cases via typed mode and tests for absent authority.

### A2-06 — MAJOR
**Evidence:** src/components/shell/app-shell.tsx:79-82,112-114. **Defect and effect:** Outer shell uses min-h-dvh but its main layout child still uses min-h-screen; sticky shell header lacks top env(safe-area-inset-top) padding. Embedded edge-to-edge views may place header under a notch and add viewport scroll mismatch. **Required fix:** Remove remaining screen-height assumption, consume top safe-area in shell/header and test WKWebView/Android notched devices and rotation.

### A2-07 — MAJOR
**Evidence:** src/components/ui/third-party-link.tsx:11-14,28-46. **Defect and effect:** Shared ThirdPartyLink accepts http: URLs and exposes same-tab navigation to unencrypted destinations; the WebView-safe link policy otherwise requires a vetted secure external destination. Selectable fallback is only revealed after user action. **Required fix:** Default to validated HTTPS (explicit reviewed domain exceptions if needed); present the selectable safe URL before leaving restricted hosts and test blocked navigation and return.

### A2-08 — MAJOR
**Evidence:** docs/design-system/UX-PLAYBOOK.md:405-443. **Defect and effect:** The purported copy-paste guarded ProfileForm has a try body containing ONLY a comment in place of an authorized await. Copying it produces a Save button that resets pending without saving and hardcoded Required copy not mapped to legacy labels. **Required fix:** Replace with compilable real injected onSave(value) example, including API failure, version conflict and focus to invalid field, exact legacy-copy placeholder contract and a runnable sample test.

### A2-09 — MAJOR
**Evidence:** src/components/tpo/tpo-spreadsheet-grid.tsx:123-131. **Defect and effect:** The desktop/tablet column resize and pin buttons are bare rounded border px-1 with no minimum width or height (touch targets can be tiny at >=768px tablets). **Required fix:** Apply min-h-11 min-w-11, 8px separation and focus-visible ring or make them a keyboard-accessible settings menu; test at 768px touch viewport.

### A2-10 — MAJOR
**Evidence:** src/components/ui/use-overlay-webview.ts:41-45; src/components/ui/dialog.tsx:40-51. **Defect and effect:** VisualViewport resize clamps available height to AT LEAST 240px even if keyboard-reduced viewport is smaller; dialog height becomes larger than visible screen and the footer may be obscured in landscape or split-screen. **Required fix:** Respect actual usable viewport height (account for visualViewport.offsetTop), keep action footer in scrollable reachable area and device-test keyboard 320px landscape and compact viewport.

### A2-11 — MINOR
**Evidence:** src/components/ui/filter-bar.tsx:60-71. **Defect and effect:** Every FilterBar instance hardcodes id=lms-filter-panel and aria-controls references it. Two bars on a page create duplicate IDs and ambiguous accessible control relationships. **Required fix:** Generate stable useId per instance and test multiple FilterBars in the same render.

### A2-12 — MINOR
**Evidence:** src/components/ui/data-table.tsx:24-27. **Defect and effect:** When empty is omitted DataTable emits the invented universal message No records found, with no role-authorized next action, violating exact legacy copy and actionable-empty instructions. **Required fix:** Require empty prop with route-specific exact copy and authorized next step, or document a vetted per-context fallback.

### A2-13 — MINOR
**Evidence:** src/components/ui/tooltip.tsx:9-16. **Defect and effect:** InfoPopover accepts arbitrary children for its summary without a required accessible label. Icon-only callers can make an unnamed touch disclosure despite keyboard and 44px geometry. **Required fix:** Require label or aria-label when child is not text and provide a test with icon-only summary and screen reader name.

### A2-14 — MINOR
**Evidence:** src/components/ui/toast.tsx:23-28,35-47. **Defect and effect:** All toasts, including long error notifications, disappear after 4500ms regardless of message length and screen reader pace. A user can miss the only visible explanation before recovery. **Required fix:** Keep actionable/error toasts until dismissal or mirror failures in persistent InlineNotice; cover reduced motion, screen-reader reading time and retry affordance.

**New finding counts:** BLOCKER 2, MAJOR 8, MINOR 4, NIT 0; **total 14**. These exclude the five Audit 1 reopened ID counts to avoid double-counting the same original acceptance obligations. A2-02 and A2-10 describe specific *new remediation defects* that additionally explain the unresolved C-05/C-06 contracts.

## 25-route walk and archetype checks (static, source-based)

The route sample covers all seven authenticated role families (at least 3 per role), public login and quiz, including the largest prescribed tables, calendar, inbox and hiring flows. Delegated components were followed for significant findings. NO rendered-width assertion is inferred from Tailwind class names.

| # | Role | Actual route | Archetype; source finding |
|---:|---|---|---|
| 1 | Learner | /learn | redirect alias documented; SOURCE-FIX A-01 |
| 2 | Learner | /learn/courses | directory delegates list; state/phone not browser-verified |
| 3 | Learner | /learn/courses/[deliveryId] | redirect to home leaf; SOURCE-FIX A-01 |
| 4 | Learner | /learn/allAssignments/[assignmentId] | form/detail; popup regression C-03 |
| 5 | Faculty | /teacher/courses | directory; still custom route links |
| 6 | Faculty | /teacher/courses/[deliveryId]/gradebook | report/filters; on-primary alias fixed; other controls custom |
| 7 | Faculty | /teacher/profile/details | editor reference; eight-state/device evidence missing E-01 |
| 8 | Mentor | /mentor/projects | directory bespoke controls; visual compatibility open E-04 |
| 9 | Mentor | /mentor/projects/[projectId] | tab detail with leaf PageHeader exception; E-01 unverified |
| 10 | Mentor | /mentor/calendar | calendar; 14px/40px controls A2-03 |
| 11 | TPO | /tpo/students | roster/dense directory; actions collapsed C-02 |
| 12 | TPO | /tpo/placements/jobs/[jobId] | redirect to drive workspace; check leaf popup C-03 |
| 13 | TPO | /tpo/messages | inbox; 40px actions A2-04 |
| 14 | TPO | /tpo/calendar | calendar route delegates workspace; no phone execution |
| 15 | College Admin | /college/people | alias redirect; SOURCE-FIX A-01 |
| 16 | College Admin | /college/contacts | directory uses FilterBar/DataTable, header tabs still small A2-04 |
| 17 | College Admin | /college/branding | settings delegated uploader; file picker host proof missing |
| 18 | Recruiter | /recruiter/drives | re-export HR drive list; reference composition unverified |
| 19 | Recruiter | /recruiter/drives/[jobId] | re-export HR detail; custom applicant modal A2-01 |
| 20 | Recruiter | /recruiter/home | re-export HR home dashboard; source only |
| 21 | Super Admin | /admin/colleges | directory uses DataTable; source teal alias fixed |
| 22 | Super Admin | /admin/module-access | settings/directories mixed; small action A2-04 |
| 23 | Super Admin | /admin/audit | report delegate; 40px invalid-state link |
| 24 | Public/auth | /login | alias re-export public auth; device a11y not inspected live |
| 25 | Quiz | /quiz | wizard entry PageLoading; safe exit source repaired C-01 |

## Rubric A–F / 21-check ledger

| Check | Independent audit result |
|---|---|
| A1 concrete sections | PARTIAL: §15.5 Save snippet is not executable A2-08 |
| A2 25 real routes | STATIC WALK COMPLETE above; no rendered/device acceptance |
| A3 full shared-component contracts | PARTIAL: defaults and ARIA still allow silent denied/error cases A2-05/A2-13 |
| A4 eight-state coverage | OPEN: §15.7 matrix written, no 8-state reference-route execution |
| B5 legacy colours + pair contrast | SOURCE-FIX canonical on-primary/links, but no whole-site scoped computed AA matrix |
| B6 consistent scale | FAIL: 40px/14px raw controls and min-h-screen exceptions |
| B7 legacy wording/IA | PARTIAL: actual copy retained in inspected routes; generic DataTable empty fallback invented A2-12; full parity diff absent |
| B8 source vs playbook | FAIL: host overlays, form example, permission default diverge |
| B9 30 affected prop/callsite regressions | OPEN: AST count only, not behaviour/screenshots |
| B10 no hover/prompt/popup/raw errors | FAIL: target=_blank in named workflows; no full-repo gate |
| C11 320/360/390 targets/thumb reach | FAIL in source A2-03/A2-04; physical bounds not measured |
| C12 phone card/sheet/footer | PARTIAL: DataTable/cards exist; roster actions hidden, custom applicant drawer |
| C13 WebView back/zoom/safe areas | FAIL: nested history popstate and viewport clamp A2-02/A2-10, HTTP links A2-07 |
| C14 slow/offline/retry | OPEN: 12s helpers authored; unguarded TPO Home fetches still fail |
| D15 WCAG landmarks/focus/labels | FAIL: reviewer drawer lacks focus trap; silent PermissionAction; label contract opt-in |
| D16 screen-reader async status | OPEN: DOM live labels exist, no VoiceOver/TalkBack/pagination evidence |
| E17 strict TS/unit | OPEN: tests authored, current same-revision pass not demonstrated |
| E18 render cost/100 rows | PARTIAL: formatter deduplicated, DOM still dual responsive render |
| E19 four reference specimens | OPEN: no working eight-state/width/browser specimens signed by owner |
| F20 atomized 100-point scoring | SOURCE-FIX §16.1, no inter-rater demonstration |
| F21 anti-drift 10 pathways | FAIL: see preventative ledger; current lint source is inconsistent with prohibited links |

### Top ten multi-lane drift risks and enforceable prevention

| # | Likely regression | Gate / test needed |
|---:|---|---|
| 1 | Reintroduced target=_blank | Full-repo AST check, source guard must execute before merge, zero unwaived matches |
| 2 | Nested overlay auto-dismisses parent | One overlay-stack history service + nested modal hardware-back integration tests |
| 3 | Raw 40px controls in non-allowlisted routes | Scan all TSX active controls and browser measure 44x44, not named-file allowlist |
| 4 | iOS zoom from native text-sm inputs | 16px enforced inputs and iOS 200% zoom fixture |
| 5 | Permission action disappears silently | Type-enforced visible denied/readonly feedback |
| 6 | Off-palette/low-contrast old aliases | Computed foreground/background pairing test both themes, not string existence |
| 7 | Responsive data silently hidden | Mobile recoverability ledger for each column and row action |
| 8 | Form snippets save nothing | Executable acceptance fixture for every canonical snippet |
| 9 | Eight-state references are diagrams only | Injected-state E2E fixtures with 5 widths and owner-approved hashes |
| 10 | Type-safe props break hydrated behaviour | Affected 30-callsite interaction + visual regression checks |

## Sign-off requirements / exact next step

1. Fix every reopened Audit 1 ID and A2 BLOCKER/MAJOR at the identified source lines; do not mark exceptions accepted by documentation edits alone. Re-run lint (including UX guard), strict typecheck, authored source + Vitest suites, and record command, SHA and exit code.
2. Exercise 320/360/390/768/1280 with seeded role-scoped data, eight injected states per reference, keyboard + 200% zoom + slow/offline/failure, mutable form drafts, real 100-row table, and 30 affected component call sites. Capture approved SHA256 screenshot/interaction baselines; do not fabricate.
3. Test Android hardware Back and WKWebView Back, notch safe area, landscape keyboard, nested/pending modals, file chooser/download and HTTP blocked links. Record focus/Escape/VO/TalkBack results on SAME commit.
4. Independently confirm exact legacy text/role navigation against golden parity data, full token contrast including dark tracker and all interactive states, and all role routes' non-bespoke action areas.

**Three riskiest unverified items:** (1) Android/iOS nested Back + overlay history integrity with unsaved/pending drafts, (2) real WCAG 2.2 AA keyboard/AT/focus/zoom behaviour at 320–390px, (3) same-revision passing typecheck/lint/Vitest/browser results and 30 affected call-site / four reference visual baselines.

**FINAL VERDICT: BLOCKED.** This audit is NOT authorization for page-level UI/UX restyling or for a third-audit sign-off.


## Re-verification

**Independent auditor:** chat-19. **Date:** 2026-10-18 (IST). **Rebased source:** current `main` at `307bd3fb2530c1fc4cdc8dc71f7500f6a4df842a`, including [chat-17] remediation and `UX-PLAYBOOK-CHANGELOG.md` A2-01..A2-14 crosswalk, read alongside the earlier 33-item Audit 1 matrix. **FINAL VERDICT: BLOCKED (including source level).** This is an adversarial code/doc/test *source* comparison; no claimed checkout, live CI pass, browser, mobile host or assistive-tech run. At inspection, `main` CI run `39087619230` was queued, not successful.

**Status interpretation:** `FIXED` means the specific source defect is now addressed as written—not that real-device or runtime tests passed. `STILL-OPEN` means a source counterexample, regression, required acceptance artifact or unverified cross-page contract remains. This ledger covers **all 5 reopened + 9 partial + 4 evidence-open Audit 1 rows and all 14 A2 rows** (32 distinct IDs). Earlier Audit 1 source-fixed statuses not requested for targeted re-verification remain subject to the original browser gate and have not been silently promoted.

### Per-finding verdict (32/32)

| ID | Source-level re-verdict | Evidence (main file:line) | Result / acceptance gap |
|---|---|---|---|
| C-02 | **STILL-OPEN** | `src/components/tpo/tpo-students-spreadsheet.tsx:209; src/components/tpo/tpo-spreadsheet-grid.tsx:143-149` | Still passes `mobileActionsCollapsible`, keeping roster actions inside collapsed `details` on phone; direct contradiction of the source test. |
| C-03 | **FIXED** | `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx:69-73; src/components/placements/placement-drive-workspace.tsx:409-412` | Named `target=_blank` survivors removed, 44px link bounds set; same-tab behavior now coded. |
| C-05 | **STILL-OPEN** | `src/components/ui/use-overlay-webview.ts:5-20,52-59,81-89; tests/unit/ux-audit2-overlay-history.test.ts:4-21` | Global cleanup counter ignores next popstate, not an event identified with a closing overlay; helper unit tests cannot establish event/route ownership or pending nested host behavior. |
| E-02 | **FIXED** | `src/app/(authenticated)/tpo/home/page.tsx:50-72,179-189` | All independently fetched Home sources now have catch/fallback; unavailable notice and dash KPI source semantics present. Fault-injection remains an external acceptance task. |
| F-02 | **STILL-OPEN** | `scripts/check-ux-anti-drift.mjs:47-56,67-85; tests/ux-audit2-source.test.mjs:22-28,78-85` | Guard expansion exists but mandatory source suite has two deterministic failing assertions (RV-01), and main-to-main diff scanning cannot cover unchanged unsafe legacy routes. |
| A-03 | **STILL-OPEN** | `src/components/ui/file-upload.tsx:29-57; docs/design-system/UX-PLAYBOOK.md:474-503` | Contracts and examples expanded, but picker transition does not clear former parent selection (RV-03); caller-level invalid/error fallback still optional. |
| A-04 | **FIXED** | `docs/design-system/UX-PLAYBOOK.md:408-468` | Canonical form now calls injected versioned `onSave` with conflict/network messages, in-flight guard and error focus; executable implementation, not blank save. |
| B-02 | **STILL-OPEN** | `src/components/ui/data-table.tsx:29-40,67-71` | Any slash-prefixed `rowHref` is treated as proof all mobile-hidden fields appear on detail route, but no actual field/permission recoverability contract is checked (RV-05). |
| C-06 | **FIXED** | `src/components/ui/use-overlay-webview.ts:62-70; src/components/ui/dialog.tsx:40-51; drawer.tsx:34-43; bottom-sheet.tsx:39-48` | 240px clamp removed; actual visual viewport height/top and scrollable modal body/footer now in source. Physical keyboard geometry not accepted. |
| C-07 | **FIXED** | `src/app/(authenticated)/mentor/calendar/page.tsx:44-113; src/app/(authenticated)/tpo/messages/page.tsx:160-177; src/app/(authenticated)/admin/module-access/page.tsx:65-73` | Cited controls now have 44px min height; no measured touch-rectangle/adjacency evidence. |
| C-08 | **STILL-OPEN** | `src/components/ui/file-upload.tsx:29-57` | Reject path clears parent, but toggling `pickerUnavailable` after selecting a valid file never clears parent `onFiles` state; source admits stale submission (RV-03). |
| D-02 | **STILL-OPEN** | `src/components/ui/form-field.tsx:3-23; docs/design-system/UX-PLAYBOOK.md:442-463` | Shared labelled/error control and demo good, but associations remain caller-optional, submit-focus/AT not demonstrated across real forms. |
| D-04 | **STILL-OPEN** | `src/components/shell/route-announcer.tsx:12-26; src/components/ui/pagination.tsx:19-38` | Route/query live announcer source retained; no independent hydrated route transition/focus or screen-reader acceptance record. |
| E-05 | **STILL-OPEN** | `src/components/ui/data-table.tsx:43-49,53-85` | Formatter evaluated once, but two responsive row trees are still serialized and no midrange phone 100-row DOM/hydration benchmark exists. |
| E-01 | **STILL-OPEN** | `scripts/ux-capture-references.mjs:20-76; docs/design-system/UX-PLAYBOOK-CHANGELOG.md:201-218` | Capture recipe requires external four-role/eight-state fixtures but none is checked/approved; four reference pages unaccepted. |
| E-03 | **STILL-OPEN** | `package.json:46-52; tests/ux-audit2-source.test.mjs:22-28,78-85` | Source test has two demonstrable failed predicates; latest same-revision CI was queued, not passed, and browser/AT evidence absent. |
| E-04 | **STILL-OPEN** | `scripts/ux-capture-affected-callsites.mjs:11-69; tests/ux-playbook-compatibility.test.tsx:17-65` | 30-callsite capture harness exists, but no populated manifest, executed captures, keyboard interactions or visual baselines were provided. |
| F-03 | **STILL-OPEN** | `scripts/ux-capture-references.mjs:20-76; docs/design-system/UX-PLAYBOOK-CHANGELOG.md:201-218` | No produced screenshot hashes or owner-approved golden fixtures; fail-closed script is not the requested accepted baseline. |
| A2-01 | **FIXED** | `src/components/hr/recruiter-applicant-review-drawer.tsx:5-15; src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:536-547` | Custom applicant dialog replaced with native shared Drawer, URL-driven history and accessible close path. |
| A2-02 | **STILL-OPEN** | `src/components/ui/use-overlay-webview.ts:7-20,52-60,83-89; tests/unit/ux-audit2-overlay-history.test.ts:4-21` | Pure tests check counter consumption but not component lifetimes or whether real popstate belongs to the queued `history.back`; global counter may swallow unrelated route Back (RV-04). |
| A2-03 | **FIXED** | `src/app/(authenticated)/mentor/calendar/page.tsx:44-52,59-112` | Always-visible search, shared 16px Input/Select, 44px form targets and phone FilterBar are in source. |
| A2-04 | **FIXED** | `src/app/(authenticated)/tpo/messages/page.tsx:160-177; admin/module-access/page.tsx:65-73; college/contacts/page.tsx:33-44` | Named 40px target sites raised to 44px; broader site sweep still depends on guard/browser geometry. |
| A2-05 | **FIXED** | `src/components/ui/permission-action.tsx:9-29` | Denied action renders reason by default, with explicit hide-sensitive choice for reviewed privacy cases. |
| A2-06 | **FIXED** | `src/components/shell/app-shell.tsx:79-82,112-114` | Nested shell min-h-dvh and safe-area top padding now present. |
| A2-07 | **FIXED** | `src/components/ui/third-party-link.tsx:11-14,28-46` | HTTPS/no credential validation and selectable destination prior to navigation in shared link. |
| A2-08 | **FIXED** | `docs/design-system/UX-PLAYBOOK.md:408-468` | No-op try replaced with typed, awaited `onSave`; failure/conflict and in-flight behavior documented in working JSX. |
| A2-09 | **FIXED** | `src/components/tpo/tpo-spreadsheet-grid.tsx:124-132` | Column resize/pin controls now min 44x44 with gap-2 and keyboard focus outline. |
| A2-10 | **FIXED** | `src/components/ui/use-overlay-webview.ts:62-70; dialog.tsx:40-51; drawer.tsx:34-43` | No 240px clamp; visualViewport offset accounted for and scroll container added. Device observation remains required. |
| A2-11 | **FIXED** | `src/components/ui/filter-bar.tsx:22-25,61-70` | Per-instance React useId supplies matching aria-controls/panel ID. |
| A2-12 | **STILL-OPEN** | `src/components/ui/data-table.tsx:19-27; tests/ux-audit2-source.test.mjs:78-82; UX-PLAYBOOK.md:681-683` | `empty` remains optional and generic 'No records to show' is invented despite playbook requirement; required-prop assertion is false. |
| A2-13 | **FIXED** | `src/components/ui/tooltip.tsx:4-17` | Icon-only summary gets contextual `label` prop or fallback accessible name. |
| A2-14 | **STILL-OPEN** | `src/components/ui/toast.tsx:23-32,39-54` | Error auto-timeout removed, but `slice(-3)` silently evicts old persistent error when fourth toast arrives (RV-02). |

**Disposition:** **16 FIXED**, **16 STILL-OPEN** of 32. By group: Audit 1 follow-ups 5 fixed / 13 open; Audit 2 A2-01..A2-14 11 fixed / 3 open. The reopened source-level C-02 defect and the required Audit 2 source-test contradiction are independently reproducible from literal source; remediation crosswalk assertions do not override this result.

### Newly identified remediation regressions and acceptance defects

**RV-01 — BLOCKER.** Evidence: `tests/ux-audit2-source.test.mjs:22-28,78-82; src/components/tpo/tpo-students-spreadsheet.tsx:209; src/components/ui/data-table.tsx:19-27`. **Issue:** Two current-revision source assertions cannot pass: roster test requires no `<TpoSpreadsheetGrid mobileActionsCollapsible` but the JSX still contains it; table test requires `/empty: ReactNode/` but prop is `empty?: ReactNode`. The `ux:audit:verify` gate runs `ux:audit:source`. **Required fix:** Restore visible roster actions, reconcile required/optional empty without fictional default, update tests only to a truthful normative contract; execute node --test and full gate on the exact commit.

**RV-02 — MAJOR.** Evidence: `src/components/ui/toast.tsx:23-32`. **Issue:** New sticky-error policy is contradicted by the four-item `current.slice(-3)` cap. On fourth toast, oldest undismissed error is removed even though no dismiss control was activated; any timer for an evicted informational toast is also not cleared. **Required fix:** Do not evict persistent errors; prioritize persistent error list/stack, cap only timed informational entries, clear timers when evicting, add overflow tests with >=5 errors.

**RV-03 — MAJOR.** Evidence: `src/components/ui/file-upload.tsx:29-57`. **Issue:** A valid file calls onFiles(files); subsequently switching pickerUnavailable=true replaces the picker with a status message but never invokes onFiles(null), leaving parent selection usable despite blocked picker. UI state and submission source diverge. **Required fix:** On capability/disabled transitions clear selected parent state and internal value (effect or explicit controlled contract), show blocking error and test valid→unavailable→submit/re-enable paths.

**RV-04 — MAJOR.** Evidence: `src/components/ui/use-overlay-webview.ts:7-20,52-59,83-89; tests/unit/ux-audit2-overlay-history.test.ts:4-21`. **Issue:** The module-global integer cleanup counter tags NO history entry or source overlay. A pending cleanup can therefore consume the next unrelated popstate if expected history.back is interrupted, and tests only call a pure helper with invented Events, not installed hooks/real history. **Required fix:** Use marker/generation-specific history ownership and integration test nested A/B, concurrent user route navigation, repeated rapid Back, React StrictMode effect cleanups and pending nondismissible dialogs.

**RV-05 — MAJOR.** Evidence: `src/components/ui/data-table.tsx:29-40,67-71`. **Issue:** All mobile-hidden columns disappear as soon as every rowHref is any slash-prefixed relative string, regardless of whether detail route actually renders the hidden field or grants view authority. A valid-looking URL is not a recoverability proof. **Required fix:** Require explicit column-level detail-field mapping/verified route schema or keep hidden column in disclosure; add per-field phone tests for missing/detail-denied routes.

**RV-06 — MAJOR.** Evidence: `scripts/check-ux-anti-drift.mjs:47-56,73-84`. **Issue:** AST guard only checks a named source allowlist plus git diff origin/main...HEAD. On a main-branch CI build that diff is empty; unchanged pages evade the check. Conditional/dynamic `target` props are also not matched by the string-literal-only attribute rule. **Required fix:** Gate entire tracked UI tree with incremental waivers, parse/evaluate JSX target expressions conservatively, and test dynamically constructed popup/40px classes; require baseline waivers rather than silent omission.

**New re-verification findings:** 6 (1 BLOCKER, 5 MAJOR; NIT 0). These cross-reference the still-open original IDs rather than inflating the 32-item original count. Highest-risk shared API changes are `DataTable` optional empty/default and hidden-data recoverability, `useOverlayWebview` global history ownership, `ToastProvider` nonpersistent capped errors, and `FileUpload` stale parent selection. `Dialog`, `Drawer`, `BottomSheet` and `FilterBar` now have safer size/ARIA primitives but must still be tested as nested real overlays under keyboard/back pressure; no screen-reader verification can be inferred from markup.

### Deterministic source check for the claimed passing guard

Both predicates in the checked `main` source are **false** before any browser/device considerations:

```text
C-02 source check: !/<TpoSpreadsheetGrid mobileActionsCollapsible/.test(tpo-students-spreadsheet.tsx)  => false
A2-12 source check: /empty: ReactNode/.test(data-table.tsx [contains 'empty?: ReactNode'])       => false
```

`package.json:46-50` wires those assertions into `npm run ux:audit:source` and `npm run ux:audit:verify`. These results were independently checked against fetched main source strings, not presented as a completed Node/Vitest run. Execute the real commands after making truthful repairs and capture exit codes. **Do not delete required tests or erase feature behavior to force PASS.**

### Explicit sign-off blockers and handoff

1. Restore truly exposed essential TPO roster actions, reconcile `DataTable.empty` API/legacy copy without default invented text, fix red source checks and run the full UX guard + typecheck/lint/source + unit suite on the same revision.
2. Replace counter-only global history suppression with route/marker-specific ownership and mount-level nested overlay tests. Verify real Android/iOS Back, React StrictMode, Escape, native dialog focus-return and compact keyboard viewport.
3. Keep persistent error messages visible under multiple toasts, clear stale file-parent state on picker capability changes, prove every hidden mobile column is reachable on authorized detail UI, and expand anti-drift beyond an unreliable main-branch diff.
4. Supply actually executed eight-state × four-reference × five-width captures, 30 affected callsite keyboard/visual checks, real screen-reader and WebView sessions, validated legacy-copy/contrast report, and owner-approved screenshot hashes. The newly authored capture *scripts* are not these outputs.

**Re-verification final verdict: BLOCKED — NOT SIGNED-OFF even at source level.** Do not initiate page-level UX rollout or represent the changelog's 14/14 source-remediation entries as independent acceptance.
