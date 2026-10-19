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
