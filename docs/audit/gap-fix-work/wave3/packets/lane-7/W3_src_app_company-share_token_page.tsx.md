# Work packet (wave 3): edit src/app/company-share/[token]/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/company-share-token.md

## G2-1-029-009  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:151: optional link 'Email me a code instead'.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: no code-email action.
- Fix: Provide rate-limited email-code resend backed by ownership proof.

## G2-1-029-032  [P1] MISSING  facet F08  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:91: exact success toast 'We emailed a code to the address the placement cell used. It works for 15 minutes.'.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: no resend action or success toast.
- Fix: Implement rate-limited email-code send with exact status copy.

## G2-1-029-039  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:111-119: downloadShareResumes(token,code) ZIP file, named resumes-{role}.zip.
- vNext now: src/app/company-share/[token]/page.tsx:104-110: only CSV link.
- Fix: Provide scanner-safe signed ZIP or clear business retirement decision.

## G2-1-029-051  [P1] MISSING  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:158,111-119: Download all resumes ZIP; L:159 CSV list.
- vNext now: src/app/company-share/[token]/page.tsx:104-110: CSV only, max500; no ZIP.
- Fix: Define secure resume archive download parity and file sanitization.

## G2-1-029-053  [P1] MISSING  facet F15  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:85-103: Email me a code instead sends provider mail; success + rate-limit info toasts.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: no email sending from page.
- Fix: Restore recipient-safe code delivery and templates.
