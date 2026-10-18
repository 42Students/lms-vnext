# HR source UX review — `/hr/company/reports`

- Page source: `src/app/(authenticated)/hr/company/reports/page.tsx`; signed-off playbook, original headings and authorization preserved.
- Weakness: small touch targets, horizontal page overflow, duplicate main landmarks or unscrollable tables where observed.
- Changes: Fluid responsive page surface; Fluid responsive page surface; Fluid responsive page surface; Touch targets 44px (5); Keyboard-scrollable data tables (1).
- States: existing error, empty, pending, access-denied and data freshness logic retained without inventing records.
- Source test: `UX-hr-hr-company-reports-01` in `tests/unit/ux-chat14-hr-01.test.ts`.
- Not run: TypeScript/Vitest/320–390px/keyboard/manual QA; do not tick until orchestrator verification.
