# Work packet: edit src/db/schema/placement-learner-general-requests.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-007  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:36-74 — Long id; learnerId, type, jobId, applicationId, arbitrary payload, reason, status and decision metadata.
- vNext now: src/db/schema/placement-learner-general-requests.ts:8-23 — UUID id, membership/college, typed kind/target, JSONB payload, version.
- Fix: Map legacy learner/job/application IDs and decision metadata.

## G2-14-023-008  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:53-55 — statuses PENDING/APPROVED/REJECTED/AUTO_APPROVED.
- vNext now: src/db/schema/placement-learner-general-requests.ts:16-17,32 — general requests PENDING/APPROVED/REJECTED/CANCELLED.
- Fix: Define AUTO_APPROVED vs CANCELLED compatibility.

## G2-14-023-047  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:24-74 — student_request Long PK, numeric user/job/app, payload_json MySQL JSON, status AUTO_APPROVED.
- vNext now: src/db/schema/placement-learner-general-requests.ts:8-37 — placement_learner_general_requests UUID, JSONB, membership/college, CANCELLED status.
- Fix: Write full legacy ID/type/status/payload/history migration map.

## G2-14-023-048  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:69-70 — escalate_at persisted on request row.
- vNext now: src/db/schema/placement-learner-general-requests.ts:8-23 — no escalation field in general request table.
- Fix: Add escalation tracking or map to specific job-request table.

## G2-14-023-017  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:41 — Keep the reason under 1000 characters.
- vNext now: src/modules/placements/tpo-general-request-model.ts:3 and src/db/schema/placement-learner-general-requests.ts:33 — reason 3..2000 with alternate errors.
- Fix: Maintain exact boundary wording or adjust UI.
