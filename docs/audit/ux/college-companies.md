# UX review: /college/companies

- Route: `src/app/(authenticated)/college/companies/page.tsx`, first-half College Admin UX rollout.
- Legacy wording and IA preserved, including action labels, filters, page title and notification/empty messages.
- Improvements: brand button contrast; WCAG-friendly links; 44px controls; page overflow containment.
- States: tenant guards and pending/errors untouched; any tables belong to shared directory components with their own empty messages. Mobile controls and forms use shared UI behavior.
- Regression test authored: `tests/unit/UX-college-college-companies-01.test.ts`. CI/device/accessibility audit pending; checklist cannot be ticked until passing.
