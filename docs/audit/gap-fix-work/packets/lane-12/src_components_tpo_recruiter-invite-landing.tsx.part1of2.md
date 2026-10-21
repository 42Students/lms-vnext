# Work packet: edit src/components/tpo/recruiter-invite-landing.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-invite-token.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/shared-public-pages.md, docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-1-034-005  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:176-183: heading names college and optional reviewDrive info.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:181-186: company name but no `reviewDrive` title/detail.
- Fix: Restore named review-drive CTA/context when invite pertains to a drive.

## G2-1-034-009  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:43-49: preview collegeName/companyName/reviewDrive/contactName/designation/email.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:16-23: type Invite has college, company, contact, designation, contactEmail, expiresAt; no reviewDrive.
- Fix: Extend preview contract to reviewDrive and show in invite summary.

## G2-1-034-011  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:102: `PENDING_HR` accepted status produces pending login instruction.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:24: State excludes pending, S:26 only JOINED or failure.
- Fix: Restore existing-recruiter pending invite handoff, no silent/grant duplicate.

## G2-1-034-020  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:8-17: INVALID_MOBILE, FIRST_NAME_REQUIRED, COMPANY_EMAIL_REQUIRED and CODE_* map field errors.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:85-106,239: all errors shown in global InlineNotice.
- Fix: Render code/phone/name/email errors underneath matching input with aria-describedby.

## G2-1-034-022  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:98: 'We could not confirm that the invitation was accepted. Your form is still here; please retry.'
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:97-107: any successful JSON not verified for shape, immediately joins.
- Fix: Validate response outcome before showing success; avoid false confirmed joins.

## G2-1-034-039  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:98-99: preserves form on unconfirmed success payload.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:100-101: direct joined state without response check.
- Fix: Keep form until durable acceptance attested.

## G2-1-034-046  [P1] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:176-184: heading and reviewDrive explanatory sentence.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:181-186: heading but no reviewDrive.
- Fix: Restore drive mention exact wording when present.

## G2-1-034-051  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:97-99: checks response data object before joined status.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:97-101: accepts successful endpoint response without verification.
- Fix: Validate HTTP accepted payload shape before state transition.

## G2-1-034-054  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:28-35: Invite has college/company/reviewDrive/email/contactName/designation.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:16-23: typed Invite lacks reviewDrive and pending response.
- Fix: Extend data contract for drive and pending status.

## G2-20-031-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy recruiter invite required Work email and Your name, optional designation/mobile, then 6-digit OTP; read-only email after send `recruiter-invite/[token].js:185-216`.
- vNext now: vNext `src/components/tpo/recruiter-invite-landing.tsx:194-216`, name/designation/mobile/OTP flow but email read-only from invitation.
- Fix: Preserve read-only email for fixed invites, but make work-email editability conditional to legacy invite payload and confirm backend constraint.

## G2-20-031-082  [P1] GAP  facet F18  effort M
- Legacy: Legacy Recruiter accept Pending heading 'One more step' (`docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-153`)
- vNext now: New state never shows Pending (`src/components/tpo/recruiter-invite-landing.tsx:24-25`, `src/components/tpo/recruiter-invite-landing.tsx:161-167`)
- Fix: Add pending-result title and correct role-specific sign-in instructions

## G2-3-026-005  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-153`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:161-167`
- Fix: Expose an existing-recruiter pending consent page and sign-in navigation rather than representing every acceptance as completed join.

## G2-3-026-020  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:188-192`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:194-200`
- Fix: Re-enable work email required/type validation and editable typed email when no address was captured by TPO, if that legacy workflow is retained.

## G2-3-026-067  [P1] MISSING  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-151`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:161-167`
- Fix: Legacy One more step wording for PENDING_HR is not represented in vNext; implement pending state and copy.

## G2-3-026-081  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:188-192`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:193-201`
- Fix: Legacy accepts typed company email when TPO lead has none; vNext intentionally requires persisted email, but no owner-approved drop reason found.

## G2-3-026-082  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:146-153`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:161-177`
- Fix: Legacy existing-account pending consent view omitted without stated owner decision; do not silently treat this as finished parity.

## G2-1-034-023  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:75-76: status 404 or 410 invalidates; others map field or page error.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:103,121: only 404 specifically maps invalid; 410 may surface error string.
- Fix: Handle 410 expired uniformly without showing transport details.

## G2-1-034-026  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:167-169: joined Result with AntD icon and Sign in primary.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:163-166: textual PageHeader, sign-in Link.
- Fix: Restore result icon/primary button visual.

## G2-3-026-028  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:99-113`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:85-107`
- Fix: Map CODE_EXPIRED, CODE_LOCKED, WRONG_CODE and CODE_REQUIRED separately; vNext currently conflates failures to 404 invalid or generic 400.

## G2-3-026-029  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:8-17`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:85-107`
- Fix: Legacy field errors shown under email/name/phone/code; vNext sets a single actionError inline notice below form.
