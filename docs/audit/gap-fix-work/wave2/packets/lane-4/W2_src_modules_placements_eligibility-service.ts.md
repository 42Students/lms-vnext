# Work packet (wave 2): edit src/modules/placements/eligibility-service.ts

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md, docs/audit/gap2/lane-15/job-eligibility-override.md, docs/audit/gap2/lane-16/u015-job-eligibility.md, docs/audit/gap2/lane-17/job-eligibility-override-repository.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-18-023-004  [P2] GAP  facet F03  effort M
- Legacy: Legacy separate rule per check with `rule`,`pass`,`detail`; EligibilityService.java:61-91
- vNext now: vNext criterion/status PASS/FAIL/MISSING with actual/required/detail; eligibility-service.ts:161-183,815-843
- Fix: Map pass/fail to status badges, show rule text/details in exact legacy order and new MISSING distinct.

## G2-18-023-006  [P2] GAP  facet F04  effort M
- Legacy: Eligibility JSON `eligible:boolean`, `checks:[{rule,pass,detail}]`, `isOverride:boolean`; EligibilityService.java:66-91
- vNext now: vNext `status`, check fields and `override:{id,decision,reason}\|null`; eligibility-service.ts:161-183
- Fix: Return normalized compatible display DTO and explicit applied override status without false check marks.

## G2-15-015-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy preview shows eligible/excluded counts, branches, reasons. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:324-376`)
- vNext now: New individual evaluator no aggregate branch preview in same API. (`src/modules/placements/eligibility-service.ts:947-975`)
- Fix: Retain TPO preview counters and distribution in drive workspace.

## G2-15-015-006  [P2] GAP  facet F03  effort S
- Legacy: Override reason appears in rule check labelled Added by college. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:104-105`)
- vNext now: New override returns decision/reason but empty checks array. (`src/modules/placements/eligibility-service.ts:1098-1110`)
- Fix: Render an explicit Added by college rule row with override reason.

## G2-15-015-014  [P2] GAP  facet F05  effort M
- Legacy: Batch evaluator maintains input LinkedHashMap order. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:117-129`)
- vNext now: New individual evaluator queries one user; batched UI driven elsewhere. (`src/modules/placements/eligibility-service.ts:975-995`)
- Fix: Use batch loading for 10k learner preview, preserve row order.

## G2-15-015-015  [P2] GAP  facet F05  effort M
- Legacy: Excluded list capped200 names. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:363-367`)
- vNext now: Individual evaluator no exclusions list/cap. (`src/modules/placements/eligibility-service.ts:947-975`)
- Fix: Ensure drive aggregate preview caps excluded named rows at 200.

## G2-15-015-016  [P2] GAP  facet F05  effort M
- Legacy: Branch aggregates via TreeMap natural sort. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:331-375`)
- vNext now: New individual check no branch counts. (`src/modules/placements/eligibility-service.ts:947-975`)
- Fix: Expose sorted eligibleByBranch for cloned preview.

## G2-15-015-031  [P2] GAP  facet F10  effort M
- Legacy: SQL insert ... on duplicate key UPDATE for same job+learner. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:387-389`)
- vNext now: Transaction revoke old+insert new and audit event. (`src/modules/placements/eligibility-service.ts:740-768`)
- Fix: Map old upsert semantics onto immutable versioned API; one active record invariant.

## G2-15-015-034  [P2] GAP  facet F10  effort S
- Legacy: Evaluation returns included boolean/checks/isOverride. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- vNext now: New result status ELIGIBLE/INELIGIBLE and override object. (`src/modules/placements/eligibility-service.ts:1098-1111`)
- Fix: Project status/result into old positive/negative override badge and reason.

## G2-15-015-035  [P2] GAP  facet F10  effort M
- Legacy: Preview aggregates eligibility with overrides. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:324-376`)
- vNext now: New per-member GET does not aggregate. (`src/modules/placements/eligibility-service.ts:947-995`)
- Fix: Add batch preview route for old overview counters.

## G2-15-015-043  [P2] GAP  facet F13  effort S
- Legacy: Repeated clear has no error. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:392-395`)
- vNext now: New repeated clear returns NOT_FOUND. (`src/modules/placements/eligibility-service.ts:810-813`)
- Fix: Treat already-cleared as success or friendly empty state.

## G2-15-015-047  [P2] GAP  facet F15  effort S
- Legacy: Rule check Added by college contains reason. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:104-105`)
- vNext now: New exposes override reason for caller. (`src/modules/placements/eligibility-service.ts:1098-1110`)
- Fix: Show reason in learner-facing check with old label.

## G2-15-015-051  [P2] GAP  facet F18  effort S
- Legacy: Exact label Added by college. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:104-105`)
- vNext now: New returns decision/reason but no literal label. (`src/modules/placements/eligibility-service.ts:1105-1110`)
- Fix: Use Added by college in visible override marker.

## G2-15-015-055  [P2] GAP  facet F19  effort M
- Legacy: Max 200 excluded named students. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:363-367`)
- vNext now: New individual lookup avoids N+1 only per request. (`src/modules/placements/eligibility-service.ts:975-995`)
- Fix: Bound aggregate preview and use DB joins.

## G2-15-015-067  [P2] GAP  facet F23  effort M
- Legacy: Old drive preview aggregates 284 eligible/37 excluded branch and rules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:296-376`)
- vNext now: New evaluator scoped to one membership. (`src/modules/placements/eligibility-service.ts:947-1112`)
- Fix: Restore aggregate preview in TPO workspace using batch evaluation.

## G2-16-015-001  [P2] GAP  facet F01  effort M
- Legacy: JobEligibility.java:8-16 is embedded eligibility_json on job; not an independent page.
- vNext now: eligibility-service.ts:530-593 policy read by job UUID.
- Fix: Map legacy JSON policy to the vNext normalized policy in the job editor; no extra navigation entry.

## G2-16-015-018  [P2] GAP  facet F10  effort L
- Legacy: JobEligibility.java:8-12 stored as job.eligibility_json with target columns.
- vNext now: eligibility-service.ts:602-666 persists separate policy with actor and scope validation.
- Fix: Maintain all legacy criteria and target scope on write, record migration mapping.

## G2-16-015-034  [P2] GAP  facet F20  effort M
- Legacy: JobEligibility.java:9-10 null allows without minimum; zero is explicit minimum.
- vNext now: eligibility-service.ts:185-204 scales hundredths half-up.
- Fix: Verify 0 vs null and .005 rounding across old Double comparison, show two decimal rule.

## G2-17-014-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-106 — Effective result includes eligible boolean, override boolean, one check with reason.
- vNext now: src/modules/placements/eligibility-service.ts:1098-1118 — Returns status, checks, override record id/decision/reason.
- Fix: Map legacy eligible/isOverride flags to vNext response contract.

## G2-18-023-048  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:305-316 missing marks shown 'Not provided'
- vNext now: src/modules/placements/eligibility-service.ts:829-836 `Evidence not provided`
- Fix: Use old exact missing-data label in checklist where required.

## G2-18-023-056  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:75-98 per-rule checks includes readable name/detail/pass
- vNext now: src/modules/placements/eligibility-service.ts:161-186 codes PASS/FAIL/MISSING and numeric values
- Fix: Render text passed/failed/missing in accessible list, not badge color alone.

## G2-18-023-059  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:344-359 CGPA rule detail 'min X' with '(not verified)' and converted %
- vNext now: src/modules/placements/eligibility-service.ts:843-849 generic Requirement met/not met
- Fix: Restore actual-versus-min text and verification qualifier per rule.

## G2-18-023-064  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:302-315 verifiedOnly missing scores fail, unverified annotated
- vNext now: src/modules/placements/eligibility-service.ts:1091-1096,1300-1311 NEEDS_DATA and empty checks for unverified-only
- Fix: Return explicit failing check for unverified evidence, not empty checklist.

## G2-15-015-053  [P3] GAP  facet F18  effort S
- Legacy: Company agreed manual INCLUDE description. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:379-381`)
- vNext now: New audit summary Drive eligibility override saved. (`src/modules/placements/eligibility-service.ts:682-697`)
- Fix: Restore context hint Company agreed under INCLUDE option.

## G2-17-014-039  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:217 — Audit action `ELIGIBILITY_INCLUDE/EXCLUDE`.
- vNext now: src/modules/placements/eligibility-service.ts:694-696 — Generic saved/cleared event titles.
- Fix: Preserve action-specific audit trail copy.
