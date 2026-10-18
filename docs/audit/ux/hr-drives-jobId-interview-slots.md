# HR source UX review — `/hr/drives/[jobId]/interview-slots`

- Page source: `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`; signed-off playbook, original headings and authorization preserved.
- Weakness: small touch targets, horizontal page overflow, duplicate main landmarks or unscrollable tables where observed.
- Changes: Removed nested main landmark; shell owns main; Fluid responsive page surface.
- States: existing error, empty, pending, access-denied and data freshness logic retained without inventing records.
- Source test: `UX-hr-hr-drives-jobId-interview-slots-01` in `tests/unit/ux-chat14-hr-01.test.ts`.
- Not run: TypeScript/Vitest/320–390px/keyboard/manual QA; do not tick until orchestrator verification.
