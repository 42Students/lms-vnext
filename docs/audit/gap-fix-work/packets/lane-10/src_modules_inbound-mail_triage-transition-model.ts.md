# Work packet: edit src/modules/inbound-mail/triage-transition-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md

## G2-10-009-023  [P1] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:19-28` status details distinguish POSTED/STORED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/ACCESS_ENDED/FAILED
- vNext now: `src/modules/inbound-mail/message-model.ts:8-12` and `src/modules/inbound-mail/triage-transition-model.ts:1-18` support only NEW/TRIAGED/RESOLVED
- Fix: Store delivery/routing outcome orthogonally to staff triage status
