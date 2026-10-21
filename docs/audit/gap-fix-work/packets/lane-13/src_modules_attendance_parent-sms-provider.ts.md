# Work packet: edit src/modules/attendance/parent-sms-provider.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-053  [P1] GAP  facet F15  effort L
- Legacy: Legacy OTP, job and notification sender log attempts regardless of provider result. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-133`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:147-204`)
- vNext now: New OTP and attendance direct Exotel send do not append central attempts ledger. (`src/modules/notifications/exotel-sms.ts:57-138`; `src/modules/attendance/parent-sms-provider.ts:27-39`)
- Fix: Add universal provider attempt journal for all outgoing SMS categories.
