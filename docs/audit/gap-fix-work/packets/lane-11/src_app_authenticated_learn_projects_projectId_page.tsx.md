# Work packet: edit src/app/(authenticated)/learn/projects/[projectId]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-project-detail.md

## G2-17-004-001  [P1] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:7-15 mounts ProjectDetailContent for /learn/projects/[projectId] and passes projectId through router query.
- vNext now: src/app/(authenticated)/learn/projects/[projectId]/page.tsx:31-40 serves /learn/projects/[projectId] and validates UUID projectId.
- Fix: Decide legacy numeric/string project-link compatibility; route old IDs through resolver or document unsupported links.

## G2-17-004-018  [P1] GAP  facet F09  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-13 specifically prevents tab URL changes from silently discarding open modal/form.
- vNext now: src/modules/projects/learner-project-tab-href-model.ts:8-16 intentionally drops transient modal/paging cursor on tab switch, src/app/(authenticated)/learn/projects/[projectId]/page.tsx:174-185 task dialog controlled by taskId.
- Fix: Add unsaved change guard before dropping taskId/closing detail dialog on tab switch.

## G2-17-004-040  [P1] GAP  facet F22  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:7-15 projectId path token accepted without UUID check in wrapper; original backend project instance entity not present in this unit.
- vNext now: src/db/schema/projects.ts:172-182 projectInstances uses UUID id and collegeId, src/app/(authenticated)/learn/projects/[projectId]/page.tsx:40 UUID-only route.
- Fix: Record project identifier compatibility policy and valid legacy link shape even without data migration.
