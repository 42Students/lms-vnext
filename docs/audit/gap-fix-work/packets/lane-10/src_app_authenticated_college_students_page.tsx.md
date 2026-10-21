# Work packet: edit src/app/(authenticated)/college/students/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-5-027-047  [P1] GAP  facet F10  effort M
- Legacy: Legacy update/delete Learner entity + audit LEARNER_UPDATE/TRANSFER/DELETE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1065-1143`
- vNext now: vNext directory manages user/membership and learner profile separately. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/app/(authenticated)/admin/students/page.tsx:61-92`
- Fix: Document and test partial profile lifecycle vs old delete side effects.

## G2-5-027-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy unauthenticated list returns 401 and bad learnerId returns `Invalid learner id`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-476,589-609`
- vNext now: vNext page requires request context and UUID membership keys; response error type differs. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/modules/people/college-role-directory-service.ts:39-47`
- Fix: Map unauthorized/not-found/invalid-id to safe user-readable states.
