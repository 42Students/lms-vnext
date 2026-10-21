# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/temporary-sms-outage-recovery.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/temporary-sms-outage-recovery.md

## G2-2-005-010  [P2] GAP  facet F07  effort S
- Legacy: LC:67-73 suppresses only RuntimeException in sendOtp and returns false; all other causes rethrow
- vNext now: NN:131-137 catches provider errors and returns false
- Fix: Confirm business-level handling of provider false and non-runtime exceptions; avoid swallowing unrelated runtime exceptions.

## G2-2-005-011  [P3] GAP  facet F07  effort S
- Legacy: LC:62 warning `SMS OTP delivery returned false; temporary testing fallback is active`
- vNext now: NN:106-110 logs sms.otp_not_accepted with provider status
- Fix: Record intentional log format change; no obsolete fallback wording required.

## G2-2-005-012  [P3] GAP  facet F07  effort S
- Legacy: LC:69-70 warning `SMS OTP provider threw {}; temporary testing fallback is active`
- vNext now: NN:133-136 warns sms.otp_request_failed with errorType
- Fix: Retain non-PII error class observability but do not mention expired bypass.
