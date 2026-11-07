# UX-G143 — Faculty profile editor component UX

Owner: `ux-faculty-learner-profile-2026-11-07`  
Source: `src/components/people/faculty-profile-editor.tsx`, `faculty-profile-metadata.tsx`, `faculty-profile-repeatable.tsx`, `faculty-profile-skills.tsx`, `faculty-profile-text-section.tsx`.

## Current UX changes

- Existing completion percentage now exposes a native progress indicator to assistive technology; its explanatory disclaimer still states it is not a verification or hiring score.
- Multiple repeatable-record controls are individually named for screen readers, including collapsed field state, reordering, duplication and pending removal.
- Repeated skills distinguish per-record Move/Remove actions; metadata removal names the record and reports the limit. Sections expose busy state while saving.
- Existing profile section navigation, changed-field validation, unsaved-change warning, metadata handling, versioned saves, managed-document retention, and discard confirmations remain untouched.

## Acceptance

- Positive / negative source contracts: `tests/ux-profile-g143-g150.test.mjs`.
- True rendered-component browser interactions at desktop 1280×800 and mobile 390×844: `tests/e2e/ux-profile-editors.spec.ts`, via an unshipped CI fixture.
- Scoped lint, global TypeScript and browser screenshots: [workflow](https://github.com/42Students/lms-vnext/actions/runs/42393164698).
- **Pending CI proof.** No green claim until steps finish. Full privileged account persistence is outside the test-only preview and should not be inferred.

Security review: No identity, tenant, RBAC, API, persistence, or sensitive-read code changed. Source fields, private-document restrictions and existing authorization remain unchanged. Parity: `docs/parity/ux-profile-editors.md`.
