# chat-4 College UX coverage / navigation audit — 2026-10-18

Scope: `src/components/college/**`, `/college/**`, and Super Admin `/admin/colleges/**`, `/admin/organizations/**`.

## Generated matrix reconciliation

`docs/audit/ux/COVERAGE-MATRIX.md` currently reports **zero** College route no-note, no-test, no-loading or no-error gaps. Its five College "no shared kit" rows are canonical redirects, not visible screens:

| Alias | Destination and test |
|---|---|
| `/college/people` | `/college/contacts`; `COL-ux-redirect-01`, read-only contacts access |
| `/college/projects/[projectId]` | Canonical `/college/projects/[projectId]/summary`; `COL-ux-redirect-05`, downstream `requireProjectManageAccess` |
| `/college/projects/workspaces` | `/college/projects`; `COL-ux-redirect-02` |
| `/college/projects/workspaces/[workspaceId]` | Encoded canonical workspace identifier; `COL-ux-redirect-03` |
| `/college/projects/workspaces/[workspaceId]/[section]` | Encoded workspace and section, guarded on destination; `COL-ux-redirect-04` |

These server redirects do not render a UI, and artificially importing `PageHeader` or `DataTable` into them would not improve usability. Keep the generated matrix unchanged; preserve these scoped exceptions in the audit narrative.

## Shared kit and scroll cues

`college-role-directory-workspace.tsx` wraps its wide table in a labelled `ScrollCue`. Faculty/student CSV import, student import history and department insights use `DataTable`, which itself provides a labelled horizontal `ScrollCue` and responsive mobile disclosure. Assertion: `COL-ux-scroll-01` in `tests/unit/chat4-college-ux-redirect-coverage.test.ts`.

The larger UX table inventory includes legacy HTML tables in College academics and attendance that may need deeper keyboard/horizontal-scroll review. A raw `<table>` mention alone is not evidence of an inaccessible table; determine whether responsive card/scroll cues are already present before changing a component.

## Open checks before IIT Dharwad release

- Run real browser and keyboard journeys on narrow phones/tablets, reduced motion, screen readers, mobile dialogs, invalid filters and 100+ row tables.
- Verify persisted Project Admin scopes with a tenant A/B fixture across canonical URL redirects, not only module guard source assertions.
- Re-run the generator `scripts/audit/ux-coverage.mjs` and compare after the branch is reconciled with the latest main.
- Cloud TypeScript/Vitest/PostgreSQL/browser CI is not available within this connector-only execution, so no green-suite claim is made.
