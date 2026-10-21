# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/job-controller.md

12 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/job-controller.md

## G2-6-027-012  [P1] GAP  facet F05  effort M
- Legacy: Legacy org-active and target-visible separate lists; /all includes hidden status (JobController.java:108-125,162-169,187-224).
- vNext now: vNext query filters published, active company, target cohort and section before return (learner-job-service.ts:131-147,200-207).
- Fix: Expose an authorized hidden/closed view only if legacy UX requires it, without leaking cross-tenant jobs.

## G2-6-027-015  [P1] GAP  facet F06  effort M
- Legacy: Apply accepts optional request body resumeUrl with regex https? and deprecated query-string resumeUrl fallback (ApplyToJobRequest.java:8-16; JobController.java:398-405,439-441).
- vNext now: vNext strict apply schema accepts optional roleOptionId/channel/externalConfirmation; no resumeUrl (validation.ts:659-672).
- Fix: Provide secure resume/object reference submission or explicitly preserve profile-resume policy and consent.

## G2-6-027-020  [P1] GAP  facet F07  effort S
- Legacy: Legacy duplicate apply returns 409 'You have already applied to this job' (JobController.java:453-457).
- vNext now: vNext returns existing active application on duplicate, rather than throwing (application-service.ts:624-643).
- Fix: Define desired idempotent UX, preserve duplicate feedback on repeat click without second submission.

## G2-6-027-039  [P1] GAP  facet F12  effort M
- Legacy: Legacy visibility distinct from screening eligibility, no pre-apply academic hard rejection per controller philosophy (JobController.java:38-42,149-159).
- vNext now: vNext feed computes eligibility status and canApply blockers (learner-job-service.ts:220-288).
- Fix: Make visibility vs eligibility distinction explicit; validate permitted apply override policy.

## G2-6-027-044  [P1] GAP  facet F14  effort L
- Legacy: Legacy apply accepts external resumeUrl in body or query (JobController.java:395-405,439-444).
- vNext now: vNext apply schema rejects resumeUrl, requires distinct storage flow if any (validation.ts:659-672).
- Fix: Implement signed-upload/resume-reference consent or document intentional no-file release.

## G2-6-027-052  [P1] GAP  facet F19  effort L
- Legacy: Legacy /active paginates in memory after fetching all jobs with max100 (JobController.java:123-132).
- vNext now: vNext /jobs/me loads all matching published roles, then per-row eligibility async Promise.all (learner-job-service.ts:67-153,225-290).
- Fix: DB page source before eligibility, use bounded query and cached shared eligibility by job.

## G2-6-027-059  [P1] GAP  facet F22  effort M
- Legacy: Legacy JobApplication entity foreign keys, applicationStatus and appliedAt (JobController.java:401-447; JobApplicationRepository.java:42-52).
- vNext now: vNext application uses UUID job,role,membership; status SUBMITTED/WITHDRAWN and timestamptz (placements.ts:973-1020,1047-1050).
- Fix: Publish data-field/status projection for learner UI and reports; no physical migration needed.

## G2-6-027-061  [P1] GAP  facet F22  effort L
- Legacy: Legacy application history supports rich statuses on entity and timeline (JobController.java:547-563).
- vNext now: vNext base history fromStatus/toStatus constrained to SUBMITTED/WITHDRAWN (placements.ts:1064-1103).
- Fix: Build derived unified screening/round/offer timeline rather than assuming base history substitutes all stages.

## G2-6-027-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy offer response requires boolean or returns 'accept (boolean) is required' (JobController.java:717-719).
- vNext now: vNext accepts action enum and Zod fails on legacy boolean payload (validation.ts:1165-1194).
- Fix: Explicitly map old payload or return a migration error with expected action contract.

## G2-6-027-025  [P2] GAP  facet F08  effort S
- Legacy: Apply responds success 'Application submitted successfully. Screening will be completed shortly.' (JobController.java:442-447).
- vNext now: vNext POST responds {application}, status201 with no message (jobs/[jobId]/applications/route.ts:45-56).
- Fix: Render exact success toast/text and screen-pending indication on learner UI.

## G2-6-027-026  [P2] GAP  facet F08  effort S
- Legacy: Withdrawal success message 'Application withdrawn successfully' (JobController.java:660-664).
- vNext now: vNext returns {application} without success string (applications/[applicationId]/actions/route.ts:25-35).
- Fix: Show exact success feedback and status update/undo policy.

## G2-6-027-027  [P3] GAP  facet F08  effort S
- Legacy: Save success 'Job saved' and unsave 'Job removed from saved' (JobController.java:782-785,816-820).
- vNext now: vNext returns {saved:boolean} / {removed:boolean} only (learner/saved-jobs/[jobId]/route.ts:8-22).
- Fix: Match distinct save/unsave success toast wording and duration on UI.
