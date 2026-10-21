# Work packet (wave 2): edit src/app/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-handoff-page.md, docs/audit/gap2/lane-1/login.md, docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/home.md

## G2-1-024-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:34-73: redirects to permitted role portal after consume; Admin dashboard, Instructor courses, Learner courses.
- vNext now: src/app/page.tsx:91-92: already signed-in redirect dashboard or safeReturnTo, no old role portal path.
- Fix: Map portal home per role after fresh sign-in.

## G2-1-024-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:153: label `Switching account - {targetLabel}` or `Switching account...`.
- vNext now: src/app/page.tsx:36-39: handoff retired notice, no switching caption.
- Fix: Preserve exact switching copy for active secure handoff.

## G2-1-024-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:158: failure heading 'Organization switch failed.'.
- vNext now: src/app/page.tsx:37-38: 'This old sign-in link has changed', different heading.
- Fix: Use approved retirement copy or exact legacy failure heading based on path.

## G2-1-024-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:161: primary AntD Back to Login and L:162 secondary Retry.
- vNext now: src/app/page.tsx:149-176: sign-in form visible, but no separate Retry or Back to Login buttons.
- Fix: Add actionable retry/restart for secure flow, or mark abandoned with explicit notice.

## G2-1-024-014  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:25-32: keeps a relative next path unless `//` or missing initial `/`.
- vNext now: src/app/page.tsx:4,91-92: safeReturnTo on returnTo; handoff next param discarded.
- Fix: Validate and preserve a same-portal returnTo without open redirect.

## G2-1-024-019  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:161-162: Back to Login calls window.location.replace, Retry calls router.reload; no form submit.
- vNext now: src/app/page.tsx:173-176 LoginForm uses phone/email input instead.
- Fix: Define retry and cancel paths consistent with explicit retirement.

## G2-1-024-032  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:49-55: faculty type ADMIN only /college-admin; other teachers /teacher or /mentor; learner /learn.
- vNext now: src/app/page.tsx:91-92: safeReturnTo generic, no visible portal prefix checks at landing.
- Fix: Restore role-aware home routing or prove downstream route guards cover cases.

## G2-1-024-046  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:153,167: exact `Switching account...` vs `Preparing account switch...` with suffix label.
- vNext now: src/app/page.tsx:37-38: `This old sign-in link has changed` with security explanation.
- Fix: Treat retirement copy as deliberate product decision, not pixel-identical legacy wording.

## G2-1-024-047  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:158,161,162: `Organization switch failed.`, `Back to Login`, `Retry`.
- vNext now: src/app/page.tsx:37-38: no same labels, inline warning instead.
- Fix: Map exact error-action copy where appropriate.

## G2-1-024-053  [P2] GAP  facet F21  effort S
- Legacy: docs/legacy-source/frontend/src/utils/switchMembership.js:11-30: legacy header membership switch constructs target host URL with token.
- vNext now: src/app/page.tsx:91-92: current login/returnTo flow; no hosted handoff integration.
- Fix: Verify supported college-switch UX independent of retired handoff.

## G2-1-024-057  [P2] GAP  facet F23  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:153-169: user gets bespoke handoff spinner/error/retry screen.
- vNext now: src/app/page.tsx:35-39: one generic retired warning and OTP form.
- Fix: Record owner-approved removal of bespoke UI or plan secure visual parity.

## G2-1-032-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:140-165: successful user routed per role, restricted portal return path.
- vNext now: src/app/page.tsx:91-92: active user goes /dashboard or safeReturnTo, no role-specific home.
- Fix: Map learner/mentor/teacher/admin/recruiter homes and safely honor allowed return paths.

## G2-1-032-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:658-681: LoginDecor, top header/brand and LoginRobot in ln2-card.
- vNext now: src/app/page.tsx:116-150: legacy SVG brand in header, branded card, no interactive robot.
- Fix: Restore robot and decor assets, placement, state animation for strict clone.

## G2-1-032-008  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:96-98: bootstraps tenant in background without blocking form.
- vNext now: src/app/page.tsx:94-107: server resolves tenant+capabilities before rendering.
- Fix: Keep auth entry visible during transient tenant bootstrap outage with safe disabled method.

## G2-1-032-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:681: LoginRobot with error 'oops' animation L:100-107.
- vNext now: src/app/page.tsx:116-180: no LoginRobot/animation.
- Fix: Add legacy robot (or approved retirement) and error state.

## G2-1-032-054  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:96-99: tenant bootstrap runs without blocking login; loaderSpin is limited.
- vNext now: src/app/page.tsx:94-107: full server tenant load before login card.
- Fix: Provide safe loading placeholder without blank first render.

## G2-19-025-032  [P2] GAP  facet F13  effort M
- Legacy: Legacy global/dev 200 or unknown 404; PublicTenantController.java:55-79
- vNext now: vNext platform/college/unknown/unavailable rendered distinct in login; src/app/page.tsx:156-172
- Fix: Match API status and bootstrap loading/unknown/offline/retry banners

## G2-19-025-038  [P2] GAP  facet F18  effort S
- Legacy: Legacy error message This domain is not configured; PublicTenantController.java:75-78
- vNext now: vNext title This address isn’t set up yet; src/app/page.tsx:164-170
- Fix: Use exact legacy login banner copy where required, retain server code for consumers

## G2-20-031-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/` tenant login via index.js:11-25,54-73 and `/home` marketing via home.js:28-43; marketing brand links `/` via MarketingHeader.jsx:22-29.
- vNext now: vNext `src/app/page.tsx:73-106` tenant-aware sign-in/landing and `src/app/home/page.tsx:5-34`; brand href `/home` `src/components/marketing/marketing-layout.tsx:15-20`.
- Fix: Keep tenant-aware sign-in; verify public-origin landing and align legacy marketing logo destination without breaking login.

## G2-20-004-002  [P2] GAP  facet F01  effort S
- Legacy: Brand logo points to `/` (marketing home), `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-31`
- vNext now: Brand logo points to `/home`, while root `/` conditionally redirects to /home for platform users; `src/components/marketing/marketing-layout.tsx:14-16`, `src/app/page.tsx:97-103`
- Fix: Keep visitor's canonical home navigation to / or document /home as the canonical replacement; verify college-host behavior.

## G2-20-005-001  [P2] GAP  facet F01  effort M
- Legacy: Public marketing home rendered from `/home` component but MarketingLayout path=`/` canonical; `docs/legacy-source/frontend/src/pages/home.js:28-31`, `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-73`
- vNext now: Marketing home lives at `/home` and platform root `/` can redirect to /home; `src/app/home/page.tsx:5-7`, `src/app/page.tsx:97-103`
- Fix: Make / vs /home canonical/route decision explicit; apply redirects and metadata accordingly.

## G2-20-005-062  [P2] GAP  facet F20  effort S
- Legacy: Home nav redirects/scroll state rely on pathname and scroll; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:11-20`
- vNext now: Root may server redirect signed-in or platform visitors to different destinations; `src/app/page.tsx:91-103`
- Fix: Test auth user entering / and brand link after logout, ensure no loop to sign-in.

## G2-20-006-003  [P2] GAP  facet F01  effort M
- Legacy: Header added only for DGIPUC branch, default login carries its own branding; `docs/legacy-source/frontend/src/pages/index.js:48-50`
- vNext now: Header brand row rendered universally; college branding optionally shown; `src/app/page.tsx:130-145`
- Fix: Match per-tenant header visibility/position for default, JNTU, DGIPUC.

## G2-20-006-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy `login-page` wrapper, `login-page--jntu` on JNTU; `docs/legacy-source/frontend/src/pages/index.js:25-32`
- vNext now: New 3-row viewport grid 100dvh, neutral background, no special JNTU wrapper; `src/app/page.tsx:116-120`, `src/app/login-shell.module.css:3-17`
- Fix: Restore tenant-specific layout class tokens or approve default single visual shell.

## G2-20-006-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy default includes LoginDecor and LoginRobot inside card; `docs/legacy-source/frontend/src/loginPages/Login.js:661-695`
- vNext now: New uses centered 468px card and fixed brand header, no LoginRobot/decor in page; `src/app/page.tsx:130-150`, `src/app/login-shell.module.css:86-101`
- Fix: Recreate decorative/interactive login robot and card ornamentation where strict old UI applies.

## G2-20-006-008  [P2] GAP  facet F02  effort M
- Legacy: JNTU uses dedicated JNTU-logo 140x135 above form and narrow right flap; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:68-83`
- vNext now: New shared header with 151x37 42LMS SVG and optional college logo 44px; `src/app/page.tsx:130-145`, `src/app/login-shell.module.css:47-68`
- Fix: Match JNTU image dimensions, flap placement and head alignment when college host recognized.

## G2-20-006-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy root title `42 LMS`, og:title `42 LMS`, OG description and image; `docs/legacy-source/frontend/src/pages/index.js:33-46`
- vNext now: Title dynamically `Sign in · 42LMS` or collegeName; no route OG fields; `src/app/page.tsx:14-17`
- Fix: Restore authored OG title/description/image and favicon metadata for sign-in, keeping tenant-aware page title.

## G2-20-006-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy default card uses phone/email tab switch, robot and consent text; `docs/legacy-source/frontend/src/loginPages/Login.js:649-654,713-725`
- vNext now: New form channel tabs and card styles plus footer legal links; `src/components/auth/login-form.tsx:114-123`, `src/app/login-shell.module.css:117-133`, `src/app/page.tsx:181-188`
- Fix: Verify consent sentence present next to each submit CTA, not merely Privacy footer; preserve tab presentation.

## G2-20-006-022  [P2] GAP  facet F06  effort S
- Legacy: Legacy form Phone or Email toggle; phone forced default and recruiter email activated via ?recruiter=email; `docs/legacy-source/frontend/src/loginPages/Login.js:81-96,125-130,713-725`
- vNext now: New channel default based on tenant policy primary, recruiter=email only if signin.email, can restrict channels; `src/app/page.tsx:173-176`, `src/components/auth/login-form.tsx:114-123`
- Fix: Treat channel-policy override as intended, test default when both methods available on each host.

## G2-20-006-043  [P2] GAP  facet F11  effort S
- Legacy: Legacy default login global phone mode can show membership choices; `docs/legacy-source/frontend/src/loginPages/Login.js:115-124,391-417,599-647`
- vNext now: New root only exposes permitted tenant channels and LoginForm; `src/app/page.tsx:173-177`
- Fix: Audit multiple-account authentication on global platform domain and verification membership scope.

## G2-20-006-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy loaderSpin initially false in default login; background bootstrap doesn't block sign-in; `docs/legacy-source/frontend/src/loginPages/Login.js:94-99,283-302`
- vNext now: New route awaits tenant resolution and branding/signin policy before rendering; `src/app/page.tsx:94-116`
- Fix: Use suitable loading state/skeleton and timeout recovery for slow bootstrap without delaying all users.

## G2-20-006-063  [P2] GAP  facet F19  effort S
- Legacy: Default legacy renders sign-in immediately; tenant bootstrap async; `docs/legacy-source/frontend/src/loginPages/Login.js:96-98,283-302`
- vNext now: New server awaits host validation, DB domain lookup with 15s TTL and college branding; `src/app/page.tsx:94-115`, `src/modules/auth/request-tenant.ts:29-32,55-99`
- Fix: Cache public branding/policy carefully, use nonblocking fallback for transient DB outage.

## G2-20-006-064  [P2] GAP  facet F20  effort S
- Legacy: Legacy uses sessionStorage login_redirect_attempted to stop loop and clear stale local session on repeat; `docs/legacy-source/frontend/src/loginPages/Login.js:307-330`
- vNext now: New redirect to /dashboard if authenticated context, no client redirect guard in page; `src/app/page.tsx:20-27,91-92`
- Fix: Test stale cookie/redirect loops and dashboard role routing after session expiry; add loop protection if needed.

## G2-20-006-065  [P2] GAP  facet F20  effort S
- Legacy: Legacy email mini-flow only with ?recruiter=email; `docs/legacy-source/frontend/src/loginPages/Login.js:87-91,125-130`
- vNext now: New recruiter=email selects EMAIL only if allowed by college policy, else primary; `src/app/page.tsx:173-176`
- Fix: Recruiter invitation email links must not silently land on phone method when disabled; provide explanatory fallback.

## G2-20-006-066  [P2] GAP  facet F20  effort S
- Legacy: Legacy unknown tenant bootstrap can still show global login with banner; `docs/legacy-source/frontend/src/loginPages/Login.js:283-302,406-417`
- vNext now: New unknown host displays warning and main login link without a form; `src/app/page.tsx:156-171`
- Fix: Document stronger fail-closed choice; verify UX for valid college aliases and transient errors.

## G2-20-006-067  [P2] GAP  facet F21  effort L
- Legacy: Client services `getTenantBootstrap`, SMS/email OTP service and memberships, role path resolution; `docs/legacy-source/frontend/src/loginPages/Login.js:13-24`
- vNext now: New server tenant-domain service, branding service, signin policy, auth routes and login runtime; `src/app/page.tsx:9-12`, `src/app/api/auth/login/start/route.ts:28-41`
- Fix: Trace all middleware/server/runtime adapters, map auth errors, ensure equivalent sends and role choice.

## G2-20-006-069  [P2] GAP  facet F22  effort S
- Legacy: Legacy root stores currOrg in Redux and local user session; `docs/legacy-source/frontend/src/pages/index.js:15-23`, `docs/legacy-source/frontend/src/loginPages/Login.js:946-971`
- vNext now: New server request context and tenant domain repo identity, optional college branding DB; `src/app/page.tsx:20-27,94-114`, `src/modules/auth/request-tenant.ts:3-7,55-73`
- Fix: Document model migration to server verified tenant/membership data; preserve identity security, don't port Redux localStorage as authority.

## G2-20-006-071  [P2] GAP  facet F23  effort S
- Legacy: Legacy default mascot and consent text, error toasts; `docs/legacy-source/frontend/src/loginPages/Login.js:99-108,649-654,680-695`
- vNext now: New single secure uniform card, inline errors, static branding; `src/app/page.tsx:130-190`, `src/components/auth/login-form.tsx:123-139`
- Fix: List changed microinteractions/visual assets for clone decision, retain accessibility and security improvements.

## G2-6-031-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy illustration and diagonal via distinct div layers to align form background across viewports (DefaultLoginBackground.jsx:1-20).
- vNext now: vNext neutral #f1f4f9 or brand-image cover with light overlay; no default diagonal layers (login-shell.module.css:3-31; app/page.tsx:139-146).
- Fix: Port legacy diagonal/illustration on Super Admin route with percent responsive positioning.

## G2-1-024-005  [P3] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:148: one center column maxWidth 520px, textAlign center.
- vNext now: src/app/page.tsx:148-155: branded sign-in centered card, width from login CSS not legacy handoff.
- Fix: Align handoff-specific max 520px card and vertical order when applicable.
