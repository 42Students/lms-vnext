# HR / Recruiter coverage ledger · chat-15

Partial inventory of high-risk pure functions completed in this round. NOT an assertion of exhaustive module coverage. Full module includes hundreds of exported functions, UI pages and HTTP route handlers requiring ledger rows and actual PostgreSQL integration.

| Function | Test | Cases covered | Missing evidence |
|---|---|---|---|
| hrRoundFormSchema | tests/unit/hr-recruiter-exhaustive-chat15-01.test.ts | allowed create/update/remove, name limits, mode, kind, optimistic token, forbidden fields, invalid size | real route/database |
| canRecruiterEditRound | same | author, wrong author, pending/nonpending, result/slot immutability | server enforcement |
| duplicateRecruiterRoundName | same | Unicode, whitespace, self-exclusion and cancelled records | database race |
| isHrDriveProposalResponse | same | valid response, UUID validation, replay shape, false positives | client save/retry |
| summarizeRecruiterUnread | same | empty, negative and multiple threads | receipts transaction |
| trustedRecruiterDomain | same | exact company/trusted domain and unsafe suffix/subdomains | verified grant integration |
| recruiterDriveApprovalPolicy | same | unverified grant, disabled approval, trusted relationship, mandatory review | request state machine |
| recruiterGrantValidUntil | same | leap-day month clamp and duration bounds | clock integration |
| recruiterGrantEffectiveAt | same | valid, revoked, pending, missing/expired, wrong capability | tenant/college permission matrix |

Not yet covered: all unlisted exported functions and handlers, unauthenticated/wrong-role/other-college integration cases, same-origin and body limit guards, rollback, audit/activity/notification effects, idempotency and duplicate concurrent requests. The user-requested full exhaustive ledger remains open.
