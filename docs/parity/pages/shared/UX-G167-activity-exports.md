# UX-G167 · Activity CSV exports

**Status:** DOING; no engineering or release-certification claim until exact-SHA CI and desktop/mobile browser evidence are green.

## Files and bounded journey
- `src/modules/activity/college-activity-export-model.ts` and `college-activity-export-service.ts`
- `src/modules/activity/super-admin-audit-export-model.ts` and `super-admin-audit-export-service.ts`
- The scoped `/activity` page links to `/api/activity/college-export` or `/api/activity/admin-export` according to authorized role.

## Improvement
- Reuse `spreadsheetCsvCell` so zero-width/bidi controls, combining marks and C0 control characters cannot bypass spreadsheet formula neutralization; preserve the original characters as inert text.
- Apply the independent 1,000-row cap inside each CSV renderer, not only the authorized paged service; emit an explicit truncation notice for oversized direct callers.
- Preserve existing IST timestamps, headers, redacted IP column, context-scoped queries, no-store response headers and server-side permissions.
- Preserve owner-scoped college authorization and scoped Super Admin activity access.

## Evidence (in progress)
- Source commits: `b7708246d83ff6ef4f2527f9986cffc0d0c02685`, `a826f87acd7481f0d947c71f6e3c97267b2e5fc6`.
- Unit tests: `tests/unit/college-activity-export-model.test.ts` and `tests/unit/super-admin-audit-export-model.test.ts`. Test commits: `733126d44e98121ffe5488946f0fad8d8ce70620`, `e4f54812b4ff3e322a53e32aebea3327aa212dcb`.
- Browser acceptance: `tests/e2e/ux-g167-activity-exports.spec.ts`: Super Admin desktop 1280px, college-admin mobile 390px, denied learner, scoped downloads and response headers. The test must actually run; authored tests alone are not proof.
- Focused workflow: `.github/workflows/ux-g167-activity-exports-acceptance.yml` (created at `3f07e9b50fe3914b53b074c0106fd5a728dcfe67`).
- Required verification: scoped ESLint, TypeScript, focused Vitest, real seeded Chromium browser evidence and regression review. Preserve screenshot artifacts and record exact tested SHA and workflow conclusion here before changing the canonical tracker to DONE.

## Verified closure — 2026-11-08
- Tested commit: a8157be676da96a2ed93982fd6784599e1cdbd3c (main)
- Passing run: https://github.com/42Students/lms-vnext/actions/runs/42452276830
- Executed exact SHA check, scoped ESLint, full project TypeScript, college/Super Admin CSV Vitest and desktop/mobile seeded Chromium: authorized Super Admin/college-admin downloads plus denied learner, headers, preserved screenshot artifact 13605989065.
- Production permissions and RLS unchanged. Other release/security gates are independent.
