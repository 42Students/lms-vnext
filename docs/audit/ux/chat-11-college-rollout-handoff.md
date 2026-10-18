# Chat-11 College UX rollout handoff

## Scope

- Repository: `42Students/lms-vnext`
- Branch: `chatgpt/chat-11-b`
- Ownership: **second half** of `docs/orchestrator/ui-ux/pages-college.md`, ordered routes 43–85 (`/college/people` through `/college/videos`).
- Source review: **43/43 routes**. Each has a route-specific `docs/audit/ux/college-*.md` note and a `tests/unit/UX-college-*-01.test.ts` source contract.
- The unit-failure-r8 regression `TPO-settings-audit-01` was repaired by restoring the legacy “Recruiter access” navigation label.

## UX source improvements

1. Shared `DataTable` with explicit, page-specific empty copy replaces desktop-width grids on College People manage, placement drives and interviews, job application fallback and interview rounds, shortlisted candidates, data retention, student lookup, and project template catalogue. Mobile action controls remain exposed.
2. Placement drive overview uses `StatTile` for persisted counters. One primary creation control remains on project/placement landing pages; project section/workspace links retain their route and college-scope permissions.
3. College quiz, verification, semester/content, and profile routes preserve the existing labels while exposing recovery links or `ErrorState` instead of raw errors.
4. Additional state pass: `/college/people`, `/college/programs`, `/college/quizzes`, `/college/resources`, `/college/semester-courses`, `/college/semesters`, `/college/students`, `/college/verification`, and `/college/videos` use shared `Skeleton` loading shapes, `ErrorState`, and shared `Button` retry controls. College People retry's Clear filters returns to the management route.
5. Existing aliases and thin routes intentionally delegate to the canonical page/shared workspace rather than duplicating UI. The `/college/projects` parent already uses the shared graceful loading and error boundaries.

## Validation and release gate

- Authored: **43 page-level UX test files, plus 9 loading/error-state tests and 1 scope manifest test**.
- A connector-side static pass matched the `toContain` assertions from **all 43 page tests** against the latest chat-11 source files (no mismatches observed). This is **not** a Vitest invocation, accessibility audit, browser run, or TypeScript typecheck.
- `tests/unit/UX-college-slice-manifest-01.test.ts` guards all 43 second-half routes against missing source, UX note, or named page test; it also checks the explicit `empty` contract for shared DataTable callers.
- **Do not tick the manifest yet:** `docs/orchestrator/ui-ux/pages-college.md` explicitly requires passing tests before marking a page. Device, 320/360/390px screenshot, assistive-technology and browser behaviour evidence is also pending as Audit 3.
- CI on main was queued at the last review, so no successful runner execution or clean build is claimed. Orchestrator should run TypeScript strict-check, lint, Vitest (including our 53 UX files), and browser accessibility scenarios. If green, tick only pages backed by that evidence and record the exact tested SHA.

## Integration

- All UX changes and notes were pushed to `chatgpt/chat-11-b` in batches.
- The branch incorporates newer main changes without force-pushing or modifying `main`.
- No production environment was touched.
