# Work packet (wave 2): edit src/modules/placements/recruiter-mail-body-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md

## G2-5-026-011  [P2] GAP  facet F06  effort M
- Legacy: Legacy Worker may submit envelope plus header sender, plain or HTML, authentication-results string. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:52-62`
- vNext now: vNext requires nonempty text and email values, no HTML body or auth data. `src/modules/placements/recruiter-message-email-inbound-service.ts:10-15`, `src/modules/placements/recruiter-mail-body-model.ts:1-3`
- Fix: Normalize provider webhook input server-side with original/header provenance.

## G2-5-026-033  [P2] GAP  facet F14  effort M
- Legacy: Legacy HTML accepted but only as fallback text; attachments not processed in service. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:52-62,209-213`
- vNext now: vNext text-only payload, no attachments. `src/modules/placements/recruiter-message-email-inbound-service.ts:10-15`, `src/modules/placements/recruiter-mail-body-model.ts:1-3`
- Fix: Provide HTML text extraction and document unsupported attachments.
