# North Star visual sweep — chat-16 (2026-10-19)

Owner: chat-16. Branch: `chatgpt/chat-16-b`. Source reference: `docs/orchestrator/queues/master-queue.md` NORTH STAR; `docs/design/legacy-styles/pages___login.scss`, `components___form.scss`, `components___button.scss`, `components___variables.scss`, `docs/design/old-lms-shell-spec.md`.

## Priority and ownership
- Public/auth shell only; **no** edits to `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**`, sidebar, or top bar (owned by other lanes).
- Keep vNext page contents and behaviour: OTP, tenant routing, two-factor, resend, email fallback, validation, admin session rules, privacy/terms body copy, recruiter/invite workflows and unsubscribe semantics unchanged.
- Latest owner-specific target takes precedence where the historical old SCSS depicts the earlier dark-left/white-right login: this pass uses a centered white card, teal CTA with white label, grid background and top-left 42LMS wordmark.

## Implemented
| Surface | Changed files | North Star action |
|---|---|---|
| Root and /login, branded tenant login | `src/app/page.tsx`, `src/app/login-shell.module.css`, `src/components/auth/login-form.tsx` | White centered auth canvas, soft 28px grid, Inter stack, 42LMS mark, college logo/name, preserved branded backgrounds, 30px heading, Email/Phone tabs, #e9eff9 inputs, #0a7c88 9px Continue/Verify CTA, footer |
| OTP code step | same LoginForm + auth CSS | Existing resend countdown, email fallback, validation, double-code flow continue unchanged within matched shell |
| Forbidden, 404, render errors | `src/components/public/graceful-screen.tsx`, `public-screen.module.css`, `error-page-view.tsx`, `error-recovery-actions.tsx`, `src/app/login/error.tsx` | Shared logo, card, copy reference, retry/back/home actions, links, soft grid |
| Maintenance and offline | `src/app/maintenance/page.tsx`, `src/app/offline/page.tsx` | Branded static fallback routes, no backend maintenance rule changes |
| Public loading | `src/components/public/public-page-loading.tsx`; `src/app/{loading,login/loading,superadmin-login/loading,privacy-policy/loading,home/loading,forbidden/loading,auth/handoff/loading}.tsx` | Consistent visual shell, retains existing slow-load retry |
| Privacy and Terms | `public/assets/static/static-page.css`, `privacy-policy-view.html`, `terms-and-conditions-view.html` | Full legal body retained, Inter CSS load, responsive viewport, centered white legal canvas and legacy typography |
| Public invitations and email preferences | `src/components/public/public-auth-skin.module.css`; recruiter invite/join/retry, `src/app/campaign-unsubscribe/**`, company applicant-share page | Shared light grid and inherited font/palette without restructuring forms or verification flow |
| Marketing header | `src/components/marketing/marketing-layout.tsx` | Public nav reuses 42LMS logo-mark and wordmark |
| HR/recruiter messaging sweep | `src/app/(authenticated)/hr/conversations/**`, `hr/notifications/page.tsx`, `hr/activity/page.tsx`, `src/components/hr/{hr-recruiter-bell,recruiter-notification-bell,hr-notification-read-button,recruiter-conversation-reply-form}.tsx` | Replace direct teal usages with semantic `text-primary-text` / `outline-primary`, use `var(--radius)` for compact controls, switch reply controls to shared Button/Textarea |

## Review and handoff
- No code, tests, typecheck, or CI was run per owner's instruction.
- Source changes are **not a screenshot verification**. Orchestrator should compare old login at desktop + phone against /login on platform and a branded college domain, both Email and Phone/OTP/error/resend states. Ensure custom college colour contrast is acceptable and that legal pages retain scroll/anchors on phones.
- Legacy source has both earlier asymmetric CTA/radio styles and the newer centered-auth owner target; use the owner target above for final sign-off.
- Changes are committed directly to this lane branch; do not merge it into main without orchestrator review.
