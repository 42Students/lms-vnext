# Work packet (wave 2): edit src/components/placements/public-recruiter-join-form.tsx

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-join-token.md, docs/audit/gap2/lane-1/company-join-token.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-6/public-company-join-controller.md, docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-1-027-003  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:86-91: 100vh #f5f7f9 flex-centered card max440 padding16.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:121-123: branded max-w-xl (~576px), pt24, card, different spacing.
- Fix: Match 440px width, background and center alignment.

## G2-1-027-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:110-152: header, subtitle, inline alert, visible AntD form.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:146-220: PageHeader, subtitle, collapsible optional details, status, form.
- Fix: Restore legacy form order and card typography.

## G2-1-027-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:133-147: full-width primary Send me a code, Join placements and link Send a new code.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:200-214: mobile full-width, desktop auto width; resend secondary outlined.
- Fix: Match full-width desktop buttons and resend link appearance.

## G2-1-027-012  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:103-105: ALREADY_JOINED title and sign-in email on success.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:136-143: success title same but ALREADY_JOINED subtitle shorter.
- Fix: Align already-joined subtitle and college placement address.

## G2-1-027-016  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:127-132: Designation and Mobile shown immediately before code; phone max14.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:171-190: optional details collapsed behind <details>.
- Fix: Keep optional fields visible by default.

## G2-1-027-038  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:86-89: narrow 440px card centered, action buttons block full width.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:121-123,200-214: max-w-xl; buttons switch from full to auto at 768.
- Fix: Preserve desktop 440px and full width actions.

## G2-1-027-039  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:119-148: AntD Form.Item errors announce under fields, standard focus.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:45-46 and 217: focus single error notice; labels wrap inputs.
- Fix: Add aria-describedby and field-level errors.

## G2-1-027-041  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:98: 'Ask the placement cell for a new one. Already joined? Sign in with your work email.'
- vNext now: src/components/placements/public-recruiter-join-form.tsx:126-127: drops 'Already joined? Sign in with your work email.'
- Fix: Restore helpful invalid-link copy.

## G2-1-028-003  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:84-88: min-height100vh flex center, #f5f7f9, padding16, max440 Card.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:121-123: max-w-xl branded page, pt24 and card; wider.
- Fix: Match old 440px centered card/canvas.

## G2-1-028-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:108-145: single Card with heading, subtitle, error, form in visible order.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:144-220: PageHeader + collapsible optional details, headings/spacing differ.
- Fix: Rebuild legacy hierarchy and vertical gaps.

## G2-1-028-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:113-115: secondary subtitle 'Join with your {company} email…'.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:147-149: generic 'Join with your company email…' omits named company.
- Fix: Include preview.companyName in subtitle exactly.

## G2-1-028-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:118-140: AntD full-width primary send/join and link resend.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:200-214: responsive auto-width buttons and secondary outlined resend.
- Fix: Preserve full-width primary and link-style resend.

## G2-1-028-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:90-96: warning/error/invalid Result with icons and status.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:124-133: PageHeader/paragraph and blocked readiness alert.
- Fix: Match legacy status-icon/heading/button layout.

## G2-1-028-010  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:100-103: ALREADY_JOINED and JOINED titles and signInEmail in exact success subtitle.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:136-142: same titles, but ALREADY_JOINED subtitle condensed.
- Fix: Use same placement-address and sign-in instruction for both states.

## G2-1-028-014  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:125-130: Designation optional, Mobile optional max14 tel visible by default.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:171-190: both collapsed in <details> Optional contact details.
- Fix: Show these fields initially.

## G2-1-028-034  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:95-96: invalid Result includes 'Already joined? Sign in with your work email.' + Sign in.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:126-127: shorter invalid paragraph and no sign-in CTA.
- Fix: Restore invalid-state sign-in link and message.

## G2-1-028-038  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:84-88: max440 centered at all widths, buttons block.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:121-123,200-214: max-xl with mobile full and desktop auto.
- Fix: Keep fixed max width and full-width buttons.

## G2-1-028-039  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:117-137: AntD Form.Item field errors and autocomplete; natural keyboard order.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:154-217: native labels and summary error focus, optional fields hidden.
- Fix: Restore field error association and logical keyboard sequence.

## G2-1-028-042  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:114: named company in join subtitle.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:148: generic company email copy.
- Fix: Restore company-specific subtitle.

## G2-1-028-043  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:95-96: invalid-link exact copy and Sign in action.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:126-127: truncated invalid message.
- Fix: Restore old literal copy.

## G2-20-031-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy invitation/join centered 440px max white Antd Card on #f5f7f9 `company-join/[token].js:84-110;recruiter-invite/[token].js:119-125`.
- vNext now: vNext cards `src/components/placements/public-recruiter-join-form.tsx:121-150;src/components/tpo/recruiter-invite-landing.tsx:126-132` using shared public skin.
- Fix: Check and set exact legacy max-width, vertical centering, padding/background/border, skeleton spacing via common public skin.

## G2-6-026-013  [P2] GAP  facet F04  effort S
- Legacy: Legacy join response {status:JOINED
- vNext now: ALREADY_JOINED,signInEmail}; collegeName from preview (join-service.ts:233-242; public-recruiter-join-form.tsx:108-112).
- Fix: Map status/outcome and client college title, without trusting client-supplied college in mutation.

## G2-8-026-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy preview returns {collegeName} after incrementing opens (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:146-151).
- vNext now: New preview exposes display kind/name, open counted by client POST independently (src/modules/placements/public-join/preview-service.ts:17-34; src/components/placements/public-recruiter-join-form.tsx:24-32).
- Fix: Guarantee a single consistent open counter across SSR loads and client mount.

## G2-8-026-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy sendCode returns status CODE_SENT,email,companyName (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:153-168).
- vNext now: New returns sent:true, companyName, email retained from client parsed input (src/app/api/public/college-join/send-code/route.ts:21-22; src/components/placements/public-recruiter-join-form.tsx:74-79).
- Fix: Version API response to preserve CODE_SENT and normalized email for old consumers.

## G2-8-026-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy join success returns status JOINED,collegeName,signInEmail (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:218-227).
- vNext now: New returns joined:true,outcome,signInEmail, college inferred from preview (src/modules/placements/public-join/join-service.ts:233-242; src/components/placements/public-recruiter-join-form.tsx:134-142).
- Fix: Preserve ALREADY_JOINED/JOINED and college-name placeholders in success response.

## G2-8-026-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET preview increments opens immediately in transaction (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:146-151).
- vNext now: New server preview reads only; client POST /api/public/join-link/open counts after mount (src/modules/placements/public-join/preview-service.ts:12-34; src/components/placements/public-recruiter-join-form.tsx:24-32).
- Fix: Decide open metric includes no-JS and crawlers; enforce once per meaningful open.

## G2-8-026-044  [P2] GAP  facet F13  effort M
- Legacy: Legacy loading skeleton active, load_error Retry, invalid Sign in, joined Sign in (docs/legacy-source/frontend/src/pages/college-join/[token].js:92-107).
- vNext now: New preview retry component, invalid state no sign-in, ready/form and blocked state (src/app/college-join/[token]/page.tsx:10-20; src/components/placements/public-recruiter-join-form.tsx:124-144).
- Fix: Restore all distinct states including invalid-link sign-in shortcut and Retry.

## G2-1-027-005  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:112-114: H4 title 'Hire from {collegeName}'.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:146: PageHeader same phrase but different typography.
- Fix: Match AntD heading level/margins.

## G2-1-027-014  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:120-123: Work email required, email type, readOnly after code.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:154-163: type=email required maxlength254 disabled after send.
- Fix: Preserve readOnly rather than disabled if browser form-autofill parity important.

## G2-1-027-019  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:147: resend link disabled while saving.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:213: secondary button disabled pending.
- Fix: Match link-style resend.

## G2-1-027-042  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:124-131: labels Designation (optional), Mobile (optional) visible.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:171-190: same labels but inside collapsed disclosure.
- Fix: Restore immediate visibility.

## G2-1-028-005  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:110-112: AntD H4 'College would like Company to hire from their students'.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:146: same phrase as PageHeader title, different typography.
- Fix: Match font size/weight and zero heading top margin.

## G2-1-028-012  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:118-120: Work email required, type=email, readOnly on codeSentTo.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:154-164: required type=email maxlength254, disabled after send.
- Fix: Keep readOnly interaction if pixel/keyboard parity required.

## G2-1-028-016  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:118: helper 'Your {companyName} email. You'll sign in with it.'
- vNext now: src/components/placements/public-recruiter-join-form.tsx:159-163: similar label using companyLabel fallback domain, may differ.
- Fix: Use exact resolved company-name fallback semantics.

## G2-1-028-041  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:111: 'would like {companyName} to hire from their students'.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:146: same title using companyLabel; may show domain fallback.
- Fix: Match absent companyName fallback 'your company'.

## G2-6-026-012  [P3] GAP  facet F04  effort S
- Legacy: Legacy POST code response {status:CODE_SENT,email} (CompanyJoinService.java:137-146).
- vNext now: VNext POST returns {sent:true,companyName} with email retained by client (send-code/route.ts:20-23; public-recruiter-join-form.tsx:65-78).
- Fix: Preserve success state; document changed response envelope and UI email echo.
