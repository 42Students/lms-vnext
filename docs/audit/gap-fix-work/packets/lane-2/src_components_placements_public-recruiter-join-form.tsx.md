# Work packet: edit src/components/placements/public-recruiter-join-form.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-join-token.md, docs/audit/gap2/lane-1/company-join-token.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-1-027-020  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:7-10,54-60: maps API field error codes to AntD Form.Item name (email/phone/name/company/code).
- vNext now: src/components/placements/public-recruiter-join-form.tsx:69-72,104-107,217: a single InlineNotice summary.
- Fix: Set field-specific errors with focus per control, preserving exact server messages.

## G2-1-028-017  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:6-10,53-59: maps OTHER_COMPANY_EMAIL to email field error.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:69-72,104-107: single InlineNotice summary, not Form.Item field error.
- Fix: Map server error to Work email field with aria-describedby.

## G2-1-027-021  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:121-125: 'Enter your work email', 'Enter a valid email', 'Enter your name'.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:54-58: generic 'Enter your work email and name before requesting a code.'
- Fix: Render each exact field error.

## G2-1-027-024  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:103-106: joined/ALREADY_JOINED success Result and Sign in CTA.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:134-143: PageHeader success and Sign in link.
- Fix: Restore AntD success icon/title/copy style.

## G2-1-028-018  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:119,123: 'Enter your work email', 'Enter a valid email', 'Enter your name'.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:54-58: combined validation summary on send.
- Fix: Keep exact field-specific required and type messages.

## G2-1-028-021  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:98-106: AntD success Result with icon and Sign in primary.
- vNext now: src/components/placements/public-recruiter-join-form.tsx:134-143: text PageHeader, Sign in Link.
- Fix: Restore success icon and button style.

## G2-20-031-021  [P2] GAP  facet F07  effort M
- Legacy: Legacy recruiter/college join maps WRONG_CODE/CODE_EXPIRED/CODE_LOCKED to `code` field and other errors to named fields `college-join/[token].js:7-10,54-59`.
- vNext now: vNext top-level error summary with mapping model `src/components/placements/public-recruiter-join-form.tsx:45-46,89-107`.
- Fix: Render backend validation errors beside the corresponding field while retaining accessible focused error summary.

## G2-8-026-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy repeated OTP wrong/locked/expired maps to field and code error (docs/legacy-source/frontend/src/pages/college-join/[token].js:7-10,54-60).
- vNext now: New explicit WRONG_CODE/CODE_EXPIRED/CODE_LOCKED returns 400 and error summary (src/app/api/public/college-join/join/route.ts:20-29; src/components/placements/public-recruiter-join-form.tsx:104-108).
- Fix: Show code-specific inline prompt and reason, not only global notice.
