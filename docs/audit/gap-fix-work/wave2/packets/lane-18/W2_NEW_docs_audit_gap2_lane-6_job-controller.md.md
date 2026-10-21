# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/job-controller.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/job-controller.md

## G2-6-027-005  [P2] GAP  facet F04  effort M
- Legacy: GET /all maps id, jobTitle, companyName, jobDescription, jobType, location and candidatePreferences (JobController.java:197-205).
- vNext now: Feed produces job, roleOption and company nested objects (learner-job-service.ts:67-88,279-288).
- Fix: Provide explicit mapped field crosswalk for list cards, preserving legacy labels and fallback values.

## G2-6-027-007  [P2] GAP  facet F04  effort M
- Legacy: GET /all exposes isVisible, visibilityReason, canApply from visibility only (JobController.java:217-223).
- vNext now: Feed separates eligibility, applicationBlockers, deadlinePassed, and canApply (learner-job-service.ts:220-288).
- Fix: Map isVisible separately from current apply eligibility and preserve non-visible reason contract.

## G2-6-027-009  [P2] GAP  facet F04  effort M
- Legacy: GET /applied returns {applied, applicationId, applicationStatus} (JobController.java:583-603).
- vNext now: Feed has application {id,status,eligibilityStatus,submittedAt,withdrawnAt} at role-option granularity (learner-job-service.ts:78-88,118-129).
- Fix: Expose exact job-level applied semantics and applicationId/status, disambiguating multiple role options.

## G2-6-027-017  [P2] GAP  facet F06  effort S
- Legacy: Offer response legacy body requires boolean accept (JobController.java:710-719).
- vNext now: vNext discriminated action ACCEPT, DECLINE or WITHDRAW; decline reason optional, withdraw reason 1..2000 (validation.ts:1165-1194).
- Fix: Adapt legacy accept boolean to vNext offer action without changing existing client contract.

## G2-6-027-030  [P2] GAP  facet F10  effort M
- Legacy: Apply POST /{jobId}/apply/{learnerId} invokes applyGate and jobService.applyToJob; legacy response HTTP200 (JobController.java:398-447).
- vNext now: vNext POST /jobs/[jobId]/applications calls applyToPlacementJob and responds 201 (jobs/[jobId]/applications/route.ts:34-56).
- Fix: Publish full method/path/payload/status response crosswalk and fix client contract assumptions.

## G2-6-027-049  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact feed strings: 'Active jobs retrieved successfully', 'Visible jobs retrieved successfully', 'Jobs retrieved successfully' (JobController.java:133-145,169-176,226-233).
- vNext now: vNext returns {jobs} without status/message envelope (jobs/me/route.ts:8-17).
- Fix: Preserve legacy user-facing copy wherever shown, or document API-only breaking response change.

## G2-6-027-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy saved strings: 'No saved jobs', 'Saved job IDs retrieved', 'Saved jobs retrieved' (JobController.java:830-855,862-883).
- vNext now: vNext GET returns {jobs}, not saved-ids and no response message (learner/saved-jobs/route.ts:7-12).
- Fix: Use exact empty state/feedback copy and expose ID projection if still needed.
