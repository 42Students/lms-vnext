# Work packet: edit src/components/admin/learner-module-access-drawer.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-10-019-021  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:790-817 — Per-learner name fallback #id, roll number, individual On/Off tags, legacy lock without value.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:65-70,74-98 — Name fallback Unnamed learner and separate drawer with roles, no lock-only list.
- Fix: Build override roster with precise tags and lock-only status.

## G2-10-019-033  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:375-395,869-883 — Student override tri-state in trace drawer; disabled if locked above.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:90-98 — StudentRuleEditor only Projects/Electives, Placements ruled separately.
- Fix: Surface equivalent learner exceptions with explicit placements-eligibility reasoning.

## G2-10-019-096  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:260-279 — Four sequence refs invalidate all pending tree/search/trace/history responses on scope switch.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:28-53 — seq cancels only current student lookup, not all independent operations.
- Fix: Reset/abort all scope-dependent client state on college change.

## G2-10-019-038  [P2] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:232-247,681-685 — Override load failure separate 'Couldn't load student overrides', Retry.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:31-44 — Learner lookup error generic; no separate overrides roster load.
- Fix: Isolate override failure banner.

## G2-10-019-043  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:341-345 — Lock-only repair 'Legacy lock cleared' or 'Could not clear the legacy lock'.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:90-98 — No lock repair feedback/action.
- Fix: Restore exact feedback for repair flow.

## G2-4-030-030  [P2] GAP  facet F07  effort M
- Legacy: Couldn't load student access, Retry (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:834-837`)
- vNext now: Lookup failed copy The learner lookup failed... without drawer retry if detail absent (`src/components/admin/learner-module-access-drawer.tsx:36-44`)
- Fix: Preserve access-trace error inside retryable drawer.

## G2-10-019-039  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:309-324,835-837 — Trace failure exact 'Couldn't load student access' with Retry.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:31-44,73-76 — Shows 'The learner lookup failed. Check your connection and try again.'
- Fix: Match contextual error and retry inside drawer.

## G2-10-019-042  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:385-391 — Learner override toast 'Saved for this student'.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:90-98 — Delegated StudentRuleEditor, not shared toast wording.
- Fix: Use distinct per-learner success message.
