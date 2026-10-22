# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-2-020-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-020-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-021-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-4-023-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_15.md)
- [ ] G2-4-023-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_15.md)
- [ ] G2-5-023-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_15.md)
- [ ] G2-11-011-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-078  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)

## Results

- G2-2-020-038: OK — vNext src/modules/projects/admin-submission-review-service.ts:92-160 (approve / changes requested with required feedback "Explain what needs to change.", durable project_submission_reviews row, activity metadata with feedback) and :60-84 (explicit LOCK with reason) match docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:427-469.
- G2-2-020-046: OK — vNext admin-submission-review-service.ts:99-160 is the same state machine as the mentor review: Accept / Request changes / Lock transitions, retry-safe duplicate handling (:122-130), optimistic expectedUpdatedAt check (:121,135-145, PROJECT_SUBMISSION_STALE_VERSION); matches AdminProjectController.java:427-458.
- G2-2-021-004: OK — vNext src/app/api/projects/templates/[templateId]/assignments/route.ts:23-26,101-141 exposes GET (baseline set + editHint) and PUT replace with expectedCollegeIds compare-and-set (replaceProjectTemplateCollegeAssignments); matches AdminProjectTemplateController.java:145-171.
- G2-4-023-018: FIXED — the TPO "Add other" API never offered the legacy "Use <company>" choice. src/modules/placements/company-service.ts adds findSamePlacementCompanyByName/loadPlacementCompanyIdentity/placementCompanyIdentityMatches; src/app/api/placements/tpo/companies/create/route.ts now returns 409 SAME_COMPANY (companyId, name, primaryDomain, "<name> is already on the list. Use it, or confirm it is a different company.") when an ACTIVE company has the same name on a different domain; src/components/tpo/tpo-company-create-form.tsx already renders "Use <company>" / "It's a different company" for that response. Matches TpoCompanyController.java:104-109.
- G2-4-023-025: FIXED — the old route rejected every notTheSame=true request with DISTINCT_COMPANY_REVIEW_REQUIRED (dead end). Now route.ts validates tpoDistinctCompanyReviewSchema (reviewedCompanyId, reviewedCompanyDomain, distinctCompanyReason >= 20 chars, different domain), re-reads the reviewed company on the server (stale -> 409 DISTINCT_COMPANY_REVIEW_STALE), creates through createPlacementCompany (domain uniqueness still enforced) and records the reason in an audited activity event; tpo-company-create-form.tsx gained the reason textarea and sends the review fields. Matches TpoCompanyController.java:39-45,56-58.
- G2-5-023-027: OK — vNext src/modules/placements/tpo-drive-change-request-service.ts:337,420-421 ("This one asks for a detail: answer it instead", ANSWER only valid for ASK) and src/modules/placements/tpo-drive-change-request-model.ts:107-117,150,153 ("Type the answer", "Type a reason", ASK/PROPOSE validation); matches DriveChangeRequestService.java:156-158,175-178,199-204.
- G2-11-011-064: OK — vNext src/components/placements/tpo-drive-edit-form.tsx:26,291,514-515 uses useUnsavedDriveGuard (src/components/placements/use-unsaved-drive-guard.ts: beforeunload plus internal-link interception with "Discard unsaved drive changes?" dialog); matches docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:215-230.
- G2-11-011-069: OK — deliberate, safe difference recorded: every vNext drive edit is an audited, reason-required save (tpo-drive-edit-form.tsx:131-165 validation incl. reason, :239-262 save with expectedUpdatedAt optimistic token, error mapping via tpoDriveFormErrorMessage, success/error toasts) and the form shows an explicit "Unsaved changes" state (:514-515) plus the unsaved guard, so a silent 1200ms server autosave is not used; DriveFormPage.js:327 itself never autosaves live drives (:322-326) and the create form keeps a debounced browser backup (placement-job-create-form.tsx:384-396,493).
- G2-11-011-078: OK — vNext models "recorded outside" as its own record (src/modules/placements/recorded-outside-service.ts, table src/db/schema/placement-outside-drives.ts) with no application deadline/registration fields, so a stale window cannot be saved; matches DriveFormPage.js:251-253.
- G2-11-011-089: OK — vNext src/components/placements/recorded-outside-form.tsx:38 states "No student is told when you record it" and the record flow never publishes or notifies students; matches DriveFormPage.js:608.
