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

| Finding | Severity | Source-level remediation and exact implementation | Acceptance/evidence status |
|---|---|---|---|
| **A-01** | MAJOR | `UX-PLAYBOOK.md` §12 marks `/learn`, `/college/people` and `/learn/courses/[deliveryId]` as redirects; links their actual `/learn/courses`, `/college/contacts`, and course tab catch-all leaf | Corrected documentation; route browser verification pending |
| **A-02** | MAJOR | Playbook §15.1–15.3 adds 320/360/390 wireframes and explicit TPO student, recruiter drive and calendar priorities, visibility, permissions and action ordering; TPO roster source priority keys | Source implemented; browser widths and collision interactions pending |
| **A-03** | MAJOR | Playbook §15.6 adds typed per-component call examples, all-control state matrix §5.1, do-not/error semantics, FormField and fallback API | Source authored; props require typecheck |
| **A-04** | MINOR | Playbook §§15.4–15.5 sets exact lg shell threshold, visualViewport keyboard fallback, native host Back protocol, privacy default, complete guarded form | Source concrete; iOS/Android host tests pending |
| **A-05** | MINOR | §15.7 gives 11 archetypes × 8 state variants and role-owned route examples; denied is not retry | Documented; injected state-browser evidence pending |
| **B-01** | BLOCKER | `globals.css` adds `--lms-on-primary:#1a1d21`, maps `--primary-foreground` and `--color-on-primary` transitively to ink, preserves `#26bac7`; existing `text-on-primary` now ink, `Button` explicitly uses alias, legacy `bg-primary.text-white` failsafe; `tests/ux-color-contrast.test.ts` | Contrast formula/test authored; no executed site-wide computed-style sweep |
| **B-02** | MAJOR | `data-table.tsx` adds `mobileHiddenReason` + route requirement, explicit `action` columns always visible, text-only h3; hidden fields without accountable recovery go to disclosure; typed/tested specimen | Source fixed; real phone/AT check pending |
| **B-03** | MAJOR | `tabs.tsx` disabled route tab renders inert aria-disabled span, missing controlled callback disables panel tab; `tests/ux-playbook-compatibility.test.tsx` | Logic authored, tests unexecuted |
| **B-04** | MAJOR | `filter-bar.tsx` single persistent filter subtree, distinct always-visible `search` slot, mobile overlay and GET form; Contacts uses one same form ID | Source fixed; phone hydration tests pending |
| **B-05** | MAJOR | `--color-primary-text` now resolves to accessible `--lms-link-text:#0e7c87`; selected route interactive labels use link token explicitly; canonical `--lms-primary-text` legacy source value remains untouched | Token/source fix; exhaustive rendered site scan pending |
| **B-06** | MINOR | scoped tracker dark theme defines `--lms-on-primary:#1a1d21` regardless of pale page foreground; link text pale for dark surfaces | Token source fixed; dark tracker screenshot/contrast pending |
| **B-07** | MINOR | `app-shell.tsx` and `mobile-navigation.tsx` use `lg:1024px` breakpoint, `w-64` and `lg:pl-64`; playbook §15.4 exact | CSS/source fixed; width measurement pending |
| **C-01** | BLOCKER | `learner-quiz-attempt.tsx` removes both native confirms and history-based `router.back`; guarded ConfirmDialogs, session draft save, known `/learn/allQuizzes` exit, deadline and pending confirmation | Source fixed; Android/iOS hardware Back and duplicate write tests pending |
| **C-02** | BLOCKER | `tpo/students/page.tsx` hides 52rem **branch intelligence** aggregate table on phone and adds mobile Branch cards; actual TPO student grid in `tpo-spreadsheet-grid.tsx` uses priority fields and always-visible row actions from `tpo-students-spreadsheet.tsx` | Source fixed; dense 320/360/390 screenshot/test pending; clarification in rebuttal |
| **C-03** | BLOCKER | Removed new-window targets in assessment, TPO drive and recruiter HR links; `ThirdPartyLink` provides validated same-tab link, selectable fallback | Named workflows fixed; whole-repo popup sweep pending |
| **C-04** | MAJOR | `filter-bar.tsx` no `matchMedia` remount, one render subtree; Contacts search associated by `form` ID; DOM values survive resize/rotation | Code authored; Playwright unsent-form test pending |
| **C-05** | MAJOR | `use-overlay-webview.ts` same-URL history marker, cancelable `lms:native-back`, pending close protection; Dialog/Drawer/BottomSheet/MobileNavigation integration; §15.4 host contract | Host integration and reentrant Back device test pending |
| **C-06** | MAJOR | `use-overlay-webview.ts` reads `visualViewport.height` and panels constrain to `--lms-visual-height`; safe area scrollable footer; §15.4 keyboard fallback | Physical WKWebView/Android keyboard geometry pending |
| **C-07** | MAJOR | Migrated audited TPO job/calendar, calendar leaf, admin college, TPO student and shared roster 40px actionable heights to 44px `min-h-11` | Source fixed in targeted paths; full pixel measurement pending |
| **C-08** | MAJOR | `file-upload.tsx`: `fileMatchesAccept` extension/MIME checks, invalid clears `onFiles(null)`, optional `fallback`/unavailable status, explicit server revalidation contract | Helper tests authored; upload host behavior pending |
| **C-09** | MINOR | `app/quiz/page.tsx` `min-h-dvh`; Suspense and quiz internal loading use bounded `PageLoading` (12s retry) | Source fixed; slow-network test pending |
| **D-01** | MAJOR | Shell skip link to `main#lms-main-content` with focus, 44px nav, lg breakpoint; MobileNavigation WebView hook | Source fixed; keyboard and screen reader confirmation pending |
| **D-02** | MAJOR | `form-field.tsx` deterministically links label, helper, error, aria-invalid; Faculty profile text editor migrated; `tests/ux-playbook-compatibility.test.tsx` | Source and test fixture authored; form focus/AT checks pending |
| **D-03** | MINOR | `skeleton.tsx` removes duplicate accessible-name label, keeps one sr-only status child | Source fixed; actual AT announcement pending |
| **D-04** | MINOR | `route-announcer.tsx` on pathname/searchParams changes focuses main and politely announces updated h1; shell `Suspense` boundary | Source authored; direct/client navigation SR validation pending |
| **E-01** | MAJOR | Contacts converts bespoke listing to shared DataTable while preserving read/role masked fields; Faculty text, repeatable, skills and metadata confirmations use shared controls; Mentor Board/Allocation add `PageHeader` while other sections already have nested Workspace header; all four have route loading/error | Improved, **not yet fully acceptance-closed**: Faculty editor still requires real storage readiness; eight states not demonstrated in browser |
| **E-02** | MAJOR | TPO Home separates nullable optional reads, displays partial warning/unavailable KPI instead of false 0, handles preview reads, checks batches in bounded concurrency groups of 4 | Source improved; fault injection/latency benchmark pending |
| **E-03** | MAJOR | Added `ux:audit:verify`, `ux:audit:source`, `ux:audit:unit`, source and component tests, `ux:capture` fail-closed capture script | **OPEN verification:** typecheck/lint/Vitest/Playwright/WebView/AT never executed in this lane; auditor/orchestrator must run |
| **E-04** | MAJOR | Native refs restored on Button/Select; `tests/ux-playbook-compatibility.test.tsx` asserts old props/semantic output; added AST guard/fixture; documented intended style changes | **OPEN verification:** ≥30 rendered impacted call-site visual snapshots and full compile not run |
| **E-05** | MINOR | `data-table.tsx` precomputes each row/column cell once for both responsive trees; regression test counts one formatter call per row; paging contract still ≤100 | Source optimized; benchmark 100-row DOM/hydration pending |
| **F-01** | MAJOR | Playbook §16 atomized 100 points into BR/MO/ST/FO/AX/HI/PE checks with exact step/evidence and 3 illustrative scorecards; zero credit for unrun check | Documentation fixed; independent auditor scoring comparison pending |
| **F-02** | MAJOR | TypeScript AST `scripts/check-ux-anti-drift.mjs`, integrated into `npm run lint`; source paths ban native prompts, `target=_blank`, 40px min targets and local white/teal class pairs; waiver file | Source authored; guard execution and scope expansion pending |
| **F-03** | MINOR | Four synthetic role/state fixtures `tests/fixtures/ux-reference-states.json`, `scripts/ux-capture-references.mjs` fails closed without dev role storage and generates 20 SHA256-marked viewport screenshots for owner review | **OPEN verification:** no genuine screenshots, approved hashes or owner approval available to author |

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

## Rebuttal to two specific Audit 1 source-location assertions

1. **C-02 — scope correction, not a rejection of the mobile defect.** The `min-w-[52rem]` table at `src/app/(authenticated)/tpo/students/page.tsx` is titled **Branch intelligence** and shows *branch-level aggregates* (branch, learners, registered, applying, placed and rate), **not** the Students roster. The real roster at the bottom of the same route is `TpoStudentsSpreadsheet` rendered through `TpoSpreadsheetGrid`, whose pre-audit source already had a `md:hidden` mobile `<ul>`. Nonetheless the branch table violated mobile access, and the actual roster initially buried actions/disordered priorities, so **both** were upgraded rather than marking C-02 dismissed.
2. **E-01 — precise PageHeader location.** The initial Mentor project route did not directly call `PageHeader` before `MentorProjectTabs`; however normal Overview/Team/Sprints/Resources/Activity routes render `ProjectWorkspace`, which already renders the project-title `PageHeader` within that leaf. The missing-title case was Board and Performance, which replace `ProjectWorkspace`; the remediation conditionally adds the route `PageHeader` for exactly those branches, avoiding two h1s on ordinary tabs. Full browser verification remains outstanding.
