# Work packet (wave 2): edit src/app/(authenticated)/hr/messages/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:109-115 — Messages threads dedicated API in chosen college.
- vNext now: src/app/(authenticated)/hr/messages/page.tsx:1-4 — /hr/messages aliases /hr/conversations.
- Fix: Map messages thread shape and navigation labels

## G2-10-025-048  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:109-115 — GET /api/v1/recruiter/messages/threads.
- vNext now: src/app/(authenticated)/hr/messages/page.tsx:1-4 — Reads new conversation inbox through page/API.
- Fix: Preserve newest-first and unread count
