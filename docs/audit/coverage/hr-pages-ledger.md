# HR page-level UX and role-journey coverage ledger — chat-19

Scope: 22 entries from `docs/orchestrator/ui-ux/pages-hr.md`. All have existing source-level UX tests and named direct behavioral tests below. `tests/unit/chat19-hr-page-contracts.test.ts` asserts recruiter owner verification on 20 real pages, aliases, loading, errors and responsive contracts. **Authored, not CI-certified.** No tests were executed locally.

| Route | Legacy wording/focus source test | Direct page behavior test | Tested scenarios / boundaries |
|---|---|---|---|
| `/hr/activity` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-activity-01`) | `tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts` | invalid filters, no-access, expired and wrong-principal identity |
| `/hr/calendar` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-calendar-01`) | `tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts` | malformed URL, absent grant, identity denial |
| `/hr/colleges` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-colleges-01`) | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` | retired directory redirects to scoped Today |
| `/hr/company` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-company-01`) | `tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts` | team filters, college selection, identity denial |
| `/hr/company/reports` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-company-reports-01`) | `tests/unit/HR-BREAK-chat19-company-reports-principal.test.ts` | no-access, duplicate filters, identity and session denial |
| `/hr/conversations` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-conversations-01`) | `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts` | revoked grant, stale preview, ambiguous query, identity |
| `/hr/conversations/[threadId]` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-conversations-threadId-01`) | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` | IDOR, malformed pagination, safe partial outage, identity |
| `/hr/drives` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-drives-01`) | `tests/unit/HR-BREAK-chat19-drive-list-page.test.ts` | drive filters, authorized portfolio, session denial |
| `/hr/drives/[jobId]/interview-slots` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-drives-jobId-interview-slots-01`) | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | time-block state, malformed UUID and identity |
| `/hr/drives/[jobId]/messages` | `tests/ux-hr-rollout-01.test.mjs` (`UX-hr-drives-jobId-messages-01`) | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | no thread, malformed UUID, session/identity |
| `/hr/drives/[jobId]/rounds/editor` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-drives-jobId-rounds-editor-01`) | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | empty rounds, malformed UUID and identity |
| `/hr/drives/[jobId]/rounds/editor/remove/[roundId]` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-drives-jobId-rounds-editor-remove-roundId-01`) | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | stale/noneditable round, optimistic token, identity |
| `/hr/drives/new` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-drives-new-01`) | `tests/unit/HR-BREAK-chat19-drive-draft-duplicate-query.test.ts` | duplicate filters, source modes, session/identity |
| `/hr/drives/proposals` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-drives-proposals-01`) | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` | invalid proposal filters, denied access |
| `/hr/drives/recorded-outside` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-drives-recorded-outside-01`) | `tests/unit/HR-BREAK-chat19-recorded-outside-principal.test.ts` | foreign grant, no false publish, identity denial |
| `/hr/home` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-home-01`) | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` | tenant filters, grant no-access, identity |
| `/hr/messages` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-messages-01`) | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` | protected conversation alias, not notification bell |
| `/hr/notifications` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-notifications-01`) | `tests/unit/HR-BREAK-chat19-notifications-page.test.ts` | notification no-access, duplicate URL, identity |
| `/hr/placements` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-placements-01`) | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` | authorized portfolio, identity denial |
| `/hr/placements/jobs/[jobId]` | `tests/ux-hr-rollout-02.test.mjs` (`UX-hr-placements-jobs-jobId-01`) | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` | invalid job/applicant filter, IDOR and identity |
| `/hr/profile` | `tests/ux-hr-rollout-03.test.mjs` (`UX-hr-profile-01`) | `tests/unit/HR-BREAK-chat19-profile-page.test.ts` | profile access, revoked account, service resilience |
| `/hr/round-results` | `tests/ux-hr-rollout-03.test.mjs` (`UX-hr-round-results-01`) | `tests/unit/HR-BREAK-chat19-round-results-principal.test.ts` | filters, empty, touch and identity |

## Outstanding acceptance gates

- Existing UX tests assert copy, contrast utility, focus styles and shared layout components. These are source contracts, not evidence of real 320px/browser/screen-reader operation or computed tap target sizes; Round Results also has directly inspected 44px link-property tests.
- Cloud CI typecheck/unit suite, PostgreSQL permission/revocation concurrency, external provider failures, mobile and assistive-technology walkthroughs remain to be verified by the orchestrator. No unit test was weakened, deleted or run; no numbered migration or schema change was made.

## Deeper chat-19 HR/action second-pass evidence

| Surface / action | Gap ID | Test | Covered behavior |
|---|---|---|---|
| Active HR shell notification bell | HR-BREAK-ACTIVE-BELL-34 | `tests/unit/HR-BREAK-chat19-active-bell.test.tsx` | No auto-read on open, explicit read receipt, revocation, ScrollCue/focus |
| Bell JSON validation | HR-BREAK-BELL-PAYLOAD-35 | `tests/unit/HR-BREAK-chat19-bell-payload.test.ts` | Invalid URL/count/payload refused; authorized job cards |
| Alternate recruiter bell college selector | HR-BREAK-BELL-RACE-30 | `tests/unit/HR-BREAK-chat19-bell-race.test.tsx` | Out-of-order async response and cached revoked feed |
| Inline hiring round mutation | HR-BREAK-ROUND-RECEIPT-31 | `tests/unit/HR-BREAK-chat19-round-receipt.test.ts` | JSON persisted receipt, legacy native redirect, cross-origin, wrong round/action |
| Round draft dialog closure | UX-HR-ROUND-UNSAVED-32 | `tests/unit/UX-HR-chat19-round-unsaved.test.ts` | Dirty/clean state, Escape/backdrop/Cancel confirmation |
| Drive request saved receipt | HR-BREAK-DRIVE-RECEIPT-33 | `tests/unit/HR-BREAK-chat19-drive-receipt.test.ts` | Exact producer/consumer confirmation and forged-message denial |
| Candidate private rating | HR-BREAK-PRIVATE-RATING-36 | `tests/unit/HR-BREAK-chat19-private-rating-scope.test.tsx` | Per-applicant and per-job state keys, initial disabled state |
| Conversation reply and acknowledgement | HR-BREAK-CONVO-THREAD-SCOPE-37 | `tests/unit/HR-BREAK-chat19-conversation-thread-scope.test.tsx` | Thread-specific draft/read state and cleanup |
| New/Copy/Edit/Fix drive form | HR-BREAK-DRIVE-DRAFT-SCOPE-38 | `tests/unit/HR-BREAK-chat19-drive-draft-scope.test.ts` | Principal, college, mode and source-isolated state and storage |

All entries are **authored, not locally executed**. PostgreSQL/provider, real responsive screen readers and keyboard navigation remain orchestrator acceptance gates; no test was weakened or removed.

## Additional weak-area HR pure model branch coverage

| Model functions | Evidence | Tested cases |
|---|---|---|
| `recruiterTodayWaitingRequests` | `tests/unit/HR-BREAK-chat19-today-waiting-progress.test.ts` | Formal statuses only, chronological ordering, 8-item cap, untouched source, malformed draft fallback |
| `recruiterDriveProgressSteps` | Same test | Exact stage copy; not claiming unshared rounds/offers/joining complete |
| `recruiterDriveNextAction` | Same test | Closed, issued offer, no applicants, active rounds, default next action |

These branch-level tests are authored, not executed; fixture timestamps use 2099.

| Recruiter team attribution and branch suggestions | HR-BREAK-TEAM-ATTRIBUTION-40 | `tests/unit/HR-BREAK-chat19-team-attribution.test.ts` | Approved DRAFT-only attribution, duplicate/conflicting requests, foreign IDs and recruiter principal guards |

| HR Today follow-up offer jobs | HR-BREAK-CLOSED-OFFER-41 | `tests/unit/HR-BREAK-chat19-closed-offer-company-touch.test.ts` | Closed/published scope with unshared/archived exclusion, priority and limits |
| HR Company/Team phone tab links | UX-HR-COMPANY-TOUCH-42 | Same test | Minimum 44px tabs, college pills, keyboard focus and exact title |

| HR profile college access revocation | HR-BREAK-LEAVE-GRANT-43 | `tests/unit/HR-BREAK-chat19-leave-grant.test.ts` | Exact persisted revocation receipt, foreign status/ID rejection, accessible confirmation and single-flight |

| HR self-profile state and grant-remount boundary | HR-BREAK-PROFILE-SCOPE-44 | `tests/unit/HR-BREAK-chat19-profile-page.test.ts` | Actor changes, current grant revision and no previous user's profile on server render |

| Recruiter portfolio shared applicant/offer aggregate | HR-BREAK-PORTFOLIO-WITHDRAWN-45 | `tests/unit/HR-BREAK-chat19-portfolio-withdrawn.test.ts` | Expired/foreign identity, empty IDs, withdrawn exclusion in both SQL aggregates |

| HR recruiter decision notification read mutation | HR-BREAK-DECISION-READ-46 | `tests/unit/HR-BREAK-chat19-decision-read.test.ts` | Read receipt identity and timestamp, failed response, redirect guard, double-submit and 44px |

| HR unsent drive browser draft discard | UX-HR-DRAFT-CLEAR-47 | `tests/unit/UX-HR-chat19-draft-clear.test.ts` | Confirm dialog, both storage stores, failed deletion preservation, 44px targets |

| Recruiter notifications Mark as read | HR-BREAK-READ-RECEIPT-48 | `tests/unit/HR-BREAK-chat19-read-receipt.test.ts` | Server origin protection, exact persisted receipt, HTML redirect/foreign notification refusal, single-flight gating |

| HR profile details saved-response verification | HR-BREAK-PROFILE-RECEIPT-48 | `tests/unit/HR-BREAK-chat19-profile-receipt.test.ts` | Exact persisted profile/versions, forged sign-in JSON, invalid phone/name, draft preservation |

| HR recruiter reply and confirmation | HR-BREAK-CONVO-RECEIPT-49 | `tests/unit/HR-BREAK-chat19-conversation-receipt.test.ts` | Actor authorization, origin guard, persisted ID, HTML fallback denial, native 303 |
