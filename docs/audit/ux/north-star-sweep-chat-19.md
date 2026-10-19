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

- This sidebar change touches `app-shell.tsx` only for the fixed sidebar, logo and content-push class. Chat-13 owns the topbar, and its header work should be reconciled carefully at merge; no chat-13 topbar markup was intentionally changed here.
- Desktop layout push, hovering at width breakpoints, fast pointer transitions, focus-within expansion, overflow edge cases, TalkBack/VoiceOver, and mobile Escape/focus-return need interactive verification on the dev site.
- No scripts/CI/TypeScript, browser or PostgreSQL runs were performed. Source-created tests and source edits are **not** a claim of runtime signoff. Owners should validate at 320, 360, 390, 768, 1024 and 1280px.
