# Work packet: edit src/components/shell/shell-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u027-feature-flags.md, docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-11-027-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:14-17 used for Projects/Placements nav for every authenticated role.
- vNext now: src/modules/module-access/learner-shell-access.ts:18-56 only LEARNER convenience shell flags; src/components/shell/shell-model.ts:157+ role navigation static.
- Fix: Expose consistent current-principal flags to all roles, not learner-only.

## G2-2-036-022  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/TpoTeamAccessFilter.java:60-63 my-access empty role without 403
- vNext now: src/components/shell/shell-model.ts:291-307 TPO menu links
- Fix: Show appropriate no-placement-team state instead of fatal access error.
