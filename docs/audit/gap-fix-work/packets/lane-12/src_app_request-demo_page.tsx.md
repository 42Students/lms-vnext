# Work packet: edit src/app/request-demo/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/request-demo.md, docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/universities.md

## G2-12-001-016  [P1] GAP  facet F06 Forms  effort S
- Legacy: Mail draft includes Name, Organization, Role, Phone, What you're looking to solve `docs/legacy-source/frontend/src/components/marketing/data.js:11-18`
- vNext now: Mail draft has subject only, no body fields `src/app/request-demo/page.tsx:18`
- Fix: Prefill exact field labels in encoded body

## G2-12-001-020  [P1] GAP  facet F10 Actions/side-effects  effort S
- Legacy: Primary CTA mailto subject `Request a Demo — 42 LMS` and encoded body `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: mailto subject `42 LMS demo request`, no body `src/app/request-demo/page.tsx:18`
- Fix: Set subject/body using encodeURIComponent

## G2-12-001-043  [P1] MISSING  facet F23 Extras/intentional drops  effort S
- Legacy: Page-specific ContactPage/BreadcrumbList JSON-LD `docs/legacy-source/frontend/src/pages/request-demo.js:13-36`
- vNext now: Only basic page metadata; no JSON-LD `src/app/request-demo/page.tsx:1-4`
- Fix: Add approved structured data in App Router

## G2-12-001-044  [P1] MISSING  facet F23 Extras/intentional drops  effort S
- Legacy: Canonical, robots, OG and Twitter metadata in MarketingLayout `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:64-106`
- vNext now: Page metadata has only title and description `src/app/request-demo/page.tsx:1-4`
- Fix: Restore canonical, robots and social metadata through Next Metadata

## G2-20-004-039  [P1] GAP  facet F10  effort M
- Legacy: Demo CTA goes to /request-demo where DEMO_MAILTO pre-fills subject and detailed body; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-283`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`, `docs/legacy-source/frontend/src/pages/request-demo.js:68-82`
- vNext now: Demo CTA goes to /request-demo where mailto contains subject only; `src/components/marketing/marketing-layout.tsx:60`, `src/app/request-demo/page.tsx:18-20`
- Fix: Reinstate prefilled demo email body fields Name, Organization, Role, Phone, problem statement or replace with validated dedicated lead form.

## G2-20-004-049  [P1] GAP  facet F15  effort S
- Legacy: Demo email is user-initiated mailto: hello@42lms.com with subject `Request a Demo — 42 LMS` and structured body; `docs/legacy-source/frontend/src/components/marketing/data.js:7-18`, `docs/legacy-source/frontend/src/pages/request-demo.js:73-82`
- vNext now: User-initiated mailto same recipient but subject `42 LMS demo request`, no body; `src/app/request-demo/page.tsx:18-20`
- Fix: Restore exact subject and structured body or document intentional contact workflow change.

## G2-20-008-040  [P1] GAP  facet F10  effort M
- Legacy: Demo goes to /request-demo where prefilled mailto has subject 'Request a Demo — 42 LMS' and body fields; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-284`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: /request-demo mailto only subject '42 LMS demo request'; `src/app/request-demo/page.tsx:18-20`
- Fix: Restore mailto structured body (Name/Organization/Role/Phone/problem) and exact subject or adopt proper lead form.
