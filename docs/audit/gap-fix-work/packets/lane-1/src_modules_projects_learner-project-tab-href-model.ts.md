# Work packet: edit src/modules/projects/learner-project-tab-href-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-project-detail.md

## G2-17-004-013  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 intentionally retains open tab form/modal by keying on projectId+account only.
- vNext now: src/modules/projects/learner-project-tab-href-model.ts:4-17 preserves filter params but drops taskId and pagination when switching tabs; modal/task state encoded in query :175-185.
- Fix: Test/safeguard unsaved edit modal on tab switching; avoid clearing transient state without dirty-change prompt.

## G2-17-004-018  [P1] GAP  facet F09  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-13 specifically prevents tab URL changes from silently discarding open modal/form.
- vNext now: src/modules/projects/learner-project-tab-href-model.ts:8-16 intentionally drops transient modal/paging cursor on tab switch, src/app/(authenticated)/learn/projects/[projectId]/page.tsx:174-185 task dialog controlled by taskId.
- Fix: Add unsaved change guard before dropping taskId/closing detail dialog on tab switch.

## G2-17-004-024  [P1] GAP  facet F12  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 retaining modal/tab state is explicit UX invariant.
- vNext now: src/modules/projects/learner-project-tab-href-model.ts:4-17 persists filters across tabs but excludes taskId and active paging cursor.
- Fix: Preserve full unsaved action state or ask before discarding on tab navigation.

## G2-17-004-042  [P1] GAP  facet F23  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 explicit no-remount-on-tab feature, reset on project/account change.
- vNext now: src/modules/projects/learner-project-tab-href-model.ts:8-17 drops transient taskId on tab switch and uses server-route navigation.
- Fix: Recover exact legacy cross-tab unsaved state guarantees.
