# HR source UX review — `/hr/conversations`

- Page source: `src/app/(authenticated)/hr/conversations/page.tsx`; signed-off playbook, original headings and authorization preserved.
- Weakness: small touch targets, horizontal page overflow, duplicate main landmarks or unscrollable tables where observed.
- Changes: Removed nested main landmark; shell owns main; Fluid responsive page surface; Touch targets 44px (2).
- States: existing error, empty, pending, access-denied and data freshness logic retained without inventing records.
- Source test: `UX-hr-hr-conversations-01` in `tests/unit/ux-chat14-hr-01.test.ts`.
- Not run: TypeScript/Vitest/320–390px/keyboard/manual QA; do not tick until orchestrator verification.
