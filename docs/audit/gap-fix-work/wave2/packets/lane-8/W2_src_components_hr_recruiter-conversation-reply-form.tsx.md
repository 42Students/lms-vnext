# Work packet (wave 2): edit src/components/hr/recruiter-conversation-reply-form.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md, docs/audit/gap2/lane-13/recruiter-messages.md

## G2-11-002-059  [P2] GAP  facet F10  effort S
- Legacy: POST messages with job and quote `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:198`
- vNext now: Thread-reply endpoint `src/components/hr/recruiter-conversation-reply-form.tsx:66`
- Fix: Retain change request quote

## G2-13-004-022  [P2] GAP  facet F06  effort S
- Legacy: General draft textarea has rows=3, placeholder Write to placement cell (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:235-238`)
- vNext now: Reply form has rows=4, placeholder Write a message to the placement cell (`src/components/hr/recruiter-conversation-reply-form.tsx:94-101`)
- Fix: Match placeholder and rows in General composer; preserve 4k safety limit.

## G2-13-004-023  [P2] GAP  facet F06  effort S
- Legacy: Send disabled when empty/while sending/error loading (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:235-238`)
- vNext now: Reply button disabled only sending; blank draft shows inline message on submit (`src/components/hr/recruiter-conversation-reply-form.tsx:45-55`)
- Fix: Disable Send on blank whitespace before click and during unavailable history.

## G2-13-004-033  [P2] GAP  facet F09  effort S
- Legacy: Closing dirty drawer confirms Discard this unsent message? Keep writing (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:73-91`)
- vNext now: New global leave confirmation uses same title but cancel label default (`src/components/hr/recruiter-conversation-reply-form.tsx:110-115`)
- Fix: Make Keep writing cancel explicit and cover closing inline disclosure.

## G2-13-004-055  [P2] GAP  facet F17  effort S
- Legacy: Legacy Drawer keyboard true except sending; text field Ctrl/Cmd Enter (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:224-238`)
- vNext now: New reply keyboard shortcut and ConfirmActionDialog (`src/components/hr/recruiter-conversation-reply-form.tsx:95-115`)
- Fix: Verify Escape/Close and focus restoration when leave confirmation opens.
