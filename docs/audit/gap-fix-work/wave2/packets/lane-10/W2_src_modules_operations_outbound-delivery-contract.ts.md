# Work packet (wave 2): edit src/modules/operations/outbound-delivery-contract.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-sms-log-controller.md

## G2-2-024-012  [P2] GAP  facet F06  effort M
- Legacy: AdminSmsLogController.java:54-57 recipientSuffix,purpose,page,size query
- vNext now: src/modules/operations/outbound-delivery-contract.ts:37-48 accepts outbound send intent, not read query
- Fix: Define strict admin-read schema for filters/page/size, without recipient PII in URL logs.

## G2-2-024-038  [P2] GAP  facet F18  effort M
- Legacy: SmsDeliveryLog.java:28-31 purpose keys attendance.absence/correction/otp/job.update
- vNext now: src/modules/operations/outbound-delivery-contract.ts:9-12 keys recruiter invitations only
- Fix: Include attendance absence/correction/OTP/job purpose labels in ledger.
