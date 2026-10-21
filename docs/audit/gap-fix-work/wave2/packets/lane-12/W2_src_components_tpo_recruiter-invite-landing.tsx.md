# Work packet (wave 2): edit src/components/tpo/recruiter-invite-landing.tsx

33 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-invite-token.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/shared-public-pages.md, docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-1-034-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:174-221: title/subtitle/alert/form/decline links.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:179-255: title, subtitle, extra Contact/Designation recap, form, decline buttons, sign-in hint.
- Fix: Remove/relocate extra recap/sign-in hint or approve new hierarchy.

## G2-1-034-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:185-186: AntD Alert showIcon above form on errors.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:239: InlineNotice below form, focus on error.
- Fix: Match inline error location/icon while preserving accessible focus.

## G2-1-034-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:217-220: decline and unsubscribe as centered link buttons.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:241-247: secondary full-width and ghost buttons in bordered block.
- Fix: Restore old link styling/placement.

## G2-1-034-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:125: 4-row Skeleton inside 440px Card.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:134-137: Skeleton variant=form count3 with 'Loading invitation…'.
- Fix: Match four-row skeleton height.

## G2-1-034-014  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:188-191: Work email readOnly only if invited email or code already sent; can be editable for missing invite email.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:194-200: always readOnly even when contactEmail null.
- Fix: Support legacy missing-email invite entry only with verified policy.

## G2-1-034-016  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:196-200: Designation optional; Mobile optional max14 inputMode tel.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:207-214: Designation max100, Mobile max30 (server normalizes to 10).
- Fix: Align client max14 with exact mobile format and semantics.

## G2-1-034-037  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:125-143: active Skeleton, load error Retry, invalid Result with Sign in.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:134-159: loading, load_error and invalid; invalid lacks Sign in CTA.
- Fix: Restore invalid-state sign-in button and exact subtitle.

## G2-1-034-038  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:139-141: invalid says 'Already joined? Sign in with your work email.'
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:153-156: omits already-joined sentence.
- Fix: Restore copy.

## G2-1-034-044  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:14-17: AntD field-level Form.Item errors associated with inputs.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:34-36,239: errorRef focuses summary notice, not field.
- Fix: Add field error associations/announce first invalid input.

## G2-1-034-048  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:139-141: 'This link is no longer valid', includes Sign in copy.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:153-156: abbreviated.
- Fix: Match invalid copy.

## G2-20-031-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy invitation/join centered 440px max white Antd Card on #f5f7f9 `company-join/[token].js:84-110;recruiter-invite/[token].js:119-125`.
- vNext now: vNext cards `src/components/placements/public-recruiter-join-form.tsx:121-150;src/components/tpo/recruiter-invite-landing.tsx:126-132` using shared public skin.
- Fix: Check and set exact legacy max-width, vertical centering, padding/background/border, skeleton spacing via common public skin.

## G2-20-031-061  [P2] GAP  facet F12  effort S
- Legacy: Legacy public invite error 404/410 invalid; field errors show precise backend codes (`docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:50-56`, `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:70-76`)
- vNext now: New 404 invalid but 410 not explicitly mapped for action branches (`src/components/tpo/recruiter-invite-landing.tsx:75-80`, `src/components/tpo/recruiter-invite-landing.tsx:101-106`, `src/components/tpo/recruiter-invite-landing.tsx:121-123`)
- Fix: Handle 410 expired explicitly across all invite POST actions

## G2-20-031-065  [P2] GAP  facet F13  effort S
- Legacy: Legacy invalid recruiter link offers sign-in even if already joined (`docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:136-143`)
- vNext now: New invalid page does not offer sign-in, only message (`src/components/tpo/recruiter-invite-landing.tsx:150-158`)
- Fix: Restore fallback Sign in navigation

## G2-20-031-074  [P2] GAP  facet F16  effort S
- Legacy: Legacy unsubscribe/recruiter background #f5f7f9 and centered card max440 (`docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:12-16`, `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:119-123`)
- vNext now: New public auth skin with max-w-xl or max-w-md and pt24 for unsubscribe (`src/app/campaign-unsubscribe/[token]/page.tsx:23-45`, `src/components/tpo/recruiter-invite-landing.tsx:126-132`)
- Fix: Match card positioning and canvas background

## G2-20-031-078  [P2] GAP  facet F17  effort S
- Legacy: Legacy recruiter Form.Item fields associate validations/errors to inputs (`docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:186-209`)
- vNext now: New actionError focus ref and non-input InlineNotice (`src/components/tpo/recruiter-invite-landing.tsx:34-36`, `src/components/tpo/recruiter-invite-landing.tsx:236-237`)
- Fix: Associate field errors with input IDs and assert focus target

## G2-3-026-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:136-143`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:150-159`
- Fix: Restore Sign in action to invalid-link state (legacy gives a direct /login button and already-joined guidance).

## G2-3-026-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:174-185`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:179-191`
- Fix: Legacy contextual review-drive sentence appears before company intro; vNext omits the drive explanation altogether.

## G2-3-026-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:186-223`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:193-255`
- Fix: Legacy Form and action links, server-field errors and code panel follow single Card order; vNext adds contact/designation separator and Already have an account row.

## G2-3-026-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:188-201`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:193-216`
- Fix: Legacy email field is editable when lead lacks email; vNext work-email input always readOnly and blank for that case.

## G2-3-026-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:206-213`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:223-236`
- Fix: Legacy OTP label includes resolved codeSentTo email, vNext reads invite.contactEmail; use address actually confirmed by send response.

## G2-3-026-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:145-164`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:16-23`
- Fix: Display the review drive name, expiry and company information in matching legacy order; missing reviewDrive despite available lead reviewJobId.

## G2-3-026-021  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:193-195`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:202-205`
- Fix: Legacy name field has no client maxLength but backend trims to 100; vNext caps at150; decide exact max and provide consistent server messages.

## G2-3-026-023  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:199-201`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:211-215`
- Fix: Legacy phone input maxLength14, vNext maxLength30; choose length that admits normalized +91 while preserving exact help text.

## G2-3-026-053  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:125-144`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:134-159`
- Fix: Legacy invalid-link screen includes full already-joined sign-in suggestion; vNext only provides shortened expiration explanation.

## G2-3-026-055  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:70-77`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:36-36`
- Fix: Legacy shows API validation per field and retains form; vNext inline aggregate error with focus but fatal 404 switches to invalid state.

## G2-3-026-062  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:188-213`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:194-231`
- Fix: Legacy Ant Design Form.Item connects field validation labels to errors; vNext error notice is one focusable region. Ensure correct aria-invalid and description on each field.

## G2-3-026-063  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:125-144`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:134-159`
- Fix: Legacy Skeleton/Result communicates loading and invalid state; vNext Skeleton label present but sign-in CTA removed. Check focus moves on async state.

## G2-3-026-066  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:139-141`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:153-156`
- Fix: Legacy invalid-link subtitle includes Already joined? Sign in with your work email; add exact copy to vNext.

## G2-1-034-003  [P3] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:119-123: #f5f7f9 full-height centered Card max440 padding16.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:126-132: branded auth shell max-w-md 448px, padding16, 32-48 vertical.
- Fix: Match 440px width, background and center padding.

## G2-1-034-018  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:203,210-213: primary full-width send/join, link resend.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:217-232: primary full-width send/join, secondary filled resend.
- Fix: Use link-style resend button.

## G2-1-034-043  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:119-123: background #f5f7f9, 440px centered Card, mobile padding16.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:126-132: max-md 448px branded surface, pad16, vertical32/48.
- Fix: Match old colors/card spacing at phone and desktop.

## G2-3-026-006  [P3] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:119-125`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:126-138`
- Fix: Legacy centered #f5f7f9 shell with maxWidth 440 Card; vNext public skin max-w-md plus alternate Skeleton. Match pixel values for surface, spacing, card/body.

## G2-3-026-011  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:217-220`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:241-248`
- Fix: Legacy two decline controls use link buttons; vNext uses secondary and ghost full-width buttons. Match visual affordance and spacing.
