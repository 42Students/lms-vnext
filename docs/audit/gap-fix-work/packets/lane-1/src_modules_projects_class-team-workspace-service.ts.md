# Work packet: edit src/modules/projects/class-team-workspace-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md, docs/audit/gap2/lane-8/super-admin-project-workspace-new.md

## G2-2-020-034  [P1] GAP  facet F10  effort M
- Legacy: AdminProjectController.java:79-106 team creation documents per-team transaction and outcomes
- vNext now: src/modules/projects/class-team-workspace-service.ts:30-34 single SERIALIZABLE all-team transaction
- Fix: Choose explicit atomic-versus-partial policy, report failed/skipped teams and ensure no data loss.

## G2-2-020-065  [P1] GAP  facet F20  effort M
- Legacy: AdminProjectController.java:79-106 per-team isolated commits
- vNext now: src/modules/projects/class-team-workspace-service.ts:30-34 one SERIALIZABLE transaction
- Fix: Resolve partial batch semantics and report every outcome.

## G2-7-020-057  [P1] GAP  facet F10  effort L
- Legacy: AdminProjectController.java:75-104 legacy teams create each in its own transaction with partial outcome
- vNext now: class-team-workspace-service.ts:24-33 all teams in a retryable serializable transaction
- Fix: Decide atomic vs partial team-batch behavior; surface outcome clearly

## G2-7-020-067  [P1] GAP  facet F12  effort L
- Legacy: new.js:319-344 bulk partial failures are allowed with report
- vNext now: class-team-workspace-service.ts:29-32 all-or-nothing transaction retries
- Fix: Resolve desired partial vs atomic semantics and user-facing report

## G2-8-028-023  [P1] MISSING  facet F06  effort M
- Legacy: Old Mentor optional except ACTIVE required, helper Every workspace needs a mentor. docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:49-50,467-483.
- vNext now: New class/team creator has no mentor input; service validates optional primary mentor if payload provided src/components/projects/class-team-workspace-creator.tsx:164-204; src/modules/projects/class-team-workspace-service.ts:91-98.
- Fix: Restore mentor selector/ACTIVE requirement, pass selected mentor into bulk write.

## G2-8-028-044  [P1] GAP  facet F12  effort M
- Legacy: Old ACTIVE project cannot be created without mentor, class mode students from active class docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:44-50,467-483,485-507.
- vNext now: New class-team transaction checks active MENTOR only if provided, but form lacks mentor src/modules/projects/class-team-workspace-service.ts:91-98.
- Fix: Require mentor when materializing ACTIVE and offer selection in bulk form.

## G2-8-028-051  [P1] GAP  facet F15  effort M
- Legacy: Old classId leaked to single could broadcast Project created to entire class by mistake; class field hidden single docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:485-490.
- vNext now: New group/class creator always includes classId, class team service notifies group members src/components/projects/class-team-workspace-creator.tsx:134-139; src/modules/projects/class-team-workspace-service.ts:105-138.
- Fix: Ensure notifications go only to selected roster membership, no class-wide broadcast from single mode.
