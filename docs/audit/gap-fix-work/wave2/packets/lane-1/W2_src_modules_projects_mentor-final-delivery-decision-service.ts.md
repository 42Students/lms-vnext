# Work packet (wave 2): edit src/modules/projects/mentor-final-delivery-decision-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/project-delivery-event.md

## G2-3-018-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:369-398`
- vNext now: `src/modules/projects/submission-service.ts:337-469`, `src/modules/projects/mentor-final-delivery-decision-service.ts:18-98`
- Fix: Legacy `/submission` alias and `/submission/review` route expose same final delivery/review workflow; vNext versioned projectSubmissions and mentor decision endpoints. Map aliases and deep-link access.

## G2-3-018-019  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:394-399`
- vNext now: `src/modules/projects/mentor-final-delivery-decision-service.ts:18-26`
- Fix: Legacy review action is PUT delivery/submission plus POST /submission/review on workspace; vNext mentor final decision has explicit decision schema; verify legacy review confirmation modal and status label mapping.

## G2-3-018-023  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:75-112`
- vNext now: `src/db/schema/projects.ts:817-864`, `src/modules/projects/mentor-final-delivery-decision-service.ts:63-75`
- Fix: Legacy delivery stores submitted/reviewed actor id+name+type and timestamps, vNext stores membership submittedBy and separate review user/membership. Preserve display names on historical snapshots even after profile rename.

## G2-3-018-034  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:394-399`
- vNext now: `src/modules/projects/mentor-final-delivery-decision-service.ts:77-82`, `src/modules/projects/submission-service.ts:463-465`
- Fix: Legacy review/submit callbacks may notify actors via project workspace service; vNext sends Delivery submitted/reviewed in-app notifications. Compare legacy template and recipient rules, avoid duplicate notification on event replay.

## G2-3-018-038  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:22-47`
- vNext now: `src/modules/projects/mentor-final-delivery-decision-service.ts:68-76`
- Fix: Legacy status/action are separately recorded, vNext activity summary determined by enum, potentially suppresses `Changes requested` vs `Approved` nuance in action. Render decision label and exact feedback on history row.

## G2-3-018-042  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-420`
- vNext now: `src/modules/projects/submission-service.ts:456-465`, `src/modules/projects/mentor-final-delivery-decision-service.ts:68-90`
- Fix: Legacy mutation writes event ledger and workflow notifications; vNext recorded activity/in-app messages differ from specialized projectDeliveryEvents writes. Wire one producer transaction into unified history.
