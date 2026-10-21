# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l13-u022-tpo-request-controller.md

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l13-u022-tpo-request-controller.md

## G2-13-022-005  [P1] GAP  facet F04  effort M
- Legacy: Request includes payloadJson, learnerId, jobId nullable, applicationId nullable (StudentRequest.java:36-51).
- vNext now: Decision requires application join before authorizing (tpo-request-decision-service.ts:28-33).
- Fix: Support independent registration/PAP request kinds without application or explicit behavior change.

## G2-13-022-021  [P1] GAP  facet F12  effort M
- Legacy: Approved REGISTRATION_CHANGE applies valid choice via studentsRead.register (TpoRequestService.java:141-147).
- vNext now: Decision requires applicationId relation (tpo-request-decision-service.ts:28-33).
- Fix: Allow standalone registration requests and persist choice changes.

## G2-13-022-037  [P1] GAP  facet F22  effort M
- Legacy: Legacy allows nullable job/application for PAP/registration (TpoRequestService.java:39-64; StudentRequest.java:43-47).
- vNext now: Inner joins application+job to authorize (tpo-request-decision-service.ts:28-33).
- Fix: Use college+learner request scope independent of nullable application.

## G2-13-022-010  [P2] GAP  facet F07  effort M
- Legacy: IllegalArgumentException -> HTTP404 {error: message} even if malformed (TpoRequestController.java:48-51).
- vNext now: Typed schema/service errors via apiErrorResponse (requests/[requestId]/decision/route.ts:14-15).
- Fix: Preserve 404 for missing IDs, differentiate malformed input via 400.
