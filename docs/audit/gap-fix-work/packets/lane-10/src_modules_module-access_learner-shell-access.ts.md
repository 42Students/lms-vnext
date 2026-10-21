# Work packet: edit src/modules/module-access/learner-shell-access.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u027-feature-flags.md

## G2-11-027-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:14-17 used for Projects/Placements nav for every authenticated role.
- vNext now: src/modules/module-access/learner-shell-access.ts:18-56 only LEARNER convenience shell flags; src/components/shell/shell-model.ts:157+ role navigation static.
- Fix: Expose consistent current-principal flags to all roles, not learner-only.

## G2-11-027-004  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:56-60 fields projectsEnabled, placementsEnabled, modules.
- vNext now: src/modules/module-access/learner-shell-access.ts:12-16 fields projectsEnabled, placementsEnabled, driveDayEnabled; modules map missing from learner shell type.
- Fix: Return complete modules map plus compatibility booleans.

## G2-11-027-016  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:15 any authenticated role may query own college's flags.
- vNext now: src/modules/module-access/learner-shell-access.ts:18-22 only learner flags exposed; staff resolve service but no authenticated route.
- Fix: Provide flags for faculty, mentors, TPO, college admin and superadmin under own scope.

## G2-11-027-010  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:37-43 principal resolution in security context, missing auth handled by framework.
- vNext now: src/modules/module-access/learner-shell-access.ts:21 returns null for nonlearner; :49-54 catches every DB failure and returns all false.
- Fix: Surface distinct not-authenticated and resolver outage in personal flag API, fail closed in shell.

## G2-11-027-012  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:60 returns Response OK/OK with flags data.
- vNext now: src/modules/module-access/learner-shell-access.ts:42-48 returns plain object, no Response status/message envelope.
- Fix: Map success envelope for compatibility.
