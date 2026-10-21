# Work packet (wave 2): edit src/modules/placements/tpo-verification-queue-service.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md, docs/audit/gap2/lane-3/l11-u025-tpo-verification.md

## G2-1-010-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:49-55`: staff GET /profile-verification/access returns canVerify, collegeId and counts.
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:24-27`,`src/modules/placements/tpo-verification-queue-service.ts:20-38`: TPO page server-loads permission flags plus counts.
- Fix: Expose/translate access response for old sidebar clients; handle disabled and permission separately.

## G2-1-010-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:59-67`: queue and selected student have GET endpoints.
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:16-27`,`src/modules/placements/tpo-verification-queue-service.ts:20-38`: server-rendered query model and panel, not old URL.
- Fix: Map query filters/selected learner routes to vNext UUID membership pages.

## G2-1-010-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:327-343`: queue row has name, roll, branch, batch, entries, missingMarksheets and blindProblem.
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:56-112`: typed row includes member, section/status, attention flags.
- Fix: Verify each legacy column including missing marksheets and blind-verify blocker in new panel.

## G2-1-010-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:361-365`: staff detail student first/last/roll/branch plus latest 50 event history.
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:104-112`: queue row summary; `src/app/(authenticated)/tpo/verification/page.tsx:118`: panel, no history in top page.
- Fix: Ensure detail view includes verification event history up to 50 ordered DESC.

## G2-1-010-018  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:349-354`: counts keys SUBMITTED, UPDATE_PENDING, SENT_BACK, VERIFIED.
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:112-135`: counts grouped WAITING = submitted+update_pending, sent-back, verified.
- Fix: Preserve per-substatus detailed counters in tooltip/tab or service response.

## G2-1-010-044  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:70-81`: superadmin selects college; admin own college; TPO allowed only when tpoCanVerify, else exact 403 reason.
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:24-38`,`src/modules/profile-verification/service.ts:136-158`: membership permissions, persisted TPO grant and setting.
- Fix: Document extra persisted grant policy and exact denial copy.

## G2-11-025-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:34-48`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:55-110`
- Fix: Legacy student display concatenates firstName/lastName and marks differences by individual entry ID/field, vNext queue uses users.displayName and verificationDocumentManifest.

## G2-11-025-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-376`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:94-110`
- Fix: Legacy queue includes missingMarksheets and number of entries with colored Badge; vNext derives document manifest and missingIdentityProof; reconcile denominator.

## G2-11-025-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:367-375`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:79-80`
- Fix: Legacy Sent/Verified/Sent back display relative times from dj(...).fromNow(); vNext query includes submitted/decided timestamps but server status tables render alternate IST formatting.

## G2-11-025-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-376`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:79-80`
- Fix: Legacy column sort on Roll and submitted/decided date with client filter; vNext SQL sorts oldest waiting, newest others, then stable ID; preserve column sorting.

## G2-11-025-040  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:157-183`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:20-42`
- Fix: Legacy GET verification access then GET queue separately, vNext server queue checks settings, per-membership grants and membership role before SQL.

## G2-11-025-041  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:172-177`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:55-80`
- Fix: Legacy status query to queue with 1000 cap then client filtering; vNext server filters status/section/date/batch/branch/search before LIMIT/OFFSET.

## G2-11-025-046  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:219-227`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:24-39`
- Fix: Legacy may allow any authorized TPO with college setting; vNext requires per-membership unrevoked profileVerificationTpoGrants. Document narrower access matrix.

## G2-11-025-050  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:69-103`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:97-110`
- Fix: Legacy UPDATE_PENDING highlights modified fields against prior verified values; new queue computes attention but detailed drawer must show changedFields parity.

## G2-11-025-051  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:248-250`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:97-103`
- Fix: Legacy blind verification unavailable on missing marksheets or ID proof; new missingDocumentAttention includes identity proofs. Maintain safety across both.

## G2-11-025-074  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:79-81`
- Fix: Legacy fetch cap1000 and filters in browser can miss older matching records; vNext DB pre-filters and pages efficiently. Keep server advantage without changing counts.

## G2-11-025-076  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:198-210`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:82-110`
- Fix: Legacy one student detail fetched only on Drawer open; vNext preloads snapshot/manifest metadata for each page row, review payload size.

## G2-11-025-080  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:253-274`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:97-110`
- Fix: Legacy skip document-missing before bulk; vNext client filter on already paged authorized rows, edge of newer submissions, confirm server recheck.

## G2-11-025-081  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:14-15`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:20-40`
- Fix: Legacy VerificationService access/queue and getDocumentUrl via HTTP APIs; vNext PostgreSQL verification tables + manifest/signed grants, different readiness.

## G2-11-025-084  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:219-246`
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:55-110`
- Fix: Legacy submittedAt/version check for optimistic reviewer decision; vNext rowVersion in DB and membership scope. Preserve stale-version rejection.
