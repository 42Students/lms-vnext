# Work packet (wave 2): edit src/modules/messaging/runtime-safety.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-18-010-043  [P2] GAP  facet F12  effort S
- Legacy: Legacy dev allowlist supports exact email or `@domain` suffix (`TpoMailService.java:209-219`).
- vNext now: New AUTH_TEST_EMAILS contains explicit addresses only (`messaging/runtime-safety.ts:11-18`).
- Fix: Decide domain allowlist compatibility, avoid insecure broad domain bypass.
