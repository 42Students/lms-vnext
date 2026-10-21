# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/public-college-join-controller.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-8-026-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy page one centered Card maxWidth440, background #f5f7f9 (docs/legacy-source/frontend/src/pages/college-join/[token].js:86-90,110-119).
- vNext now: New max-w-xl responsive card with auth skin and pt-24 on phone (src/components/placements/public-recruiter-join-form.tsx:121-123).
- Fix: Measure card width, background, padding/vertical centering at 375/768/1280 against old CSS.

## G2-8-026-005  [P2] GAP  facet F02  effort M
- Legacy: Old single visible form ordering Work email, Your name, Designation, Mobile, Company name if unknown, Code (docs/legacy-source/frontend/src/pages/college-join/[token].js:119-149).
- vNext now: New Designation and Mobile hidden in Optional contact details disclosure by default (src/components/placements/public-recruiter-join-form.tsx:154-190).
- Fix: Preserve visible optional contact fields or document approved collapsible change.

## G2-8-026-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy invalid/warning Result and joined success Card states (docs/legacy-source/frontend/src/pages/college-join/[token].js:92-107).
- vNext now: New unavailable/blocked/joined branches within shared Card (src/components/placements/public-recruiter-join-form.tsx:123-144).
- Fix: Match detailed invalid/retry/success state hierarchy and explanatory subtitle.

## G2-8-026-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy invalid page shows sign-in link and instruction Already joined? Sign in ... (docs/legacy-source/frontend/src/pages/college-join/[token].js:97-99).
- vNext now: New invalid branch only says Ask placement cell for a new one, no Sign in link in this branch (src/components/placements/public-recruiter-join-form.tsx:124-128).
- Fix: Add Sign in action and existing-user guidance to invalid-link branch.

## G2-8-026-017  [P2] GAP  facet F06  effort M
- Legacy: Legacy Work email required, Ant type=email, readOnly when code sent (docs/legacy-source/frontend/src/pages/college-join/[token].js:120-123).
- vNext now: New type=email required max254 disabled when code sent (src/components/placements/public-recruiter-join-form.tsx:154-163).
- Fix: Preserve readOnly semantics or explicitly explain disabled field/error retry.

## G2-8-026-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy firstName required name, backend sanitizes up to100 (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:175-176,252-256; docs/legacy-source/frontend/src/pages/college-join/[token].js:124-125).
- vNext now: New single name maxLength150 (src/components/placements/public-recruiter-join-form.tsx:165-170).
- Fix: Reconcile full name input vs stored firstName100/lastName100.

## G2-8-026-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy Designation optional; backend cleans max150 (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:210-211,252-256).
- vNext now: New designation maxLength100 (src/components/placements/public-recruiter-join-form.tsx:174-178).
- Fix: Restore 150-character designation allowance or state new limit.

## G2-8-026-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy join creates or finds recruiter, company and college access; welcome, increments joins, rings TPO bell (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:170-228).
- vNext now: New join atomic user+profile+relationship+grant+audit+notification, increments joinsCount (src/modules/placements/public-join/join-service.ts:116-241).
- Fix: Preserve join notice and drive review policy while updating canonical IDs.

## G2-8-026-043  [P2] GAP  facet F12  effort M
- Legacy: Legacy existing college access -> ALREADY_JOINED, new grants default via companyJoin helper (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:218-219).
- vNext now: New explicit active unexpired grant returns ALREADY_JOINED, revoked grant REMOVED, new expiry from settings (src/modules/placements/public-join/join-service.ts:171-188).
- Fix: Document expired grant rejoin path and college-admin override semantics.

## G2-8-026-049  [P2] GAP  facet F15  effort M
- Legacy: Legacy join welcomes recruiter and sends placement-cell bell (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:218-222).
- vNext now: New event + inAppNotifications to TPO users, no recruiter welcome send visible in joined service (src/modules/placements/public-join/join-service.ts:189-224).
- Fix: Verify welcome email/notification parity and TPO destination.

## G2-8-026-050  [P2] GAP  facet F16  effort M
- Legacy: Legacy Card 440px max width, stack fields full-width at all breakpoints (docs/legacy-source/frontend/src/pages/college-join/[token].js:86-90,119-149).
- vNext now: New max-w-xl and two columns for optional fields >=768px, 44px mobile tap targets (src/components/placements/public-recruiter-join-form.tsx:121-123,171-190).
- Fix: Match old card width and single-column form layout at tablet if pixel parity mandatory.

## G2-8-026-051  [P2] GAP  facet F17  effort M
- Legacy: Legacy Ant Form validation places errors under field, loading button, Result statuses (docs/legacy-source/frontend/src/pages/college-join/[token].js:119-149).
- vNext now: New semantic labels, aria-busy form and focused error summary, no per-field errors (src/components/placements/public-recruiter-join-form.tsx:151-169,217-218).
- Fix: Keep aria-describedby per field and focus first invalid field on submit.

## G2-8-026-052  [P2] GAP  facet F18  effort M
- Legacy: Legacy invalid card exact This link is no longer valid and Ask placement cell... Already joined?... (docs/legacy-source/frontend/src/pages/college-join/[token].js:97-99).
- vNext now: New matches title but omits Already joined? Sign in with your work email. (src/components/placements/public-recruiter-join-form.tsx:124-128).
- Fix: Restore complete literal invalid-link guidance.

## G2-8-026-057  [P2] GAP  facet F20  effort M
- Legacy: Legacy preview opens counter updates when page loaded, concurrency handled DB increment (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:146-151).
- vNext now: New POST open useEffect guarded only per component mount; repeated mounts possible (src/components/placements/public-recruiter-join-form.tsx:24-32).
- Fix: Ensure at-most-once by token/browser session if analytics counts intended unique opens.

## G2-8-026-060  [P2] GAP  facet F21  effort M
- Legacy: Legacy uses RecruiterInviteCodeService and company-domain checker/email sender, public-link HMAC secret (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:28-54,153-168).
- vNext now: New HMAC OTP secret, Node MX lookup 3.5s timeout, email provider and DB-backed rate limits (src/modules/placements/public-join/send-code-service.ts:38-91,128-153).
- Fix: Verify email template, sender, delivery retries, MX acceptance and expected TTL.

## G2-8-026-061  [P2] GAP  facet F21  effort M
- Legacy: Legacy join bell to TPO, grant welcome and audit trail (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:218-227).
- vNext now: New activityEvents and notifications to active TPO, no direct provider call after join (src/modules/placements/public-join/join-service.ts:189-224).
- Fix: Audit recruiter welcome integration and open/join metric consistency.

## G2-8-026-054  [P3] GAP  facet F18  effort M
- Legacy: Legacy joined subtitle says on the college's placement address. We'll email you a code each time. (docs/legacy-source/frontend/src/pages/college-join/[token].js:100-105).
- vNext now: New ALREADY_JOINED subtitle uses different shorter phrase (src/components/placements/public-recruiter-join-form.tsx:135-142).
- Fix: Use old exact success message consistently for already joined.
