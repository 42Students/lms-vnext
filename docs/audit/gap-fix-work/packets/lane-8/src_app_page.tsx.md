# Work packet: edit src/app/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md, docs/audit/gap2/lane-20/index.md, docs/audit/gap2/lane-1/auth-handoff-page.md

## G2-19-025-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy _app bootstraps once on page mount and redirects non-canonical alias; frontend/pages/_app.js:121-159
- vNext now: vNext SSR resolves Host but does not provide canonicalHost; src/app/page.tsx:94-108;src/modules/auth/request-tenant.ts:18-27
- Fix: Restore safe primary-verified canonical host redirect preserving path/search/hash

## G2-19-025-024  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET reads AppSettings/global host then tenant domain, college, canonical candidates, branding; PublicTenantController.java:43-173
- vNext now: vNext resolveRequestTenant, getPublicCollegeBranding, effectiveCollegeSignInCapabilities separately; src/app/page.tsx:94-113
- Fix: Document split calls and exact response fallback semantics for old clients

## G2-19-025-048  [P1] MISSING  facet F23  effort M
- Legacy: Legacy canonicalHost/tenantKey public response, secondary colour, loginMethods; PublicTenantController.java:80-171
- vNext now: vNext server-only RequestTenant and split brand/policy without public endpoint; request-tenant.ts:18-27;src/app/page.tsx:94-113
- Fix: Decide backward-compatibility for public and mobile consumers; specify versioned endpoint if approved

## G2-20-006-001  [P1] GAP  facet F01  effort M
- Legacy: Root `/` is dedicated sign-in page, opts out of dashboard layout; `docs/legacy-source/frontend/src/pages/index.js:11-32,66-73`
- vNext now: Platform unauthenticated root normally redirects to `/home`, only explicit /login or auth/recruiter/returnTo renders login; `src/app/page.tsx:91-103`
- Fix: Document new root marketing policy as intentional or restore / login entry on all hosts; test direct / for anonymous platform.

## G2-20-006-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy root uses hostname matching `emedha.jntukelearn.in` and `dgi.42lms.com` to choose JNTU/DGIPUC variants; `docs/legacy-source/frontend/src/pages/index.js:15-23,54-62`
- vNext now: Root tenant resolution only platform/verified college/unknown/unavailable, then shared LoginForm, no exact host variants; `src/app/page.tsx:94-114,156-177`, `src/modules/auth/request-tenant.ts:18-27,38-73`
- Fix: Map named college hosts to approved dedicated sign-in page treatments/flow or explicitly retire special handling; retain verified host security.

## G2-20-006-007  [P1] GAP  facet F02  effort L
- Legacy: DGIPUC login uses switch centered above form, custom background, right-side card; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:65-91`
- vNext now: New uniform centered card; no Student/Teacher switch; `src/app/page.tsx:116-190`
- Fix: Recreate branded DGIPUC right-hand card and Student/Teacher selection or document discontinued credential mechanism.

## G2-20-006-023  [P1] MISSING  facet F06  effort S
- Legacy: DGIPUC Student/Teacher toggle clears number/OTP/form on change; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:75-91`
- vNext now: No such toggle; contact channel change state in shared form differs; `src/app/page.tsx:173-177`
- Fix: Restore Student/Teacher reset semantics if that institution remains supported.

## G2-20-006-039  [P1] GAP  facet F10  effort M
- Legacy: Legacy redirects signed-in user to role-specific home via stored identity and postLoginPath; `docs/legacy-source/frontend/src/loginPages/Login.js:140-166,307-325`
- vNext now: New root signed-in redirect `/dashboard` unless validated returnTo; form verification uses service next or /dashboard; `src/app/page.tsx:91-92`, `src/components/auth/login-form.tsx:269-271`
- Fix: Ensure dashboard server router resolves seven roles equivalently; test each role including TPO guests and recruiter.

## G2-20-006-041  [P1] GAP  facet F10  effort M
- Legacy: Legacy tenant bootstrap from getTenantBootstrap client, page continues rendering even if bootstrap fails; `docs/legacy-source/frontend/src/loginPages/Login.js:96-98,283-302`
- vNext now: New server resolves tenant, unavailable renders warning and no LoginForm; `src/app/page.tsx:94-107,156-177`
- Fix: Ensure transient college lookup errors do not strand valid user; provide retry/main sign-in and preserve token without false unknown.

## G2-20-006-070  [P1] MISSING  facet F23  effort S
- Legacy: DGIPUC Student roll-number/PIN and JNTU dedicated login variants; `docs/legacy-source/frontend/src/pages/index.js:18-23,54-62`, `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:75-160`, `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:68-155`
- vNext now: New consolidated verified-college PHONE/EMAIL OTP, no host-specific variants; `src/app/page.tsx:94-114,173-177`
- Fix: Owner decide explicit removal; if still active tenants, prioritize regaining access before cosmetic clone.

## G2-1-024-020  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:95-99: missing token shows literal `Missing handoff token` inline.
- vNext now: src/app/page.tsx:36-39: generic retired notice, missing token not distinguished.
- Fix: Map invalid/missing link to safe error without credential echo.

## G2-1-024-022  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:501-517: 400 'token required', 404 'Invalid token', 410 'Expired token'.
- vNext now: src/app/page.tsx:36-39: uniform old-link changed warning regardless error.
- Fix: Differentiate expired, missing, already-used only if no token enumeration risk.

## G2-19-025-018  [P2] GAP  facet F07  effort S
- Legacy: Unknown host 404 TENANT_NOT_FOUND and This domain is not configured; PublicTenantController.java:73-78
- vNext now: vNext unknown kind rendered recovery text; src/app/page.tsx:164-172
- Fix: Keep legacy API error contract alongside accessible recovery wording

## G2-20-006-033  [P2] GAP  facet F08  effort S
- Legacy: Legacy session expiration shows Ant message.info for 4s; `docs/legacy-source/frontend/src/loginPages/Login.js:303-304`
- vNext now: New query auth=expired renders persistent warning status banner with same description; `src/app/page.tsx:41-46,150-155`
- Fix: Decide whether to match transient 4-second info toast or retain persistent safer notice; record intentional UI divergence.

## G2-1-024-023  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/auth/handoff.js:135: AntD global message.error(nextMessage) after failed consume.
- vNext now: src/app/page.tsx:150-155: inline role=alert warning, no toast.
- Fix: Choose intentional inline-only UX and verify against owner's exact copy requirement.
