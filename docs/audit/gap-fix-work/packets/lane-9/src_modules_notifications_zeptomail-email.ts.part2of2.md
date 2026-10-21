# Work packet: edit src/modules/notifications/zeptomail-email.ts (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-4-033-018  [P2] GAP  facet F07  effort M
- Legacy: ZeptoMail exposes provider HTTP error body in diagnostics `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:63-85`
- vNext now: OTP adapter returns false and logs error categories `src/modules/notifications/zeptomail-email.ts:114-128`
- Fix: Map safe provider failure codes to operator diagnostics without logging private message content.

## G2-4-033-020  [P3] GAP  facet F08  effort S
- Legacy: Legacy mail success logged per recipient and template `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:148-156`
- vNext now: OTP adapter logs `email.otp_accepted` `src/modules/notifications/zeptomail-email.ts:114-125`
- Fix: Retain auditable non-PII success state and caller-specific toast duration/content.
