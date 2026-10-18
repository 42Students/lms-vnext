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
