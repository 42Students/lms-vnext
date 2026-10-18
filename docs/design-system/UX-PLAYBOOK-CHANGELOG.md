# UX Playbook — shared component changelog

## 2026-10-18 · chat-17 initial authoring branch

Scope: `chatgpt/chat-17-b` only. This log records **authored, remotely committed** changes, not a claim that typecheck, browser audits, or three independent approvals passed. The orchestrator owns verification. Source rules: `UX-PLAYBOOK.md`, `UX-AUDIT-RUBRIC.md`, `lms-color-parity.md`, `src/app/globals.css`.

### Added shared components

| File | Export / API and purpose |
|---|---|
| `src/components/ui/card.tsx` | `Card` with semantic element, title, description and optional footer; 16/24px content padding |
| `src/components/ui/skeleton.tsx` | `Skeleton` with line/card/kpi/row/form geometry; visually reserved space, reduced-motion and live status |
| `src/components/ui/pagination.tsx` | `Pagination`, `paginationWindow`; URL links, 44px controls, bounded page selection, spoken current page |
| `src/components/ui/breadcrumbs.tsx` | `Breadcrumbs` with Next Link to parent and aria-current terminal crumb |
| `src/components/ui/stat-tile.tsx` | `StatTile` with en-IN numeric grouping, text-equivalent value and optional full-tile accessible link |
| `src/components/ui/tabs.tsx` | `Tabs`, `tabNextEnabled`; controlled tablist (Arrow/Home/End/tabpanel), or route-link navigation via `renderPanel={false}` and `item.href` |
| `src/components/ui/selection-controls.tsx` | `Checkbox`, `Radio`, `Switch` with native form inputs, labelled 44px interaction target |
| `src/components/ui/bottom-sheet.tsx` | `BottomSheet`, native modal focus trap/return, safe area and internal scroll |
| `src/components/ui/filter-bar.tsx` | `FilterBar`, inline filters on ≥640px, BottomSheet on phones, active count |
| `src/components/ui/tooltip.tsx` | `InfoPopover` and `Tooltip` alias based on focus/click-reachable disclosure, not hover |
| `src/components/ui/avatar.tsx` | `Avatar` and `avatarInitials`; image dimensions, initials and image-load-failure fallback |
| `src/components/ui/file-upload.tsx` | `FileUpload`, `fileSizeIsValid`; native chooser, local size validation and accessible error |
| `src/components/ui/page-loading.tsx` | `PageLoading` skeleton with 12s slow-state fallback and retry |

### Updated shared components — backwards-compatible public props retained

| File | Changes |
|---|---|
| `button.tsx` | Kept variant/size and native button props; optional loading/busy, ≥44px target, dark-on-canonical-teal contrast, safe error-subtle destructive fill, visible deep-teal focus |
| `input.tsx` | Kept native input/ref props; optional `error`, 16px type to avoid WebView zoom, contrast/focus |
| `select.tsx` | Kept native select/children props; optional `error`, native phone picker, ≥44px |
| `textarea.tsx` | Kept native textarea props; optional `error`, 16px font, resize, visible focus |
| `page-header.tsx` | Kept `eyebrow/title/description/actions`; one h1, word wrap, phone action row |
| `status-badge.tsx` | Kept `children/tone/className`; canonical semantic tints with legible foreground labels |
| `empty-state.tsx` | Kept `title/description/action`; responsive spacing, break words |
| `error-state.tsx` | Kept `title/description/action`; role alert, responsive panel, no exposed codes |
| `data-table.tsx` | Kept generic columns/rows/getRowKey/empty; optional `caption/rowHref/mobileLabel/mobilePriority`, desktop table + phone card with up to three secondary fields and “More details” disclosure for remaining fields |
| `dialog.tsx` | Kept open/onOpenChange/title/description/children/footer; optional dismissible, unique IDs, native focus containment and full-screen mobile panel |
| `drawer.tsx` | Same existing props, optional dismissible; phone full-screen, desktop right dock, safe-area footer, native modal |
| `confirm-dialog.tsx` | Same existing action props; cancel first, cannot dismiss when pending, controlled destructive action |
| `confirm-action-dialog.tsx` | Same legacy confirmation props, now composed with shared native Dialog instead of a custom unmanaged overlay |
| `toast.tsx` | Same Provider and `useToast().showToast` API; safe-area placement, 44px close, timer cleanup, announcement |
| `third-party-link.tsx` | Same href/label; replaced popup with same-tab http(s) link and selectable fallback URL for WebViews |
| `inline-notice.tsx` | Same tone/message/onDismiss/timeout props; high-contrast focus and ≥44px dismiss |
| `loading-state.tsx` | Same label prop; now delegates to Skeleton |
| `graceful-page-loading.tsx` | Same zero-prop API; consistent Skeleton geometry + 12s fallback |

### Four live route references — roles and composition

| Archetype / role | File | Integrated change and preserved behaviour |
|---|---|---|
| Directory / College Admin | `src/app/(authenticated)/college/contacts/page.tsx` | FilterBar phone sheet, URL query GET form and real service results, Pagination, StatusBadge; preserves masking/exports, role filters and existing strings |
| Editor / Faculty | `src/app/(authenticated)/teacher/profile/details/page.tsx` | Breadcrumbs, Card and responsive max width; retains existing permission check and server-loaded document |
| Detail tabs / Mentor | `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` | active-tab Breadcrumbs, Card and legacy tools; `src/components/projects/mentor-project-tabs.tsx` uses shared link-based Tabs, preserves ordered labels, route query and workspace data |
| Dashboard / TPO | `src/app/(authenticated)/tpo/home/page.tsx` | StatTiles from existing real counts/rows; retains work-queue, next actions, tenant services and links |

Supporting form behaviour: `src/components/people/faculty-profile-editor.tsx` replaces `window.confirm` with an accessible `ConfirmDialog`; existing save/version/receipt logic stays. Each of the four reference route `loading.tsx` and `error.tsx` boundaries (8 files) now use bounded shape-matched loading and graceful retry without raw stack/error codes.

### Unit and audit evidence

- `tests/ux-playbook-primitives.test.tsx`: named tests `UX-PLAYBOOK-01` through `UX-PLAYBOOK-09` exercise pagination windows and announcements, disabled tab traversal, file size, avatar initials, semantic mobile/desktop table, skeleton markup, route-link tabs and en-IN KPI grouping. **Authored but not executed in this lane.**
- **No runtime/browser proof claimed.** Orchestrator must execute `npm run typecheck`, `npm run lint`, `npm test -- tests/ux-playbook-primitives.test.tsx` then full tests, audit role/mobile route matrix at 320/360/390/768/1280px with keyboard, VoiceOver and TalkBack. Follow `docs/design-system/UX-AUDIT-RUBRIC.md` for three sign-offs.
- Candidate weak spots for auditors: dense legacy forms not yet converted to reusable FormField wrappers; native-app back-button interception/keyboard in embedded WebViews is host dependent; legacy teal-on-white older call sites outside modified components may fail WCAG AA; new shared components have not been swept against 30+ call sites; `FilterBar` switches layouts after media-query hydration; existing complex reference pages retain non-playbook nested widgets. No page-level UX checklists marked DONE.


---

## 2026-10-18 — Audit 1 remediation (33 finding ledger)

**Baseline:** [UX-AUDIT-1.md](audits/UX-AUDIT-1.md) on `main`; branch `chatgpt/chat-17-b`. This ledger distinguishes **source-level repair** from **unexecuted acceptance**. The author cannot run the repo, browser or native mobile app in this connected GitHub environment. Source commits and generated tests do not constitute a passing audit. No UX lane may roll out more pages before the next auditor confirms results.

| Finding | Severity | Source-level remediation and exact implementation | Playbook section | Acceptance/evidence status |
|---|---|---|---|---|
| **A-01** | MAJOR | `UX-PLAYBOOK.md` §12 marks `/learn`, `/college/people` and `/learn/courses/[deliveryId]` as redirects; links their actual `/learn/courses`, `/college/contacts`, and course tab catch-all leaf | §12 | Corrected documentation; route browser verification pending |
| **A-02** | MAJOR | Playbook §15.1–15.3 adds 320/360/390 wireframes and explicit TPO student, recruiter drive and calendar priorities, visibility, permissions and action ordering; TPO roster source priority keys | §§15.1–15.3 | Source implemented; browser widths and collision interactions pending |
| **A-03** | MAJOR | Playbook §15.6 adds typed per-component call examples, all-control state matrix §5.1, do-not/error semantics, FormField and fallback API | §§5, 5.1, 15.6 | Source authored; props require typecheck |
| **A-04** | MINOR | Playbook §§15.4–15.5 sets exact lg shell threshold, visualViewport keyboard fallback, native host Back protocol, privacy default, complete guarded form | §§3, 6, 7, 15.4–15.5 | Source concrete; iOS/Android host tests pending |
| **A-05** | MINOR | §15.7 gives 11 archetypes × 8 state variants and role-owned route examples; denied is not retry | §§8, 11, 15.7 | Documented; injected state-browser evidence pending |
| **B-01** | BLOCKER | `globals.css` adds `--lms-on-primary:#1a1d21`, maps `--primary-foreground` and `--color-on-primary` transitively to ink, preserves `#26bac7`; existing `text-on-primary` now ink, `Button` explicitly uses alias, legacy `bg-primary.text-white` failsafe; `tests/ux-color-contrast.test.ts` | §§2, 17 | Contrast formula/test authored; no executed site-wide computed-style sweep |
| **B-02** | MAJOR | `data-table.tsx` adds `mobileHiddenReason` + route requirement, explicit `action` columns always visible, text-only h3; hidden fields without accountable recovery go to disclosure; typed/tested specimen | §§5–6, 15.1, 15.6 | Source fixed; real phone/AT check pending |
| **B-03** | MAJOR | `tabs.tsx` disabled route tab renders inert aria-disabled span, missing controlled callback disables panel tab; `tests/ux-playbook-compatibility.test.tsx` | §§5, 15.6 | Logic authored, tests unexecuted |
| **B-04** | MAJOR | `filter-bar.tsx` single persistent filter subtree, distinct always-visible `search` slot, mobile overlay and GET form; Contacts uses one same form ID | §§4, 6.2, 15.6 | Source fixed; phone hydration tests pending |
| **B-05** | MAJOR | `--color-primary-text` now resolves to accessible `--lms-link-text:#0e7c87`; selected route interactive labels use link token explicitly; canonical `--lms-primary-text` legacy source value remains untouched | §2 | Token/source fix; exhaustive rendered site scan pending |
| **B-06** | MINOR | scoped tracker dark theme defines `--lms-on-primary:#1a1d21` regardless of pale page foreground; link text pale for dark surfaces | §2 | Token source fixed; dark tracker screenshot/contrast pending |
| **B-07** | MINOR | `app-shell.tsx` and `mobile-navigation.tsx` use `lg:1024px` breakpoint, `w-64` and `lg:pl-64`; playbook §15.4 exact | §§3, 15.4 | CSS/source fixed; width measurement pending |
| **C-01** | BLOCKER | `learner-quiz-attempt.tsx` removes both native confirms and history-based `router.back`; guarded ConfirmDialogs, session draft save, known `/learn/allQuizzes` exit, deadline and pending confirmation | §§6.11, 7, 15.4 | Source fixed; Android/iOS hardware Back and duplicate write tests pending |
| **C-02** | BLOCKER | `tpo/students/page.tsx` hides 52rem **branch intelligence** aggregate table on phone and adds mobile Branch cards; actual TPO student grid in `tpo-spreadsheet-grid.tsx` uses priority fields and always-visible row actions from `tpo-students-spreadsheet.tsx` | §§6.1, 15.1 | Source fixed; dense 320/360/390 screenshot/test pending; clarification in rebuttal |
| **C-03** | BLOCKER | Removed new-window targets in assessment, TPO drive and recruiter HR links; `ThirdPartyLink` provides validated same-tab link, selectable fallback | §§6.11, 17 | Named workflows fixed; whole-repo popup sweep pending |
| **C-04** | MAJOR | `filter-bar.tsx` no `matchMedia` remount, one render subtree; Contacts search associated by `form` ID; DOM values survive resize/rotation | §§6.2, 15.4 | Code authored; Playwright unsent-form test pending |
| **C-05** | MAJOR | `use-overlay-webview.ts` same-URL history marker, cancelable `lms:native-back`, pending close protection; Dialog/Drawer/BottomSheet/MobileNavigation integration; §15.4 host contract | §§6.11, 15.4 | Host integration and reentrant Back device test pending |
| **C-06** | MAJOR | `use-overlay-webview.ts` reads `visualViewport.height` and panels constrain to `--lms-visual-height`; safe area scrollable footer; §15.4 keyboard fallback | §§3, 6.3–6.4, 15.4 | Physical WKWebView/Android keyboard geometry pending |
| **C-07** | MAJOR | Migrated audited TPO job/calendar, calendar leaf, admin college, TPO student and shared roster 40px actionable heights to 44px `min-h-11` | §§6.5, 17 | Source fixed in targeted paths; full pixel measurement pending |
| **C-08** | MAJOR | `file-upload.tsx`: `fileMatchesAccept` extension/MIME checks, invalid clears `onFiles(null)`, optional `fallback`/unavailable status, explicit server revalidation contract | §§5, 6.11, 15.6 | Helper tests authored; upload host behavior pending |
| **C-09** | MINOR | `app/quiz/page.tsx` `min-h-dvh`; Suspense and quiz internal loading use bounded `PageLoading` (12s retry) | §§6.10, 8 | Source fixed; slow-network test pending |
| **D-01** | MAJOR | Shell skip link to `main#lms-main-content` with focus, 44px nav, lg breakpoint; MobileNavigation WebView hook | §§3, 9, 15.4 | Source fixed; keyboard and screen reader confirmation pending |
| **D-02** | MAJOR | `form-field.tsx` deterministically links label, helper, error, aria-invalid; Faculty profile text editor migrated; `tests/ux-playbook-compatibility.test.tsx` | §§5.1, 7, 15.5 | Source and test fixture authored; form focus/AT checks pending |
| **D-03** | MINOR | `skeleton.tsx` removes duplicate accessible-name label, keeps one sr-only status child | §§5.1, 9 | Source fixed; actual AT announcement pending |
| **D-04** | MINOR | `route-announcer.tsx` on pathname/searchParams changes focuses main and politely announces updated h1; shell `Suspense` boundary | §§9, 15.6 | Source authored; direct/client navigation SR validation pending |
| **E-01** | MAJOR | Contacts converts bespoke listing to shared DataTable while preserving read/role masked fields; Faculty text, repeatable, skills and metadata confirmations use shared controls; Mentor Board/Allocation add `PageHeader` while other sections already have nested Workspace header; all four have route loading/error | §§12, 14, 15.7, 17 | Improved, **not yet fully acceptance-closed**: Faculty editor still requires real storage readiness; eight states not demonstrated in browser |
| **E-02** | MAJOR | TPO Home separates nullable optional reads, displays partial warning/unavailable KPI instead of false 0, handles preview reads, checks batches in bounded concurrency groups of 4 | §§8, 15.7 | Source improved; fault injection/latency benchmark pending |
| **E-03** | MAJOR | Added `ux:audit:verify`, `ux:audit:source`, `ux:audit:unit`, source and component tests, `ux:capture` fail-closed capture script | §§14, 16.1, 17 | **OPEN verification:** typecheck/lint/Vitest/Playwright/WebView/AT never executed in this lane; auditor/orchestrator must run |
| **E-04** | MAJOR | Native refs restored on Button/Select; `tests/ux-playbook-compatibility.test.tsx` asserts old props/semantic output; added AST guard/fixture; documented intended style changes | §§5, 15.6, 17 | **OPEN verification:** ≥30 rendered impacted call-site visual snapshots and full compile not run |
| **E-05** | MINOR | `data-table.tsx` precomputes each row/column cell once for both responsive trees; regression test counts one formatter call per row; paging contract still ≤100 | §§5–6, 16.1 | Source optimized; benchmark 100-row DOM/hydration pending |
| **F-01** | MAJOR | Playbook §16 atomized 100 points into BR/MO/ST/FO/AX/HI/PE checks with exact step/evidence and 3 illustrative scorecards; zero credit for unrun check | §§14, 16–16.1 | Documentation fixed; independent auditor scoring comparison pending |
| **F-02** | MAJOR | TypeScript AST `scripts/check-ux-anti-drift.mjs`, integrated into `npm run lint`; source paths ban native prompts, `target=_blank`, 40px min targets and local white/teal class pairs; waiver file | §§13, 17 | Source authored; guard execution and scope expansion pending |
| **F-03** | MINOR | Four synthetic role/state fixtures `tests/fixtures/ux-reference-states.json`, `scripts/ux-capture-references.mjs` fails closed without dev role storage and generates 20 SHA256-marked viewport screenshots for owner review | §§14, 17 | **OPEN verification:** no genuine screenshots, approved hashes or owner approval available to author |

### Evidence and required post-push execution

The repo's `package.json` now exposes:

```sh
npm run ux:guard
npm run ux:audit:verify
npm test
UX_BASE_URL=http://localhost:3000 UX_MENTOR_PROJECT_ID=... \
  UX_STORAGE_COLLEGE=... UX_STORAGE_FACULTY=... \
  UX_STORAGE_MENTOR=... UX_STORAGE_TPO=... npm run ux:capture
```

The `ux:capture` command requires approved **disposable/development** account fixtures, never production credentials; the capture manifest's actual SHA256 hashes must be checked into a later audited commit only after real browser execution and owner sign-off. Then audit keyboard/contrast/zoom, lost drafts on viewport change, pending WebView back, slow-network resilience, and screen readers manually. **Tests, screenshots and device results have not been fabricated.** This source remediation is **not** the second audit's PASS.

### Final source additions after remediation ledger

- `scripts/ux-callsite-audit.mjs` and `npm run ux:callsites` use the TypeScript JSX AST to list source-linked shared-component call sites, require at least 30 authenticated usages and emit the first 30 for review. **This is not a substitute for executed before/after visual snapshots.**
- `scripts/check-ux-anti-drift.mjs` now parses the TypeScript/JSX AST (not only text matching) and covers all shared UI, the named quiz, TPO/HR/College/Admin high-risk routes and Faculty nested editors. It rejects real `window.confirm/alert/prompt/open` calls, new-window targets, `min-h-10` JSX class use and directly mismatched `bg-primary text-white` class pairs.
- `use-overlay-webview.ts` maintains a topmost-only overlay stack so one hardware Back cannot simultaneously close both a nested confirmation and its parent drawer. `FilterBar` also uses the shared Back/visualViewport behavior without remounting draft controls.
- `src/components/placements/placement-calendar-workspace.tsx` uses 44px leaf controls, not just its thin `/tpo/calendar` route wrapper. `src/components/people/faculty-profile-text-section.tsx`, `faculty-profile-repeatable.tsx`, `faculty-profile-skills.tsx` and `faculty-profile-metadata.tsx` now use shared accessible controls/confirmations, preserving versioned save behavior. `src/app/(authenticated)/college/contacts/page.tsx` now renders shared `DataTable` for both desktop table and mobile cards rather than retaining the bespoke visual list.
- `src/app/globals.css` keeps legacy teal unchanged but provides an emergency CSS fallback for old `.bg-primary.text-white` class pairs. New UI must use `text-on-primary` explicitly. `tests/ux-audit1-source.test.mjs` checks the source blocker repairs.
- `UX-PLAYBOOK.md` §16.1 now itemizes each of the 100 points as individually scored observable pass/fail conditions, with strict non-redistributed N/A evidence; §16's earlier category totals alone were insufficient.
- The fixture capture command explicitly fails without a nonproduction base URL, project identifier and four role-scoped session states. **No screenshot files, fixture secrets or false image hashes were committed.**

## Rebuttal to two specific Audit 1 source-location assertions

1. **C-02 — scope correction, not a rejection of the mobile defect.** The `min-w-[52rem]` table at `src/app/(authenticated)/tpo/students/page.tsx` is titled **Branch intelligence** and shows *branch-level aggregates* (branch, learners, registered, applying, placed and rate), **not** the Students roster. The real roster at the bottom of the same route is `TpoStudentsSpreadsheet` rendered through `TpoSpreadsheetGrid`, whose pre-audit source already had a `md:hidden` mobile `<ul>`. Nonetheless the branch table violated mobile access, and the actual roster initially buried actions/disordered priorities, so **both** were upgraded rather than marking C-02 dismissed.
2. **E-01 — precise PageHeader location.** The initial Mentor project route did not directly call `PageHeader` before `MentorProjectTabs`; however normal Overview/Team/Sprints/Resources/Activity routes render `ProjectWorkspace`, which already renders the project-title `PageHeader` within that leaf. The missing-title case was Board and Performance, which replace `ProjectWorkspace`; the remediation conditionally adds the route `PageHeader` for exactly those branches, avoiding two h1s on ordinary tabs. Full browser verification remains outstanding.


## 2026-10-18 — chat-17 stabilization and source-to-playbook crosswalk

- Synchronized the author branch to the current `main` before writing. Added an explicit 33/33 finding-to-rule table at `UX-PLAYBOOK.md` §18 and a **Playbook section** field beside each pre-existing source-remediation entry above. This pass deliberately **does not modify any page implementation**.
- `docs/orchestrator/typecheck-errors.md` chat-17 lists six errors from the 02:35 CI snapshot. The missing `ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_CANCELLED` constant is **already present** in the current `src/modules/activity/taxonomy.ts` (retained, not duplicated); the five test calls now use an explicitly schema-typed drive edit fixture with active published-deadline and CGPA fields. No runtime behaviour was deleted.
- The audit remains **BLOCKED for unexecuted device/browser/AT acceptance**. The source-remediation ledger is not a claim that 33 browser cases passed. `unit-failures-r2.md` contains no chat-17 section, so no unit-failure queue work was undertaken.

## 2026-10-18 — Audit 2 source remediation (chat-17)

**Source baseline:** [UX-AUDIT-2.md](audits/UX-AUDIT-2.md). **Audit verdict remains BLOCKED** until independently executed verification. This pass implements named source fixes but does not claim Android/iOS, Playwright, accessibility or CI outcomes. No unrelated page redesign.

### New Audit 2 finding-to-fix crosswalk (14/14)

| ID | Severity | Playbook rule | Changed source | Source fix |
|---|---|---|---|---|
| **A2-01** | BLOCKER | §19.1 / §15.4 | src/components/hr/recruiter-applicant-review-drawer.tsx; hr/placements/jobs/[jobId]/page.tsx; Drawer | Replaced unmanaged applicant modal with shared Drawer, URL-backed close/Back and 44px actions |
| **A2-02** | BLOCKER | §19.2 / §15.4 | src/components/ui/use-overlay-webview.ts; tests/unit/ux-audit2-overlay-history.test.ts | Synthetic cleanup-pop ownership prevents nested parent dismissal; pending updates do not re-register hook |
| **A2-03** | MAJOR | §19.3 / §6.2 | src/app/(authenticated)/mentor/calendar/page.tsx | Persistent FilterBar search and 16px/44px shared Input/Select controls |
| **A2-04** | MAJOR | §19.3 / §6.5 | tpo/messages; admin/module-access; college/contacts | Replaced cited 40px targets with 44px links and buttons; enlarged guard coverage |
| **A2-05** | MAJOR | §19.4 / §8 | src/components/ui/permission-action.tsx | Visible permission-denied reason by default, explicit hide-sensitive mode for audited cases |
| **A2-06** | MAJOR | §19.3 / §3 | src/components/shell/app-shell.tsx | Use dvh for nested shell and safe-area padding for sticky header |
| **A2-07** | MAJOR | §19.5 / §6.11 | src/components/ui/third-party-link.tsx | Reject HTTP and credential URLs; show vetted HTTPS destination before leaving |
| **A2-08** | MAJOR | §19.6 / §15.5 | docs/design-system/UX-PLAYBOOK.md | Replace fake save with injected authorized versioned onSave, explicit error/conflict/live status |
| **A2-09** | MAJOR | §19.3 / §6.5 | src/components/tpo/tpo-spreadsheet-grid.tsx | Give resize/pin buttons 44×44 bounds, focus treatment and 8px gaps |
| **A2-10** | MAJOR | §19.2 / §15.4 | use-overlay-webview.ts; dialog.tsx; drawer.tsx; bottom-sheet.tsx | Remove 240px height clamp, account for visualViewport top, scroll action container |
| **A2-11** | MINOR | §19.7 / §5.1 | src/components/ui/filter-bar.tsx | Generate per-instance useId for panel and aria-controls |
| **A2-12** | MINOR | §19.7 / §8 | src/components/ui/data-table.tsx; admin/colleges; college/contacts; test fixtures | Require caller-supplied legacy-approved empty content rather than inventing generic copy |
| **A2-13** | MINOR | §19.7 / §9 | src/components/ui/tooltip.tsx | Give icon disclosures accessible label and expose context label API |
| **A2-14** | MINOR | §19.7 / §8 | src/components/ui/toast.tsx | Persist error messages until dismissed; length-aware timeout for other toasts |

**Blockers addressed first:** A2-01 moved the recruiter applicant reviewer into a route-backed shared Drawer; A2-02 centralized cleanup-pop event consumption so explicit close of nested B cannot also close A. Added `tests/unit/ux-audit2-overlay-history.test.ts` and source checks, but physical host verification is still open.

### Audit 1 re-verification disposition (5 reopened, 9 partial, 4 open-evidence)

| Audit 1 ID | Audit 2 status | Source or acceptance site | Disposition after this pass |
|---|---|---|---|
| C-02 | REOPENED | tpo-students-spreadsheet.tsx | Removed mobileActionsCollapsible on actual roster so row actions remain visible |
| C-03 | REOPENED | learner assignment page; placement-drive-workspace.tsx | Removed both popup-only destinations; updated mobile target |
| C-05 | REOPENED | use-overlay-webview.ts; Drawer | Cleanup pop ownership, pending-stable hook, URL-backed recruiter route mode |
| E-02 | REOPENED | tpo/home/page.tsx | Isolated independent Home fetch failures with null fallbacks and visible unavailable notice |
| F-02 | REOPENED | check-ux-anti-drift.mjs; tests/ux-audit2-source.test.mjs | Widened named files + branch-changed routes guard, popup expressions, source regression checks |
| A-03 | PARTIAL | file-upload.tsx; UX-PLAYBOOK §15.6 | Explicit picker-disabled guidance; typed component examples; entire caller sweep still pending |
| A-04 | PARTIAL | UX-PLAYBOOK §15.5 | Replaced no-op mutation example with typed versioned authorized onSave contract |
| B-02 | PARTIAL | data-table.tsx | Validate every hidden column recovery via actual internal row detail route; expose otherwise |
| C-06 | PARTIAL | use-overlay-webview.ts; shared overlays | Actual visual viewport height/offset, no 240px clamp, scrollable footer |
| C-07 | PARTIAL | mentor/calendar; tpo/messages; admin/module-access; college/contacts | Upgrade cited 40px controls; physical target measurement still pending |
| C-08 | PARTIAL | file-upload.tsx | Unavailable chooser explicitly blocks progress or offers provided alternative; server/device tests pending |
| D-02 | PARTIAL | form-field.tsx; UX-PLAYBOOK §15.5 | Typed FormField error relation used in canonical form; whole-route validation/AT sweep pending |
| D-04 | PARTIAL | route-announcer.tsx; pagination.tsx | Existing route/query live announcer retained; native screen-reader focus proof pending |
| E-05 | PARTIAL | data-table.tsx | Single formatter call and strict internal hidden-data recovery; 100-row DOM benchmark pending |
| E-01 | OPEN-EVIDENCE | ux-capture-references.mjs | Source recipe exists; four role × eight state browser fixtures and owner-approved captures still needed |
| E-03 | OPEN-EVIDENCE | package.json UX scripts; tests | Added Audit 2 source and overlay tests; same-commit CI/devices still required |
| E-04 | OPEN-EVIDENCE | ux-callsite-audit.mjs | Affected-callsite inventory available; 30 interaction/visual baselines not available |
| F-03 | OPEN-EVIDENCE | ux-capture-references.mjs; UX-PLAYBOOK §17 | Only real captured SHA256 files may be approved; no hashes fabricated |

### Changed source, tests and limits

- Popup survivors removed in learner assignment resources and employer drive portal: no `target="_blank"`; `ux:guard` now includes the cited routes, expanded critical surfaces and `origin/main...HEAD` changed TSX routes, with expression-based popup attributes covered.
- C-02 roster actions, E-02 TPO Home independent read recovery, tablet resize targets, mentor filter sheet and form, notched shell, permission fallback, HTTPS links, duplicate FilterBar IDs, exact-empty call sites, icon-only label and persistent error toasts updated.
- `npm run ux:audit:source` now runs both Audit 1 and Audit 2 source checks; `npm run ux:audit:unit` includes nested cleanup unit assertions.
- **No results invented.** E-01, E-03, E-04 and F-03 still require actual seeded reference browser states, same-revision passing checks, 30 affected call-site behavioural snapshots and approved real screenshot hashes; mobile/AT acceptance for all other rows remains pending. Status wording in this ledger is *implementation disposition*, not a third-party audit PASS.


### Audit 2 acceptance harness extensions (source only)

- `scripts/ux-capture-references.mjs` now requires `UX_REFERENCE_SCENARIOS_FILE` with actual **four roles × eight states** pointing to canonical role leaf routes. It rejects missing/redirected scenarios and waits for an explicit dev-only `data-ux-state` marker before taking each of the 160 viewport images. A ready screenshot may no longer masquerade as denied/error/stale evidence. No state-injection fixture is shipped or asserted to exist on production pages.
- `scripts/ux-capture-affected-callsites.mjs` plus `npm run ux:callsite:capture` requires `UX_AFFECTED_CALLSITES_MANIFEST` with **30 unique affected source call sites**, auth-scoped dev routes, selectors and storage states. It captures 320/390/1280 screenshots, checks visible bounds, horizontal overflow and keyboard focus (or requires an explicit noninteractive rationale). It produces real SHA256 hashes only after successful browser runs. It does not auto-approve them.
- Example invocation (with disposable development storage state files, never production credentials):

```sh
UX_BASE_URL=http://localhost:3000 UX_MENTOR_PROJECT_ID=<dev-id> \
 UX_STORAGE_COLLEGE=<dev-storage> UX_STORAGE_FACULTY=<dev-storage> \
 UX_STORAGE_MENTOR=<dev-storage> UX_STORAGE_TPO=<dev-storage> \
 UX_REFERENCE_SCENARIOS_FILE=<reviewed-8-state-manifest.json> npm run ux:capture

UX_BASE_URL=http://localhost:3000 \
 UX_AFFECTED_CALLSITES_MANIFEST=<reviewed-30-callsites.json> npm run ux:callsite:capture
```

Both commands **fail closed** if the fixture states or account evidence do not actually exist. Neither command has been executed in this GitHub-only authoring lane; screenshot hashes, screen-reader results and UX audit approval remain **OPEN-EVIDENCE**.

## 2026-10-18 — UX Audit 2 re-verification source closure (chat-17)

**Re-verification input:** [UX-AUDIT-2.md](audits/UX-AUDIT-2.md) §Re-verification. **Owner source sign-off policy:** only remaining BLOCKER or MAJOR *source defects* block source sign-off. Device, screenshot, AT and hosted runtime checks are orchestrator Audit 3 obligations and intentionally have not been manufactured.

| Finding | Cross-reference | Committed repair |
|---|---|---|
| **RV-01** | C-02 / A2-12 | Visible phone roster actions; required caller-owned DataTable.empty; source assertions aligned |
| **RV-02** | A2-14 | Persistent error stack survives >5 errors; timed notification evictions cancel stale timers |
| **RV-03** | C-08 / A-03 | Disable/unavailable transitions clear input and parent FileList via onFiles(null) |
| **RV-04** | C-05 / A2-02 | Owned history marker generation, no counter; real browser History API + ownership tests |
| **RV-05** | B-02 | Per-column mobileDetail fieldKey/href/canView required for mobile-hidden recovery, else disclosure |
| **RV-06** | F-02 | Whole git-tracked UI AST source guard; computed targets; expiring baseline SHA waivers |
| **D-02** | Accessibility | FormField enforces aria field associations at rendered child |
| **D-04** | Accessibility | Route/query announcements preserve form focus while reporting pagination |
| **E-05** | Performance | Single responsive DataTable row tree with 100-row source fixture |

**Implementation locations:** `src/components/tpo/tpo-students-spreadsheet.tsx`, `src/components/ui/{data-table,toast,file-upload,use-overlay-webview,form-field}.tsx`, `src/components/shell/route-announcer.tsx`, `scripts/check-ux-anti-drift.mjs`, `scripts/ux-guard-rules.mjs`, `docs/design-system/UX-GUARD-WAIVERS.json`, and their focused tests. `DataTable.empty` is required at every authored call site with the page's existing legacy copy, not a universal generated message.

**Regression tests authored:** `tests/ux-audit2-source.test.mjs`, `tests/ux-guard-scanner.test.mjs`, `tests/unit/ux-audit2-toast-overflow.test.ts`, `tests/unit/ux-audit2-file-upload-transitions.test.ts`, `tests/unit/ux-audit2-overlay-history.test.ts`, `tests/e2e/ux-overlay-history-ownership.spec.ts`, `tests/ux-playbook-primitives.test.tsx`, and `tests/ux-playbook-compatibility.test.tsx`. The `ux:audit:unit` and `ux:audit:source` scripts include the new suites.

**Run/evidence status:** These changes were authored through the GitHub connector, not through a local checkout. No passing typecheck, lint, Vitest or Playwright exit codes are claimed here. Actual browser/host/AT/screenshot evidence remains Audit 3 work. An independent auditor, not this ledger, grants source sign-off.

## 2026-10-18 — Audit 2 Re-verification 2 remaining MAJOR source fixes (chat-17)

**Source basis:** independent auditor `chatgpt/chat-19-b` §Re-verification 2 on `UX-AUDIT-2.md`. The main-branch report snapshot had not yet incorporated that section when this repair began. This pass addresses the two current MAJOR defects only; real device/AT/screenshot evidence remains Audit 3.

| Finding | Severity | Exact committed correction | Regression evidence authored |
|---|---|---|---|
| **R2-01 / E-03** | MAJOR | `tests/ux-audit2-source.test.mjs` now asserts `ownsOverlayHistoryEntry`, `lms-overlay` marker generation, nested destination ownership, no removed global counter and stable hook dependencies. It retains checks against the actual overlay unit and browser History API tests. | Source test covers marker identity/ownership and explicitly forbids `consumeOverlayCleanupPop` / `queueOverlayCleanupPop`. |
| **R2-02 / A2-14 / RV-02** | MAJOR | `ToastStack` uses a keyboard-focusable, scrollable, viewport-bounded notification region respecting `visualViewport.height`, `offsetTop` and top/bottom safe areas. Errors remain indefinitely until their own named dismiss button is activated, while informational toasts retain the prior timed cap. | `tests/unit/ux-audit2-toast-overflow.test.ts` renders 8 error alerts at 320×568 plus 10 with a compressed 320px visual viewport and verifies each distinct close control; the mandatory Audit 2 source suite checks viewport/scroll/focus contracts. |

The source gate remains `npm run ux:audit:source` and the full gate remains `npm run ux:audit:verify`. No CI or npm exit code is claimed unless executed by a runner. This is source remediation for independent sign-off, **not** a claim that the tests or Audit 3 have passed.
