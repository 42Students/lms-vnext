# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/public-company-join-controller.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/public-company-join-controller.md

## G2-6-026-001  [P2] GAP  facet F01  effort M
- Legacy: Public GET /api/v1/public/company-join/{token}, POST /{token}/send-code and /{token}/join (PublicCompanyJoinController.java:22-49).
- vNext now: join with token in body (page.tsx:6-20; send-code/route.ts:8-22; join/route.ts:7-18).
- Fix: Document URL/method/body adapter for deep-linked public invitations and API callers.

## G2-6-026-003  [P2] GAP  facet F02  effort S
- Legacy: Legacy public join screen centered 440px card on #f5f7f9 (company-join/[token].js:84-88).
- vNext now: vNext full-screen centered max-w-xl card, public auth skin and mobile padding (public-recruiter-join-form.tsx:121-124).
- Fix: Clone 440px max width, background, header margins and legacy card geometry.

## G2-6-026-005  [P2] GAP  facet F03  effort S
- Legacy: Legacy Sign in button primary in invalid and success states (company-join/[token].js:95-105).
- vNext now: VNext invalid branch renders explanatory text only, Sign in only in joined branch as underlined link (public-recruiter-join-form.tsx:124-142).
- Fix: Restore primary Sign in CTA in invalid-link state and button treatment on success.

## G2-6-026-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy fields all visible in single vertical form; resend is text-link (company-join/[token].js:117-143).
- vNext now: VNext designation/mobile hidden in Optional contact details disclosure; resend uses secondary button (public-recruiter-join-form.tsx:171-190,200-214).
- Fix: Expose optional fields in legacy order and match resend link styling.

## G2-6-026-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy join body email,code,firstName,lastName,designation,phone (CompanyJoinService.java:66-73).
- vNext now: VNext accepts token,email,code,name,companyName,designation,phone (form-model.ts:14-30).
- Fix: Map firstName/lastName to full name without losing distinct fields in existing recruiter profile.

## G2-6-026-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy first/last names capped100 each, designation150 (CompanyJoinService.java:151-155,168-178).
- vNext now: vNext name max150 and designation max100 (form-model.ts:14-22).
- Fix: Reconcile length and sanitizer policy, prevent unexpected truncation of legacy designations.

## G2-6-026-028  [P2] GAP  facet F09  effort S
- Legacy: Legacy error/invalid uses AntD Result panel (company-join/[token].js:90-105).
- vNext now: VNext renders PageHeader/paragraph instead of Result component (public-recruiter-join-form.tsx:124-145).
- Fix: Match icon, spacing and Result hierarchy for invalid and success.

## G2-6-026-030  [P2] GAP  facet F10  effort M
- Legacy: Legacy verified join creates/reuses recruiter, grants college, sends welcome email, increments joins and notifies TPO (CompanyJoinService.java:149-195,219-231).
- vNext now: VNext transaction creates/reuses user, profile, grant, TPO in-app event, increments joins (join-service.ts:59-241).
- Fix: Audit welcome email enqueue and exact company/TPO bell notification; do not claim email sent from shown writer.

## G2-6-026-035  [P2] GAP  facet F12  effort M
- Legacy: Legacy removed grant with revokedByUserType cannot be self-restored; active grant preserved (CompanyJoinService.java:257-277).
- vNext now: VNext any grant status REVOKED, or expired DRIVES, becomes REMOVED (join-service.ts:171-180).
- Fix: Allow deliberate approved rejoin for merely expired/unremoved grants when legacy would, while preserving explicit revocations.

## G2-6-026-037  [P2] GAP  facet F13  effort S
- Legacy: Legacy invalid link quiet 404 and sign-in instruction (PublicCompanyJoinController.java:51-54; company-join/[token].js:95-97).
- vNext now: VNext invalid rendered 200 heading with shorter help and no Sign in action (public-recruiter-join-form.tsx:124-129).
- Fix: Restore sign-in recovery in invalid state and clarify HTTP status intent.

## G2-6-026-039  [P2] GAP  facet F13  effort M
- Legacy: Legacy validation error appears next to relevant field, global error for other failures (company-join/[token].js:6-10,53-59,116-143).
- vNext now: VNext all errors in InlineNotice with focusable summary (public-recruiter-join-form.tsx:46,217).
- Fix: Add accessible per-field error with summary and correct focus target.

## G2-6-026-043  [P2] GAP  facet F16  effort M
- Legacy: Legacy centered 440px single column even desktop, 16px padding (company-join/[token].js:84-88).
- vNext now: VNext max-w-xl responsive form with md two-column optional details (public-recruiter-join-form.tsx:121-123,171-190).
- Fix: Clone legacy single-column 440px at desktop and 320px no overflow.

## G2-6-026-044  [P2] GAP  facet F17  effort M
- Legacy: Legacy Form.Item associates field errors, name/email/code focus and controls (company-join/[token].js:117-143).
- vNext now: VNext HTML label/Input with summary focus and pending guarded controls (public-recruiter-join-form.tsx:46,151-158,217).
- Fix: Mark aria-invalid/aria-describedby per erroneous field, restore focus after resend.

## G2-6-026-046  [P2] GAP  facet F18  effort S
- Legacy: Legacy invalid subtitle 'Ask the placement cell for a new one. Already joined? Sign in with your work email.' (company-join/[token].js:95-97).
- vNext now: VNext only 'Ask the placement cell for a new one.' (public-recruiter-join-form.tsx:124-129).
- Fix: Restore full recovery sentence and Sign in CTA.

## G2-6-026-047  [P2] GAP  facet F18  effort S
- Legacy: Legacy field label 'Your name', optional 'Designation' and 'Mobile' (company-join/[token].js:122-129).
- vNext now: VNext same literal labels but moves optional fields under disclosure (public-recruiter-join-form.tsx:165-189).
- Fix: Match label sequence and always-visible sections.

## G2-6-026-055  [P2] GAP  facet F22  effort M
- Legacy: Legacy link not time-limited by service live() beyond soft-delete (CompanyJoinService.java:233-237).
- vNext now: VNext schema mandates expiresAt; generator chooses year 9999 sentinel with follow-up needed (tpo-public-join-link-service.ts:143-150).
- Fix: Make lifecycle parity explicit and remove sentinel when schema supports permanent links.

## G2-6-026-045  [P3] GAP  facet F18  effort S
- Legacy: Legacy text 'Join with your {company} email...' (company-join/[token].js:110-115).
- vNext now: VNext generic 'Join with your company email...' ignoring linked company in subtitle (public-recruiter-join-form.tsx:145-149).
- Fix: Use companyLabel interpolation in subtitle.
