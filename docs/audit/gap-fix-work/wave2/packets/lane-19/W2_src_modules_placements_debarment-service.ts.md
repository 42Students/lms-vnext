# Work packet (wave 2): edit src/modules/placements/debarment-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-5-022-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy debar reason,untilDate LocalDate,untilDrives Integer optional `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:59-69`
- vNext now: VNext create input reason 1..500,date valid,drives1..10k mutually exclusive `src/modules/placements/debarment-service.ts:16-40`
- Fix: Preserve manual indefinite default, explain one-duration-only rule.

## G2-5-022-016  [P2] GAP  facet F06  effort S
- Legacy: Legacy lift body Map<String,String> reason optional `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:71-78`
- vNext now: VNext lift reason required 1..500 `src/modules/placements/debarment-service.ts:36-40`
- Fix: Require documented reason or map missing legacy data for migration.

## G2-5-022-029  [P2] GAP  facet F11  effort M
- Legacy: Legacy TpoAccessGuard requires learner/debarment same caller college; TPO and admins may access `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:9-16,136-148`
- vNext now: VNext requireTpoBatchActor TPO active membership + placement manage scope `src/modules/placements/debarment-service.ts:169-177`
- Fix: Compare permitted College Admin correction path with TPO-only route.

## G2-5-022-031  [P2] GAP  facet F12  effort M
- Legacy: Legacy debar active: liftedAt false; untilDate takes priority; untilDrives count else indefinite `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementDebarment.java:53-60`
- vNext now: VNext isDebarmentActive uses college India-local date and count `src/modules/placements/debarment-service.ts:72-92`
- Fix: Document timezone and priority; validate old both-fields records.
