# Learner / Profile and miscellaneous — chat-6 acceptance

Audit: `docs/audit/pages/learner/profile-misc.md`. The owner decision `docs/audit/owner-decisions-resolved.md` permits links only while private object storage is not provisioned. Tests were **not run**.

| ID | Status | Evidence / unblock condition |
|---|---|---|
| LEARNER-profile-misc-01 | BLOCKED | Legacy resume upload/replace/remove and Drive import need a provisioned private bucket, malware scanning, scoped signed learner upload receipts and a default application attachment. Text fields cannot substitute for uploaded resumes; see queue blocker. |
| LEARNER-profile-misc-03 | BLOCKED | Aadhaar, PAN, and education marksheet PDF/JPG/PNG need private object storage, malware scanning, verified receipts and protected access checks before upload controls or verification can be accepted; see queue blocker. |
| LEARNER-profile-misc-04 | BLOCKED | Video introduction recording and upload require safe camera/file capture, private video storage, scanner and verified delivery receipts; see queue blocker. |

No upload is claimed complete or safe without those dependencies. These blocked IDs intentionally have no passing tests pretending private storage exists; when provisioned the orchestrator should require named upload/integration tests for each ID.
