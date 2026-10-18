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

Additional model functions covered by tests/unit/hr-recruiter-exhaustive-chat15-02.test.ts:

| Function(s) | Cases |
|---|---|
| hrInterviewSlotCreateSchema, hrInterviewSlotActionSchema, slotTransitionAllowed | Valid input, malformed dates, invalid zones/modes/IDs, 8-hour limit, slot capacity, double-booking and forbidden transitions |
| slotsOverlap, parseIstLocalSlot, canRecruiterMutateOwnSlot | Half-open overlap, invalid persisted intervals, impossible IST date, ownership |
| hrScheduledRoundRows, hrRoundConflictLabels, hrRoundConflictLinks | Filter, ordering, conflicts, labels, authorized deep-link construction |
| hrNextCalendarEvent, hrResultDeadlineUrgency | Future-only category filters, boundary time |
| groupHrNotificationPage, buildHrOfferCsv | Group unread, limit 200, formula injection, masking |
| hrRecruiterReplySchema, recruiterReviewNoteSchema, hrTeamSearchSchema, searchHrTeam | Validation limits, strict keys, ratings, search matching |
| nextHrProposalAttempt, reorderHrDraftRound, duplicateHrDraftRound, hrDraftContainsWork | Idempotent proposal key, immutable ordering, duplicate limits, draft changes |

Not yet covered: all unlisted exported functions and handlers, unauthenticated/wrong-role/other-college integration cases, same-origin and body limit guards, rollback, audit/activity/notification effects, idempotency and duplicate concurrent requests. The user-requested full exhaustive ledger remains open.
