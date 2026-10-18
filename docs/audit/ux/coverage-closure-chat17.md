# Coverage closure — chat-17

**Baseline:** `docs/audit/ux/COVERAGE-MATRIX.md`, as generated on main before this pass: 521 routes, 57 routes without a UX test mention, 4 untested UI primitives, 66 raw tables and 4 unsafe new-window links. The full registry is `docs/audit/ui-surfaces/UI-SURFACES.md`.

## Closed by this branch

| Gap | Concrete repair | Confirmable source impact |
|---|---|---|
| Missing UX route test mentions | `tests/unit/UX-coverage-closure-chat17.test.ts` names each exact source and route, checks permission context/redirect, scope, shared shell or private view, unsafe new windows and raw popups. | **57 of 57** route test-mention gaps targeted across the main 39-route batch and the remaining 18 legacy/role-guard routes; tests authored, execution pending. |
| Shared UI components without direct test | `tests/unit/UX-kit-scroll-motion-01.test.tsx` directly renders BottomSheet, LoadingState, Checkbox/Radio/Switch and checks use-confirm-flow safety. | **4** of 4 targeted. Added ScrollCue and Disclosure tested in same kit suite. |
| Raw `<table>` | Teacher learner session history now uses `DataTable` with explicit empty state; horizontal scroll cue inherited and phone data always reachable. | **1** of 66 targeted. |
| `target=_blank` without noopener | Four listed components (admin offering learning overview, learner YouTube player, placement employer relationships, recruiter result controls) now open in same tab and preserve descriptive link text, with `noopener noreferrer` and >=44px tap areas. | **4** of 4 targeted. |
| Shared button and form-control motion | Button, Input, Select and Textarea now use the same 150ms token/ease; browser default interactive focus behavior remains unchanged. | **4** primitives harmonized. |
| Shared scroll/motion kit | Eight directly requested surfaces and additional skeleton, selection controls, Disclosure and ScrollCue brought into token/edge-fade alignment. | See `scroll-motion-shared-kit.md`. |

## Remaining / ownership

**Estimated post-merge gap balance, measured against the starting matrix (requires regeneration):**

| Gap category | Starting gaps | This branch addresses | Expected remaining |
|---|---:|---:|---:|
| Routes lacking UX test mention | 57 | 57 | 0 |
| Untested shared UI primitives | 4 | 4 | 0 |
| Unsafe target=_blank without noopener | 4 | 4 | 0 |
| Raw HTML tables outside shared DataTable | 66 | 1 | 65 |
| Routes with no direct shared-kit import | 62 | 0 | 62 |
| Overlays with no UX test/note | 127 | 0 | 127 |
| No note / no loading / no error | 0 | 0 | 0 |

**The full project-wide matrix is not yet at zero.** The remaining 254 structural heuristic gaps require their owner lanes to convert genuine surfaces or an explicitly owner-approved waiver where the heuristic does not apply (for example redirect-only pages). Chat-17 has not filed any unapproved waiver or claimed these are closed.



For the final 18 route gaps, `tests/unit/UX-coverage-closure-leftovers-chat17.test.ts` verifies each actual destination/permission/recovery contract without editing other owners’ route code. These regression tests were added to `ux:audit:unit` together with the first 39.

The baseline matrix includes raw tables in colleges, TPO, attendance, projects, HR, and other role-owned components; and 127 overlay components without notes/tests. Chat-17 did **not** falsely mark these covered by adding only filenames to tests. They remain for their owner lanes or independently reviewed followups. Redirect-only pages counted as "no shared component" by the generator are correctly handled as server redirects; avoid adding fake markup solely to trick the heuristic. The 57 targeted route entries and four UI primitive fixes will only be reflected when the orchestrator regenerates the matrix with `node scripts/audit/ux-coverage.mjs`.

**Verification:** GitHub source changes and audit tests authored. No local repository/test process or browser is available here; CI is not claimed green. A remaining audit failure is not a waiver and must be resolved by source changes or owner-approved entry in `COVERAGE-WAIVERS.md`.
