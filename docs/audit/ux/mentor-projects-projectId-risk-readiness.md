# UX source review — `/mentor/projects/[projectId]/risk-readiness`

- **Playbook/route:** signed-off UX v1, `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx`; exact headings, labels and navigation retained.
- **Source risks addressed:** horizontal page overflow, small controls, keyboard-inaccessible table regions where present.
- **Changes:** No-overflow fluid page container; Touch controls to 44px (6).
- **State coverage:** existing loading/error/empty, read-only, retry and result messages retained; no mutations introduced.
- **Regression:** `tests/unit/ux-chat14-mentor-02.test.ts`, `UX-mentor-mentor-projects-projectId-risk-readiness-01`.
- **Verification:** source check authored, TypeScript + browser audit + unit execution pending; inventory unticked.

## Mentor-only quality pass
- Accessible deep-teal text: 6; visible link focus outline: 6; shared submit Button: 1.
- Preserves current saved data, legacy terms, route scope and no-fabrication policy.
- Source test `UX-mentor-projects-projectId-risk-readiness-02` in `tests/unit/ux-chat14-mentor-quality-04c.test.ts`. No browser/typecheck evidence yet.
