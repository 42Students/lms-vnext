# Work packet (wave 2): edit src/modules/module-access/learner-shell-access.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u027-feature-flags.md

## G2-11-027-003  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:35-60 JSON response, no DOM.
- vNext now: src/modules/module-access/service.ts:322-327 returns internal object; src/modules/module-access/learner-shell-access.ts:42-48 transforms for shell and hides source trace.
- Fix: Add normalized JSON response and preserve legacy top-level data wrapper.

## G2-11-027-022  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:35-60 no skeleton/error in API; unavailable resolver throws upstream.
- vNext now: src/modules/module-access/learner-shell-access.ts:49-54 fail closed all false silently in learner shell, no visible retry.
- Fix: Use small disabled-module explanation/retry, avoid treating outage as explicit college disable.

## G2-11-027-026  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:15-17 nav consumers use flags across viewport from same API.
- vNext now: src/components/shell/shell-model.ts:1-80 supports responsive roles; src/modules/module-access/learner-shell-access.ts:18-56 only learner flag helper.
- Fix: Verify mobile and desktop hide identical disabled modules for every role.

## G2-11-027-027  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:44-60 modules map labels plain strings and booleans accessible to clients.
- vNext now: src/modules/module-access/learner-shell-access.ts:42-48 booleans only in shell, source reason not announced.
- Fix: Expose blocked reason to screen readers and navigational empty state where appropriate.

## G2-11-027-028  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:57-59 exact JSON keys projectsEnabled, placementsEnabled, modules.
- vNext now: src/modules/module-access/learner-shell-access.ts:12-16 adds driveDayEnabled but drops modules.
- Fix: Keep legacy keys and JSON shape intact.
