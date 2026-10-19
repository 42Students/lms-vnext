# North Star sweep — chat-16 (2026-10-19)

**Lane:** `chatgpt/chat-16-b`. **Scope:** public/login, sign-in and OTP, branded college sign-in, auth failure/recovery and error pages; recruiter/HR conversations, notifications and bell. Never alter page contents, authorization, delivery or tenant behavior. Authenticated shell is owned by chat-13/17/19.

**Reference:** `docs/orchestrator/queues/master-queue.md` NORTH STAR, `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, `legacy-styles/pages___login.scss`, `docs/audit/ux/chat16-legacy-token-compare.md`. Historical split-panel login in the SCSS is superseded by the owner's centered, grid-backed login card with the original logo.

## Inventory and disposition

| Surface | Files | Observed / next action |
| --- | --- | --- |
| Platform and college sign-in | `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/login-shell.module.css`, `src/components/auth/login-form.tsx` | Existing centered branded card, Email/Phone tabs, resend countdown, email fallback and 2FA from prior passes. Preserve behavior; harmonize form skin and keyboard states. |
| Auth redirects and failures | `src/app/superadmin-login/**`, `src/app/auth/handoff/**`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/components/public/**` | Shared error screen already adopted; check radius, shadow, control height and focus tokens. |
| Offline / maintenance / forbidden | `src/app/offline/**`, `src/app/maintenance/**`, `src/app/forbidden/**`, `src/app/placements/error.tsx` | Shared recovery components; check page chrome and text visibility. |
| Invite and legal | `src/app/college-join/**`, `src/app/company-join/**`, `src/app/recruiter-invite/**`, `src/app/privacy-policy/**`, `src/app/campaign-unsubscribe/**`, `src/components/public/public-auth-skin.module.css` | Existing matching logo and soft-grid skin. Preserve workflow and document contents. |
| Marketing public pages | `src/components/marketing/marketing-layout.tsx`, `src/app/home/**`, `src/app/platform/**`, `src/app/universities/**`, `src/app/enterprises/**`, `src/app/request-demo/**` | Shared primary and border skins; align radii, typography, button treatment. |
| HR/recruiter inbox | `src/app/(authenticated)/hr/conversations/page.tsx`, `[threadId]/page.tsx`, `src/app/(authenticated)/hr/messages/page.tsx`, `src/app/(authenticated)/recruiter/messages/page.tsx` | Remove repeated per-message cards; keep the existing sections, rows, filters, wording and threading intact, using dividers on one white page canvas. |
| HR notifications | `src/app/(authenticated)/hr/notifications/page.tsx`, `src/app/(authenticated)/notifications/page.tsx` | Present grouped notifications with thin dividers instead of redundant shell cards; retain counts and read states. |
| Reply/editor and bells | `src/components/hr/recruiter-conversation-reply-form.tsx`, `hr-recruiter-bell.tsx`, `recruiter-notification-bell.tsx`, `recruiter-conversation-read-control.tsx`, `hr-notification-read-button.tsx` | Shared controls and tokens; 9px radius, 36px controls, transparent page-level sections; popup may retain a border/shadow as an independent overlay. |

## Acceptance constraints

- Primary CTA `#0a7c88` with white text, radius 9, Inter, 30px/600/`#172033` page titles, page canvas inherited from shared shell.
- A single white canvas per authenticated page. Do not replace the individual content sections, forms, data or copy; convert decorative nested cards to light dividers.
- Inspect visual parity against an actual running legacy browser later; source review is not a screenshot diff. As directed, **no tests, typecheck, lint, CI or app execution** in this lane.
- Track changes only on `chatgpt/chat-16-b`; no writes to `main`.

## Execution log — source-level styling pass

**Branch-only changes already pushed; merged updated `main` into the lane without pushing to `main`.** The merge retains all other lanes' current shell and design token work and reapplies only chat-16's remaining delta.

- **Sign-in / OTP:** retained the real platform and college-host auth shell from prior chat-16 passes (original 151 × 37 SVG logo, centered 468px white card, 28px grid backdrop, Email/Phone tabs, second-factor flow, resend countdown and email fallback). Updated `login-shell.module.css` to consume the declared heading, body, border, page background, primary CTA and on-primary tokens, without changing request submission, session handling or contact validation.
- **Public errors:** `public-screen.module.css` now uses 30px/600 title at desktop, 26px mobile, 36px/9px primary/secondary controls, public background, shared heading/link/body/border/hover colours. `error.tsx`, `global-error.tsx`, `not-found.tsx`, maintenance, offline, forbidden, placements error and loading paths continue to use the shared branded recovery surface. Super Admin sign-in and retired handoff errors return to `/login` rather than the authenticated dashboard.
- **Public invite and campaign preference:** `public-auth-skin.module.css` now consumes the existing `--lms-canvas-radius` rather than an undefined radius token. Recruiter invitation, college/company recruiter join verification, transient invite preview errors, company-share code entry, campaign unsubscribe confirmation/loading and recruit-from-us form all use legacy colour/heading/CTA treatment and shared form components.
- **Marketing / public placements:** `marketing-layout.tsx`, home, platform, request-demo and public placements are aligned on common 9px controls, 12px panels, 30px/600 headings, 36px primary buttons and shared focus/hover tokens. Existing feature sections, legal content, links and marketing text remain unchanged.
- **HR/recruiter messages:** `hr/conversations/page.tsx` and `hr/conversations/[threadId]/page.tsx` flatten only unnecessary per-row/section cards into thin bordered sections and message lists on the shared white canvas. Search/order fields and submit buttons use shared Input/Select/Button components, and the reply form is a border-top continuation. Route loading/error states inherit canvas without redundant padding; recovery buttons use shared controls.
- **Notifications:** `hr/notifications/page.tsx`, global `notifications/page.tsx`, `hr-recruiter-bell.tsx`, `recruiter-notification-bell.tsx`, recruiter read/decision buttons and feedback/unsent alerts use legacy spacing/9px radii, 36px controls, appropriate surface tints and shared overlay shadow. Notifications remain role/college-scoped; no API, POST or read-acknowledgment changes.
- **Account auth surfaces:** membership chooser, no-membership recovery and device list now use shared border, heading and radius values; the device list is bordered/divided rather than nested in an additional white card.

**Ownership / verification:** TPO recruiter campaign composers are owned by chat-2/5/12 and are not changed in this lane; this lane covers the public email campaign unsubscribe workflow and HR recruiter message/notification surfaces. Visual screenshot comparison, mobile browser rendering and actual OTP/service journeys remain unverified because executing the application and CI/typecheck/tests were explicitly excluded. No claim of pixel-perfect runtime parity is made.

## Continuation pass — after syncing main, 2026-10-19

Synced the lane to newer `origin/main` and continued through previously unpolished files without touching shared shell, sidebar, top bar or global UI primitives.

| Area | Additional source files and skin work |
| --- | --- |
| Sign-in and OTP | `src/app/login-shell.module.css`, `src/components/auth/login-form.tsx`: theme-aware CTA hover on college hosts, legacy input and shell tokens, Email/Phone segmented tabs, focus states, status notice radii, and accessible resend/email fallback controls |
| Public error skin | `src/components/public/public-screen.module.css`, `public-auth-skin.module.css`: inherited legacy canvas radius, border colours, keyboard outlines and contrast on public invitation cards |
| Recruiter verification | `src/components/tpo/recruiter-invite-landing.tsx`, `src/components/placements/public-recruiter-join-form.tsx`: 30px heading, 9px/36px controls, shared branded CTA and mobile spacing |
| Public share and campaigns | `src/app/company-share/[token]/{page,error,not-found,loading}.tsx`, `src/app/campaign-unsubscribe/[token]/page.tsx`, `src/app/campaign-unsubscribe/confirmed/loading.tsx`: logo/grid skin and safe recovery, no changes to access-token verification or unsubscribe POST semantics |
| Public loading/error routes | `src/app/{placements,recruiter-invite,hr-invite,college-join,company-join,campaign-unsubscribe}/**`: standardized loading shells with the original logo and branded footer; missing placement pages route back to /home, avoiding a retry loop |
| HR/Recruiter notifications and messages | `src/app/(authenticated)/{hr,recruiter}/**/{error,not-found,loading}.tsx`, `hr/messages/**`, `hr/notifications/**`: remove redundant white cards around messaging errors, keep alerts and retry actions inside the shared authenticated canvas |
| Logged error recovery | `src/components/public/graceful-error-boundary.tsx`: optional `insideShell` view renders existing safe recovery wording, error reference and retry action inside the authenticated canvas *without dropping the prior safe client-error reporting and stale-chunk handling* |

**Intentional boundaries:** No changes to OTP delivery/verification, tenant scoping, company share access checks, messaging read receipts or campaign dispatch state; no changes to shared `src/components/ui`, the sidebar, top bar, or `src/app/globals.css`. All work is branch-only and committed in small batches. UI runtime/screenshot verification and CI/typecheck/lint/test execution were **not performed**, by owner direction. This is a source-level styling pass, not a claim of pixel-perfect browser parity.

## Shared overlay ownership continuation — 2026-10-19 (latest owner directive)

**New ownership, superseding the earlier “no shared UI” note for this pass:** chat-16 owns `dialog`/`modal`, `drawer`/`bottom-sheet`, `toast`, `tooltip`, `dropdown`/`menu`, and *only* the focus-ring / scrollbar blocks in `src/app/globals.css`. Other teams retain all remaining UI primitives, page-head/canvas and the shell.

- Synced `chatgpt/chat-16-b` against `main` before editing. Branch-only commits retain the latest shared shell work and do not write to `main`.
- **Dialog/drawer/sheet:** retained existing open/change, non-dismissible, escape/backdrop, focus-return and webview APIs; standardized the 44px close targets to 9px controls, improved overscroll containment, added decorative-close aria hiding, and preserved mobile safe-area handling.
- **Tooltip/dropdown/menu:** kept native disclosure and keyboard handling, restored legacy dark 8px tooltip styling without clipped horizontal content, and the legacy 6px dropdown radius/shadow with a compact 100px minimum menu and viewport-clamped height.
- **Toasts:** reused shared Button for dismissal without changing persistent error or auto-dismiss behavior; retained mobile visual-viewport positioning, stacked notices and 12px outlined cards.
- **Scrollbars/focus rings:** extended the 2px legacy keyboard ring, 3px offset, 4px soft teal halo and hidden overlay scrollbars to bottom sheets and non-modal notification dialogs. Touch/inertial scroll and focus-visible cues remain available; no global token, theme, font or component ownership change was made.
- **Recruiter notifications and messaging:** converted popup notification actions to shared Button (primary/secondary/ghost as appropriate), flattened per-row decorative cards to hairline dividers, and replaced hard-coded legacy colors in the HR notification/conversation pages with corresponding CSS tokens. API requests, paging, unread counts, link destinations and read receipts are unchanged.

**Verification scope:** JSX opening and closing tag names were statically re-read on edited components; no application execution, tests, typecheck, lint, browser screenshot comparison or CI. Runtime/pixel-perfect parity still needs the owner’s final visual pass.

## Overlay and HR messaging continuation — second source pass

The lane was already descended from the current `main` (GitHub comparison: 0 behind), so no unnecessary merge was made. Changes were written as small `[chat-16]` commits on `chatgpt/chat-16-b` only.

| Area | Changes |
| --- | --- |
| Tooltip | Repaired an accidental literal `undefined` utility class and restored the legacy charcoal background and 6px × 16px padding, preserving the disclosure API |
| Menus and dropdowns | Arrow-key entry now skips disabled menu links; action links participate in menu traversal; initial ArrowUp focuses the final available item |
| Dialog, drawer and mobile sheet | Aligned neutral backdrops, footer surfaces and horizontal spacing with the legacy modal/notification-drawer reference, without changing dismissal or focus restoration |
| Focus and scrolling | Added the system Highlight focus outline for overlay controls in forced-colors mode while keeping the standard brand focus ring and invisible overlay scrollbars |
| Toast | Existing shared Button dismissal and bounded live viewport stack were rechecked; no changes to error persistence or dismissal timing |
| HR conversation list | Converted unread count pills to shared Badge, used token-based thin row dividers, and replaced a large loading card with individual loading rows |
| HR notification list | Converted unread labels to shared StatusBadge; page navigation now meets 44px mobile targets |
| HR conversation detail | Conversation-history pagination now uses 44px mobile targets; the thread loading view uses shared hairlines |
| HR notification bells | Used the existing SVG bell glyph rather than a platform-dependent emoji; capped large badge displays at 99+ while keeping full unread values in accessible labels |
| Live refresh | Conversation polling skips non-modal notification popups, avoiding unwanted refresh while recruiters are using them |

**Verification:** Source-level JSX open/close-tag and truncation checks were performed on modified TSX files. The runtime app, tests, typecheck, lint, screenshots and CI were intentionally **not** run. Visual parity requires a later browser pass.
