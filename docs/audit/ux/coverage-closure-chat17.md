# Coverage closure — chat-17

**Baseline:** `docs/audit/ux/COVERAGE-MATRIX.md`, as generated on main before this pass: 521 routes, 57 routes without a UX test mention, 4 untested UI primitives, 66 raw tables and 4 unsafe new-window links. The full registry is `docs/audit/ui-surfaces/UI-SURFACES.md`.

## Closed by this branch

| Gap | Concrete repair | Confirmable source impact |
|---|---|---|
| Missing UX route test mentions | `tests/unit/UX-coverage-closure-chat17.test.ts` names each exact source and route, checks permission context/redirect, scope, shared shell or private view, unsafe new windows and raw popups. | **39** of 57 owned/leftover route gaps targeted; tests authored, execution pending. |
| Shared UI components without direct test | `tests/unit/UX-kit-scroll-motion-01.test.tsx` directly renders BottomSheet, LoadingState, Checkbox/Radio/Switch and checks use-confirm-flow safety. | **4** of 4 targeted. Added ScrollCue and Disclosure tested in same kit suite. |
| Raw `<table>` | Teacher learner session history now uses `DataTable` with explicit empty state; horizontal scroll cue inherited and phone data always reachable. | **1** of 66 targeted. |
| `target=_blank` without noopener | Four listed components (admin offering learning overview, learner YouTube player, placement employer relationships, recruiter result controls) now open in same tab and preserve descriptive link text, with `noopener noreferrer` and >=44px tap areas. | **4** of 4 targeted. |
| Shared scroll/motion kit | Eight directly requested surfaces and additional skeleton, selection controls, Disclosure and ScrollCue brought into token/edge-fade alignment. | See `scroll-motion-shared-kit.md`. |

## Remaining / ownership

The baseline matrix includes raw tables in colleges, TPO, attendance, projects, HR, and other role-owned components; and 127 overlay components without notes/tests. Chat-17 did **not** falsely mark these covered by adding only filenames to tests. They remain for their owner lanes or independently reviewed followups. Redirect-only pages counted as "no shared component" by the generator are correctly handled as server redirects; avoid adding fake markup solely to trick the heuristic. The 39 targeted route entries and four UI primitive fixes will only be reflected when the orchestrator regenerates the matrix with `node scripts/audit/ux-coverage.mjs`.

**Verification:** GitHub source changes and audit tests authored. No local repository/test process or browser is available here; CI is not claimed green. A remaining audit failure is not a waiver and must be resolved by source changes or owner-approved entry in `COVERAGE-WAIVERS.md`.
