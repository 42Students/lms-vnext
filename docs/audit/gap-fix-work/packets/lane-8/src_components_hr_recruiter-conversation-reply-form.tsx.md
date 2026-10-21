# Work packet: edit src/components/hr/recruiter-conversation-reply-form.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md, docs/audit/gap2/lane-13/recruiter-messages.md

## G2-11-002-075  [P1] MISSING  facet F15  effort S
- Legacy: Inline RequestQuote for responding `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:842`
- vNext now: ReplyForm only takes threadId `src/components/hr/recruiter-conversation-reply-form.tsx:11`
- Fix: Propagate quote ID

## G2-13-004-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy send failure triggers message.error toast Could not send (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:120-123`)
- vNext now: New InlineNotice Could not send with HTTP-specific context (`src/components/hr/recruiter-conversation-reply-form.tsx:71-90`)
- Fix: Match success/failure notification semantics, preserving receipt safety.
