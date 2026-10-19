# chat-16 — source-level legacy SCSS comparison (2026-10-19)

Branch: `chatgpt/chat-16-b`. Reference sources: `docs/design/legacy-styles/pages___login.scss`, `components___form.scss`, `components___button.scss`, `components___variables.scss`, `docs/design/old-lms-shell-spec.md`, and the owner NORTH STAR block. The owner-prescribed centered white sign-in card takes priority over the **older split-screen** `.ln-auth-panelLeft/Right` styles in the SCSS.

| Detail | Legacy source value | Current owner North Star | chat-16 implementation |
| --- | --- | --- | --- |
| Logo | `42Students/lms2-fe/public/assets/images/logo.svg`, 151 x 37 | Logo mark + 42LMS wordmark top left | Exact original SVG copied to `public/assets/images/legacy-42lms-logo.svg`, rendered on login, error, legal, loading, marketing, and invitation surfaces |
| Primary brand accent | `$clrThird: #26bac7` | Solid button #0a7c88 and white text | Base #0a7c88, hover darkening; college tint resolved to contrast-safe variant; text #fff |
| Input surface | `.ln-login-input`: white; 1px #e9eff9; radius 10px; text #0a0517 | Same form skin | Exact border/background/text/radius; 14px 400, 20px line-height, .2px letter-spacing |
| Input geometry | `.ln-login-input`: padding 15px 10px | Match source | 15px 10px; 52px min-height (content line-height 20px + 30px padding + 2px border) |
| Input keyboard focus | SCSS 2px rgba(#26bac7, .15) halo | Visible focus, no regression | 2px teal halo plus accessible outline |
| Error input | SCSS border #ef4444; background rgba(#ef4444,.06); halo .2 | Match legacy | Exact scoped error input state |
| Placeholder | `.login-input`: #bbb9be; `.ln-login-input` inherits default | Match login page | #bbb9be on scoped OTP/contact fields |
| Label | `.ln-lb2`: 13px/600/16px #a9a7ae | Readable labels | 13px/600/16px #54505d for stronger contrast (explicit intentional accessibility adjustment) |
| Title | `.step-head__title`: 26px/36 mobile, 30px/40 at >=1200 | Sign in centered card; Inter; ~30px | 30px/40 desktop, 27px/36 mobile; #172033 and weight 600 |
| Card | Historical login panels are split full-height | Centered white card on soft grid | Width 468px, 1px #e5e9f0, radius 14px, 40/42/38px padding, soft two-stage shadow; mobile radius 12px, 30/24px padding |
| Tab controls | Historical page uses large `.login-radio` selections, not Email/Phone tabs | Email / Phone tabs | Segmented 40px-tall tab buttons on #f1f4f9; selected white + teal text; correct keyboard semantics retained |
| Button baseline | `.ln-btn`: 40px, 14/16px, radius 8; `.ln-btn--pri` asymmetric shape | #0a7c88, white, radius 9, 36px globally | Sign-in Continue/Verify min-height 40px and radius 9; owner colour/shape override applied |
| OTP | No matching legacy countdown component (earlier one-time OTP form) | Resend code timer and Get the code by email | Existing 30s/60s timers and channels preserved, digit typography 18px and .35em tracking |
| Footer | `.from-panel-footer a`: #54505d; mobile text 10px | Copyright, Privacy, Terms | #54505d links, 12px compact footer, copyright on platform and “Powered by 42LMS” on colleges |
| Base background | `$clrglobal: #f1f4f9` | Soft grid | Exact base colour and 28x28px ultra-light grid |

## Scope and non-visual invariants

All authentication API calls, existing validated email/phone/second-factor paths, step transitions, error copy, cooldown math, safe-return navigation, tenant scoping, signed-in redirects, support links, recruiter invites, company shares, and unsubscribe updates remain under their existing handlers. Only look/skin and selector hooks changed.

Public legal policies retain their full existing HTML content. Static privacy and terms pages now use the exact legacy wordmark as a CSS header image, responsive white canvas, Inter, readable 14px legal body, legacy teal link colour and keyboard focus outlines.

Shared authenticated shell/global CSS remains owned by chat-17/13/19. HR and recruiter message inbox pages were migrated to `text-primary-text`, `outline-primary` and shared Input/Select/Button where applicable. Secondary messages, data, and workflows are unchanged.

**Visual acceptance still required:** Platform /login (mobile/desktop), college-host login (logo and custom brand colour), Email/Phone, OTP/2FA, resend disabled and enabled, email fallback, invalid OTP, unavailable tenant, legal anchor navigation, every recovery state, invitations and company-share, and HR message/notification drawers. Source-level comparison cannot establish pixel-perfect match; no CI/typecheck/runtime inspection was performed per owner's instruction.
