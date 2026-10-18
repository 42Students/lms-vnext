# HR UX source review — `/hr/profile`

- Source `src/app/(authenticated)/hr/profile/page.tsx` follows the signed-off playbook. Original labels, role and tenant scope and result semantics unchanged.
- Changes: Fluid page surface; Scrollable table (1).
- Retained: error, empty, authorized reads and form values across failures.
- Source regression: `UX-hr-hr-profile-01` in `tests/unit/ux-chat14-hr-03.test.ts`.
- Pending: strict TypeScript, unit, device and screen-reader verification; inventory unticked.
