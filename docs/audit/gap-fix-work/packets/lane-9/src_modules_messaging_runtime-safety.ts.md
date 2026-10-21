# Work packet: edit src/modules/messaging/runtime-safety.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/zeptomail-service.md, docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-13-011-024  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:114-118` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:203-219` STAGE nonprod DEV_MAIL_ALLOW supports email or @domain
- vNext now: `src/modules/messaging/runtime-safety.ts:9-18` APP_ENV only permits AUTH_TEST_EMAILS exact entries
- Fix: Reconcile dev allowlist contracts; choose safe centralized config and migration path for test-domain allowlists

## G2-18-010-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy configurable STAGE/DEV_MAIL_ALLOW controls dispatch (`TpoMailService.java:55-61,203-220`).
- vNext now: New APP_ENV/AUTH_TEST_EMAILS controls allowlist (`messaging/runtime-safety.ts:3-19`).
- Fix: Reconcile environment variables and test nonprod deny-by-default across all sender paths.
