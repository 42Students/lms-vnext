# Work packet: edit src/modules/placements/report-model.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-17-012-011  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:187-198 — Metrics: applied/shortlisted/interview/offered/rejected/hired and avgTimeToShortlistMs.
- vNext now: src/modules/placements/report-model.ts:314-330 — Report metrics aggregate current screening/offer state, not same metric keys.
- Fix: Map exact metrics keys/units to report model with separate snapshot.

## G2-17-012-012  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:202-219 — Funnel counts every application that ever reached stage.
- vNext now: src/modules/placements/report-model.ts:236-320 — Report summary counts current application screening state.
- Fix: Add historical cumulative funnel distinct from current snapshot.

## G2-17-012-038  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:202-219 — Funnel monotonic historical accumulation, not snapshot.
- vNext now: src/modules/placements/report-model.ts:314-330 — Summary current-state statuses, not historical funnel.
- Fix: Compute ever-reached stages from audited transitions.

## G2-13-031-080  [P1] GAP  facet F04  effort M
- Legacy: Legacy placedUnique counts DISTINCT learners with statuses from college rule. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:82-85`
- vNext now: vNext unique membership ID and full-time-only rule. `src/modules/placements/report-model.ts:301-309`
- Fix: Reconcile employment-type exclusion under selected college rules.

## G2-13-031-081  [P1] GAP  facet F04  effort M
- Legacy: Legacy acceptedUnique counts DISTINCT any accepted learner. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:86-89`
- vNext now: vNext studentsAccepted counts accepted full-time learner only. `src/modules/placements/report-model.ts:332-335`
- Fix: Clarify population or return same all-accepted measure.

## G2-13-031-082  [P1] GAP  facet F04  effort M
- Legacy: Legacy offers KPI counts RELEASED/ACCEPTED only. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:90-93`
- vNext now: vNext offers KPI includes declined/withdrawn/all persisted. `src/modules/placements/report-model.ts:325-332`
- Fix: Split active released+accepted from all offers.

## G2-13-031-083  [P1] GAP  facet F04  effort M
- Legacy: Legacy placed percentage rounded one decimal; 0 registrations gives 0. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:103-109`
- vNext now: vNext rounded whole percent, null with denominator0. `src/modules/placements/report-model.ts:184-188`
- Fix: Restore precision/empty-population contract.

## G2-13-031-084  [P1] GAP  facet F04  effort M
- Legacy: Legacy liveDrives counts only PUBLISHED nondeleted jobs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:94-95`
- vNext now: vNext drives counts all selected jobs. `src/modules/placements/report-model.ts:314-317`
- Fix: Count published active drives separately.

## G2-13-031-086  [P1] GAP  facet F04  effort M
- Legacy: Legacy CTC is best positive ctc_lpa per student across placed qualifying offers. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:118-125`
- vNext now: vNext best accepted full-time OFFER annual CTC INR. `src/modules/placements/report-model.ts:190-215`
- Fix: Align offer status/cohort, currency and stipend exclusion.
