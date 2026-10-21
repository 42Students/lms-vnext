# Work packet: edit src/app/(authenticated)/tpo/team/[threadId]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-017  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:85-112`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:63-78`
- Fix: Legacy add/follow/mute/leave/updateTopic return status ADDED/OK/LEFT; vNext controls use local pending/success/error badges; ensure exact toast feedback.

## G2-3-022-018  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:115-145`
- vNext now: `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:87-117`
- Fix: Legacy message edit/delete/decision and ask done/cancel return EDITED/DELETED/DONE/CANCELLED; vNext separate message actions and ask panel. Compare user-facing operation labels.
