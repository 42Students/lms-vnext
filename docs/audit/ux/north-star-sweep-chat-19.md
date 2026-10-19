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
