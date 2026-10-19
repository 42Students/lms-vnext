# NORTH STAR: chat-19 legacy sidebar and HR portal skin sweep (2026-10-19)

Scope: **sidebar shell/rail first**, followed by **style-token-only** updates across the HR pages and components. This does not restructure the owner-approved HR page content, data tables, forms, transitions or legacy copy. Changes are committed/pushed to `chatgpt/chat-19-b` only. Cloud CI and browser checks are intentionally not run in this lane.

## Desktop legacy sidebar (source: `docs/design/old-lms-shell.css`)

| Legacy contract | Implementation and evidence |
|---|---|
| Collapsed icon rail 96px; expand 256px on pointer hover or keyboard focus | `sidebar-legacy.css`, `app-shell.tsx`: desktop aside fixed at 96px, 256px `:hover/:focus-within`, `width .15s cubic-bezier(.2,0,0,1)` |
| Content pushes right rather than overlay | `.lms-shell-page` 96px left padding → 256px under `.lms-desktop-sidebar:is(:hover,:focus-within) ~ .lms-shell-page`, matching rail transition |
| White panel, hairline #f1f4f9 border, hidden scrollbar, no shadow | `sidebar-legacy.css`, nav viewport remains wheel/touch/keyboard scrollable |
| Group headings visible expanded only, 22px dividers collapsed | `SHELL_SECTION_LABELS`, `TPO_SECTION_LABELS`, `lms-nav-heading` CSS |
| Every item has real icon (no initials) | 61 registered navigation hrefs have explicit `SHELL_NAV_ICON_KEYS`; existing learner SVG assets retained; other items use typed inlined SVG paths; no uninstalled lucide-react import |
| Exact original sidebar mark (no text 42 STUDENTS LMS) | `ShellLogoMark` uses first three vector paths from `42Students/lms2-fe/public/assets/images/logo.svg`; both desktop and mobile headers show the mark |
| 15px labels expanded; active #eff8fa with 3px #26bac7 inset and #1a95a1 text; hover rgba(38,186,199,.07) | `sidebar-legacy.css`, accessible named links with `aria-current`, `aria-label` and focus ring |
| Count badges float onto icon collapsed and become trailing badges expanded | `lms-sidebar-badge` CSS and existing guarded TPO counter API / badges |
| Faculty and TPO should not mingle in the same list | `scopedShellNavigation` selects active teacher/TPO group on multi-role paths without removing either role's underlying permissions or routes |
| Keep phone drawer rather than use desktop expansion on phones | CSS breakpoint 768px, existing focus trap, Escape, focus return, overlay/drawer, 16rem width and visible labels |

Source test: `tests/unit/chat19-north-star-legacy-sidebar.test.ts`.

## HR page-level source sweep (22 routes)

Replaced repeated page-local `text-[var(--lms-teal-deep)]`/`text-[var(--lms-link-text)]` with shared `text-link`, `outline-[var(--lms-teal-deep)]` with old LMS teal focus-ring variable `outline-[var(--lms-primary)]`, and `rounded-[var(--radius)]` with the measured 9px control radius `rounded-[var(--lms-control-radius)]`. No page-specific business rules or content layout changed.

| Routes | Scope |
|---|---|
| `/hr/activity`, `/hr/calendar`, `/hr/company`, `/hr/company/reports` | Shared control/link/focus tokens |
| `/hr/conversations`, `/hr/conversations/[threadId]` | Tokenized controls and links, existing message/reply sections untouched |
| `/hr/drives`, `/hr/drives/[jobId]/interview-slots`, `/hr/drives/[jobId]/messages` | Search, row action and navigation tokens |
| `/hr/drives/[jobId]/rounds/editor`, `/hr/drives/[jobId]/rounds/editor/remove/[roundId]` | Edit/remove action link/focus tokens |
| `/hr/drives/new`, `/hr/drives/proposals`, `/hr/drives/recorded-outside` | Recruiter draft/proposal/history action tokens |
| `/hr/home`, `/hr/notifications`, `/hr/placements/jobs/[jobId]`, `/hr/round-results` | Today, notification, job detail and results tokens |
| `/hr/colleges`, `/hr/messages`, `/hr/placements`, `/hr/profile` | Already semantic or alias-only; inspected, unchanged |

**18 routes changed, 4 inspected without modifications**. The PageHeader, DataTable, loading/empty/error states, responsive structures and existing business wording remain as authored.

## HR child-component source sweep

Seven components had bypassed shell/global skin tokens and were updated: `hr-drive-draft-form.tsx`, `hr-notification-read-button.tsx`, `hr-recruiter-bell.tsx`, `hr-unsent-drive-alert.tsx`, `recruiter-decision-read-button.tsx`, `recruiter-notification-bell.tsx`, and `recruiter-profile-access.tsx`. In addition to the shared link/focus/radius substitutions, notification overlays use `shadow-[var(--lms-overlay-shadow)]` rather than generic high-elevation Tailwind shadows.

Source audit test: `tests/unit/chat19-north-star-hr-sweep.test.ts`, reading the canonical 22-route list and HR component folder. Tested assertions are **written but not executed**.

## Integration risks and handoff

- This sidebar change touches `app-shell.tsx` only for the fixed sidebar, logo and content-push class. The concurrent chat-13 `LegacyTopbar` integration was fetched from main and preserved in a two-parent branch merge; no topbar markup was intentionally changed.
- Desktop layout push, hovering at width breakpoints, fast pointer transitions, focus-within expansion, overflow edge cases, TalkBack/VoiceOver, and mobile Escape/focus-return need interactive verification on the dev site.
- No scripts/CI/TypeScript, browser or PostgreSQL runs were performed. Source-created tests and source edits are **not** a claim of runtime signoff. Owners should validate at 320, 360, 390, 768, 1024 and 1280px.


## Value-by-value second pass — 2026-10-19 (chat-19)

The second pass re-read `docs/design/old-lms-shell.css` and checked the actual desktop/mobile shell. Measured differences fixed:

| Old LMS value or behavior | Current implementation |
|---|---|
| 96px collapsed, 256px expanded; width and content push use **150ms cubic-bezier(.2,0,0,1)** | `sidebar-legacy.css`: `.lms-desktop-sidebar` and sibling `.lms-shell-page` |
| White panel, #f1f4f9 hairline border, no shadow | Retained exact panel tokens |
| Sidebar scroll body top **8px**, bottom **16px** | `app-shell.tsx`: `lms-sidebar-scroll pt-2 pb-4` |
| Footer padding **25px vertical / 16px horizontal**, hidden in collapsed rail | `lms-sidebar-role-details px-4 py-[25px]`; collapse/expand CSS applies to actual footer |
| Group heading 12px, weight 750, letter spacing .105em; divider 22px collapsed | Retained explicit old LMS values |
| Icon 24px box, 20px SVG, muted default **opacity .55** | `sidebar-legacy.css` corrected previous .7 opacity |
| Badge positioned **top:4px**, **left:50% + 5px**, scaled **.72** collapsed | Corrected previous 2px badge offset; expanded is trailing with original size |
| Active: background #eff8fa, 3px #26bac7 inset, text #1a95a1; hover rgba(38,186,199,.07) | Retained exact explicit colors, visible `:focus-visible` |
| Mobile drawer below 768px; no tablet-width phantom menu slot | `LegacyTopbar` wrapper corrected `lg:hidden` to `md:hidden` to match existing mobile drawer/desktop rail breakpoint |
| Topbar still needs role-scoped TPO college | Retained incoming `tpoCollegeId` prop while reconciling `app-shell.tsx` with main |

**HR portal second pass:** All 22 canonical `/hr` page files and the 19 reusable `src/components/hr` client components were inspected for numeric `rounded-[9px]`, generic focus outline classes and raw hex/ambiguous colors. The remaining numeric 9px corners were changed to `rounded-[var(--lms-control-radius)]`, and control focus classes to `focus-visible:outline-[var(--lms-primary)]`. The round-builder's formerly `rounded-md` buttons/links were aligned to the same 9px token. The 48 loading/error/not-found route-level surfaces were audited by their source patterns; nine conversation, messages and draft/proposal fallbacks had duplicate outer `p-5` removed so they sit on the single authenticated page canvas without added padding. No HR data behavior, form schema, permission boundary or content organization was intentionally changed.

Source-only adversarial checks: `tests/unit/chat19-sidebar-hr-value-parity.test.ts`. **Not executed**, per no-CI directive. Browser rendering, mobile/touch accessibility and compile integration remain for the final verification pass. These source checks do not claim visual pixel-parity proven on a running browser.


## Third pass: exact legacy asset and mobile-shell details

Measured against `docs/design/old-lms-shell.css` and `old-lms-shell-spec.md`:

- Removed the duplicated desktop logo-hover rule, so the rail's 20px expanded logo alignment is defined once.
- Navigation items with original asset SVGs now **always** use their legacy `icon` property; previously calendar/attendance/notifications without an `activeIcon` were silently replaced by a generic outline glyph. Original active variants are still used when available. Routes with no packaged SVG retain inline icons.
- Added the mobile-specific sidebar section heading rules from the measured old LMS: at viewports below 768px, headings remain readable and are 9px high, indented with `margin:12px 12px 6px 46px`, without desktop collapsed divider lines. The existing focus-trapped mobile dialog is maintained.
- Clipped horizontal scroll overflow without disabling vertical wheel, touch or keyboard scrolling. The visual collapsed count badge remains scaled to .72 at the icon, and the link's accessible name includes the pending count.
- Audited the non-alias `/recruiter/drives/[jobId]/change-requests` route in addition to the 22 canonical `/hr` routes. Its outline and radius are aligned with the old LMS.
- Swept HR-specific shared recruiter components in `src/components/placements/`: interview slots, placement portfolio, result controls, resume download, outside-platform recording, and applicant notes. Form and button corner radius now uses the shared 9px token; input focus uses the old 2px ring.
- Removed the full-size rounded/bordered/white wrapping card from `RecordedOutsideForm`, allowing the shared one-white-canvas contract to own the surface; preserved its grid, fields, validation and action. Removed only the duplicate outer `p-5` on the invalid-conversation-filters state.

These refinements are captured in `tests/unit/chat19-sidebar-hr-original-icons-and-secondary-surfaces.test.ts` alongside previous chat-19 source contracts. They were authored, not executed; no CI/typecheck/browser work was run.


## Follow-up after concurrent main integrations

A fresh source sweep of **all 22 canonical HR pages and all 19 HR client widgets** detected legacy-style regressions introduced by concurrent merges in recruiter notification controls, read/reply actions, feedback and one conversation link. The checks found literal `rounded-[9px]` and `focus-visible:outline-primary` classes after the earlier token pass. These were normalized again to `rounded-[var(--lms-control-radius)]` and `focus-visible:outline-[var(--lms-primary)]` without modifying route data or behavior.

The secondary `/recruiter` portal was also inspected: 16 of its 17 pages are re-exports/redirects of canonical `/hr` routes, and the independently rendered change-request page now uses the same old-LMS control tokens. Shared recruiter form, results, portfolio, resume and applicant notes components were included in the sweep. The old-LMS icon assets, 9px mobile group headings and 96px/256px push transition remain unchanged.

This is a **source-only parity audit**, not a claim of visually confirmed pixel equality: typecheck, CI, browser and accessibility execution remain outside chat-19 per the instruction.


## Fourth pass — branch synchronized and complete HR recovery chrome (2026-10-19)

Branch `chatgpt/chat-19-b` was fast-forwarded to main at `8175bfbde69c2ffbec45f33ac08453dfe68a31e4` before editing. Subsequent changes were committed only on `chatgpt/chat-19-b` with the `[chat-19]` prefix.

**Legacy sidebar:** Retained the measured 96px collapsed rail, 256px hover/focus expansion, 0.15s cubic-bezier(.2,0,0,1) push animation, original 42LMS logo and 3px teal active bar. Corrected icon opacity to remain .55, including hovered/active rows. Legacy copy source `docs/audit/legacy-copy-B.md` explicitly shows headings for TPO only, not recruiter or other portal groups: TPO continues displaying OPERATE/COORDINATE/INSIGHTS/ADMINISTRATION, while other grouped navigation uses responsive hairlines instead. Updated icon identities to match legacy DashboardOutlined/TeamOutlined/CommentOutlined/CheckCircleOutlined/FileTextOutlined/BuildOutlined roles, adding four SVG glyphs without a new dependency. Existing mobile dialog, focus trap, Escape key, floating badge and content-push behavior remain intact.

**HR page surfaces:** Reviewed all 22 canonical pages in `docs/orchestrator/ui-ux/pages-hr.md`. Replaced remaining nonsemantic `rounded-xl` and `rounded-lg` with shared `--lms-radius-card` (12px) and `--lms-control-radius` (9px), respectively, in 14 page files. Updated three recruiter controls in `src/components/hr` and applicant notes, recruiter portfolio and results controls in `src/components/placements`. Two empty-state wrappers in the Drives page no longer introduce an additional bordered surface around `EmptyState`. These are style/semantic-wrapper edits; business content, data access, actions and form fields were preserved.

**Errors, not-found and loading:** Inspected route-level `error.tsx`, `loading.tsx` and `not-found.tsx` under the HR portal. Replaced full white/rounded/bordered error wrappers with plain sections inside the single authenticated page canvas and upgraded raw recovery buttons to the shared `Button`. Normalized former small standalone error `h1` to legacy 30px/600/#172033, or `PageHeader`. Configured seven `GracefulErrorBoundary` route wrappers with `insideShell` and `homeHref="/hr/home"` so they no longer render a second full-screen fallback. Nested `<main>` loading/recovery wrappers were changed to `<div>` or `<section>`; changed the remaining loading-skeleton `rounded`, `rounded-xl` and literal `rounded-[9px]` classes to shared tokens across 13 loading files. No retry actions or user-facing recovery wording were removed.

**Source regression checks, authored only:** Extended `tests/unit/chat19-north-star-legacy-sidebar.test.ts` and `tests/unit/chat19-sidebar-hr-value-parity.test.ts`, and created `tests/unit/chat19-hr-recovery-canvas.test.ts` for headings, icon mappings, page/control radii, errors, loading and nested-main avoidance. These tests were not executed, per explicit no-code/no-CI instruction.

**Outstanding verification:** Legacy visual comparison at phone/tablet/desktop viewport widths, keyboard and screen-reader navigation, and TypeScript/unit/CI results require the later integration pass; no browser execution, typecheck, tests, CI or deployment was performed here. The audit documents source parity only, not pixel-perfect runtime confirmation.


## Fifth pass — synchronized to latest main, sidebar aliases and HR controls (2026-10-19)

- Merged current `main` at `a5d88d7cdfce161100ec7233f1d009e8e5b199d4` into `chatgpt/chat-19-b` with a two-parent merge commit `222c4119eed222ef9cd6708daaea0fb64378cb72`; preserved the branch's unmerged HR error/loading work, retaining newer main versions where they overlapped (HR messages error, HR notifications error).
- Re-read `docs/design/old-lms-shell.css`, `sidebar-nav.tsx`, `sidebar-legacy.css` and `shell-model.ts`. The 96→256px push, 150ms easing, 24px icon boxes, 15px labels, TPO-only headings, group hairlines, collapsed badges, 3px active inset bar and mobile drawer remain intact.
- Fixed the recruiter sidebar's route ownership so **Drives** stays selected through `/hr/placements`, `/hr/placements/jobs/*`, `/hr/round-results` and `/recruiter/drives/*`, while **Messages** owns both `/hr/conversations/*` and its `/hr/messages` alias. These are existing page aliases, not new navigation rows.
- Re-read every canonical HR page: the remaining broad raw-color/fixed-radius patterns were not present. Corrected one more notification bell outline class using `--lms-primary`.
- Matched old LMS underline tab styling in recruiter conversation kind and unread-only filters (active versus inactive state); changed employer college chooser corners from pills to the shared 9px control radius in `/hr/company`, `/hr/company/reports`, `/hr/home` and `/hr/drives`. Added `aria-current` to the selected company page college link.
- Re-read modified JSX Link opening/closing tags and confirmed balanced pairs in all modified link-heavy page files. No page content, forms, copy, query schemas or permissions changed.
- Added unexecuted source tests `chat19-sidebar-navigation-aliases.test.ts` and `chat19-hr-tabs-and-college-selector-skin.test.ts`; no runtime code, typecheck, CI, visual browser runs or deployment.

Pixel-comparison against a running old LMS and responsive keyboard/touch checks remain integration-verification work rather than a claim of tested pixel parity.


## Sixth pass — main resync, legacy recruiter aliases and canvas flattening (2026-10-19)

- Reconciled newly landed `main` commits twice by preserving lane-only changes in merge commits `4120b0459b592f62f0fa0191d5cde18a1371bc60` and `dd3f8c46956a793e7c5da2ac0eb14cc6a98af33f`. All new commits stay on `chatgpt/chat-19-b`; no direct `main` pushes.
- Sidebar active-item logic now recognizes alias entrypoints for **Today** (`/recruiter`, `/recruiter/home`), **Calendar**, **Company & Team**, **Messages**, **Drives**, `/hr/placements/jobs/*`, and `/hr/round-results` without exposing additional sidebar rows.
- Generalized multi-role rail scoping by active portal without changing permission checks or route handlers. Kept the College Admin placement-cell handoff and dashboard escape available. Source-only alias/scoping contracts were added but not run.
- Matched the old visual primitives more closely: white single canvas with compact ruled sections in HR Today, a linked metric summary strip for Today, a 5-item compact calendar summary strip, a ruled company reports summary strip, and hairline proposal rows. Preserved genuine event, drive, task, and action cards.
- Converted proposal history search/sort inputs and submit control to shared `Input`, `Select`, `Button` primitives while retaining existing query names, values, form method, export action and permissions. Reviewed complete `</Select>` closing tag.
- Revisited the **recruiter alias** error boundaries (including nested drive/round removal) so they render `insideShell` with the retry action and do not replace the authenticated page canvas. Mobile drawer open/close now use balanced 20px inline SVG glyphs, the old 9px control radius and matching teal focus rings; scroll area uses legacy 8px top and 16px bottom padding. Original focus trap/Escape/return-focus behavior remains.
- Added `chat19-hr-surface-parity.test.ts` and extended existing source tests to preserve route aliases, strips, one-canvas layout, shared controls and mobile SVG markup. Test files were authored but **not run**, per instruction. Typecheck/lint/CI/browser checks were also not run.
- Outstanding: screenshots and real browser comparison at mobile/tablet/desktop widths, runtime keyboard focus verification, and TypeScript/test execution by integration owner. Source review does not prove perfect pixel parity.


## Seventh pass — legacy hover scrollbar, multi-role isolation, and HR form/page polish

- Synchronized the lane to `origin/main` at `10ac677d5ab403f3c037d559c3321ac55c6cffa6` before editing; later merged advancing main at `7a059f2734f76a3b7d75842fd94aa6e2e3d6d635` without dropping lane changes. All writes are `[chat-19]` commits to `chatgpt/chat-19-b`; no direct main pushes.
- Rechecked the exact `old-lms-shell.css` rules. The icon rail keeps the 96px collapsed / 256px expanded widths, 150ms cubic-bezier movement, content push, 3px teal active bar, .55 icon opacity, 15px navigation labels and focus expansion. Added missing **thin 4px grey scrollbar only on expanded TPO** via `data-sidebar-portal="tpo"` and scoped CSS. Collapsed and other account rails still hide scrollbar chrome; mobile drawer is unchanged.
- Hardened multi-role navigation scoping: even a learner/teacher/mentor/TPO/recruiter role with one visible row no longer mixes with another role's sidebar. College Admin with another substantial workspace is likewise isolated, retaining the legacy single College Admin placement-cell handoff and existing dashboard fallback. No auth, role permission or route behavior changed.
- Removed nested full-width white card wrappers (while preserving content) in HR Drives deadline attention, drive discussion, round-removal confirmation, profile status and college access table. The recruiter Today **Next up** panel remains a distinct card as required by the legacy page anatomy.
- Migrated HR round editor's visible name/duration inputs, round kind/mode selects, primary create/update actions and round-removal confirm button to the shared `Input`, `Select`, and `Button`. Hidden form values, post actions, validation constraints, labels, editability and optimistic updated-at fields were preserved. Re-read explicit matching `</Select>` and `</Button>` tags after each edit.
- Added/normalized teal keyboard-focus outlines and selected-college `aria-current` where needed in recruiter Today, Drives, Company Reports, Notifications and Calendar. Replaced a nonlegacy thick ring on the calendar's clickable events with the shared 2px offset focus outline.
- Added unexecuted source checks for TPO scrollbar data scoping, one-row mixed roles and complete round editor shared component JSX. **No application execution, tests, typecheck, lint, browser tests, CI or deployment.** Responsive/browser visual parity remains unverified.


## Eighth pass — follow-up consistency after round editor and keyboard scan

- Existing `scopedShellNavigation` now strips multi-role portal disambiguators (such as `Courses · Teaching`) after selecting the active portal, returning exactly the original LMS navigation row labels rather than mixed-account qualifiers. Existing authorization and route definitions are unchanged. Authored a source-only assertion for this case.
- Converted the last raw discussion-opening submit control in the recruiter hiring-drive detail into the shared `Button` component, preserving the POST form and hidden college/job identifiers.
- Restored the standard 2px teal keyboard focus indicator and active selection accessibility metadata in HR notification college filtering, the recruiter Drives lifecycle tabs, and recruiter calendar event-category/view tabs. Removed a nonlegacy thick calendar event grid focus ring.
- Re-scanned the full `src/components/hr/` widget directory for non-token `rounded-lg/xl/md`, literal 9px radii, hard-coded Tailwind palette colours, and old primary focus classes. No further matches in the 19 canonical HR widgets at this main baseline.
- The implementation commits only to `chatgpt/chat-19-b`; no tests, compilation, lint, CI, runtime checks, deployments or browser screenshots were performed. This remains a source-level CSS/JSX legacy look sweep.


## Ninth pass — complete HR shared-control sweep and legacy icon alignment (2026-10-19)

- Checked live `main` versus `chatgpt/chat-19-b` before work: main `8049636671c97d9e4ef6476e2d41f219ab3d3fa4`, branch ahead/0 behind. No merge was needed. All changes were committed to chat-19's branch with the required prefix.
- Compared `sidebar-nav.tsx`, `sidebar-legacy.css` and `shell-model.ts` against the verbatim `docs/design/old-lms-shell.css`. Preserved 96/256px push rail, .15s easing, teal 3px inset active stripe, heading divider behaviour, collapsed badges, mobile drawer and the TPO-only hover scrollbar. Set the icon box to exact **20px SVG, line-height 1** while keeping its legacy 24px flex container and .55 opacity.
- Reviewed all **22 canonical `/hr` page sources** and **19 `src/components/hr/` UI components**. Fixed one remaining `rounded-lg` warning in Today and migrated the only remaining raw Drive Messages submit action to shared Button. Native hidden form fields remain native, intentionally.
- Converted HR draft authoring to 11 shared `Input` fields, 4 `Select` fields, one `Textarea`, and all 12 `Button` actions; removed its duplicate `inputClass` style string. No draft business state, round mutations, eligibility fields, storage handling or request wiring were changed.
- Migrated additional HR widget actions and fields: notification read/mark-all, conversation acknowledgement, recruiter designation/name/combined profile editors, private rating and note, request cancellation, stale-drive refresh, unsent draft dismissal, notification bell popovers, and the inline hiring-round editor. Retained specialized icon trigger sizing, confirmation dialogues, and private data/read receipts.
- Completed supporting recruiter applicant controls in `src/components/placements/`: private applicant notes, secure resume action and the result editor's bulk actions, outcome/score/rank inputs, reason selectors, candidate-message textarea and selection checkbox. Converted them to shared `Button`, `Input`, `Select`, `Textarea`, and `Checkbox` with original event/permission/selection logic intact.
- Re-read every edited JSX closing tag, matching `<Button>...</Button>`, `<Select>...</Select>`, `<Link>...</Link>`, and preserving the intentional self-closing `<Input />`, `<Textarea />`, `<Checkbox />`. Added `tests/unit/chat19-hr-shared-controls-complete.test.ts` with source-only checks for 22 pages, 19 widgets and three applicant controls; fixed regex escaping in that test. The tests were **authored but not run**.
- No typecheck, lint, build, CI, browser visual comparison, application execution, or deployment was run. Exact runtime pixel parity, interactions and accessible keyboard behaviour await the integration pass.
