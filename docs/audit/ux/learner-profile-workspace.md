# UX-G150 — Learner profile workspace UX

Owner: `ux-faculty-learner-profile-2026-11-07`  
Source: `src/components/profile/learner-profile-workspace.tsx`.

## Current UX changes

- Previously repeated Add, Edit and Delete controls now announce which learner-profile collection and persisted record they affect. Award/publication actions include the item title for accessibility.
- Asynchronous confirmation promises are canceled when replaced or the workspace unmounts, so switching page or overlapping confirmations cannot leave an awaited action hanging.
- Original mobile quick links, career checklist wording, visible loading/error states, confirmation flows, controlled inputs, save barriers, optimistic conflict handling and retry remain.
- Sensitive Aadhaar/PAN values are still masked in the main profile, and resume/identity uploads remain private or explicitly unavailable as originally enforced.

## Acceptance

- Source contract `tests/ux-profile-g143-g150.test.mjs`, and direct real-component rendering at 1280×800 and 390×844 in `tests/e2e/ux-profile-editors.spec.ts`.
- **Scoped UX DONE** on [executed workflow](https://github.com/42Students/lms-vnext/actions/runs/42396588929): 4/4 combined source tests, scoped lint and 4/4 combined desktop/mobile browser scenarios passed. [Screenshot artifact](https://github.com/42Students/lms-vnext/actions/runs/42396588929/artifacts/13584151589) contains learner desktop/mobile previews; the separate TypeScript failure arose only in unowned project-export files and was later corrected on main.
- This preview uses an empty synthetic profile and does not emulate a successful authorized mutation or bypass real tenant permissions.

Security review: Unmodified API paths, authenticated service calls, tenant isolation, optimistic concurrency, identity masking and no extra profile data exposure. Parity: `docs/parity/ux-profile-editors.md`.
