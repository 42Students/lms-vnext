# Projects module hardening (IIT Dharwad is the main customer; be 1000 out of 10 careful)

Projects is the product we sell first. Treat every defect here as a release blocker. All accounts that touch projects must be unbreakable: Super Admin, College Admin, Mentor, Faculty, Learner, TPO/HR where they see project data.

## What "unbreakable" means
No sequence of clicks, double submits, refreshes, back/forward, slow networks, parallel sessions, stale tabs, expired sessions, malformed input, large data, or hostile requests may: lose data, corrupt state, show another college's data, expose raw errors, leave a project stuck, double-award, double-notify, or crash a page. Every failure shows friendly copy with a next step and preserves the user's input.

## Audit and test checklist (every item gets a test or a written, reviewed reason it is not applicable)
1. **State machines**: project, workspace, sprint, task, release, meeting, submission, review, approval. List every state and every transition, test all allowed and all forbidden ones, test transitions racing each other (version/expectedUpdatedAt conflicts), test idempotent retries.
2. **Tenancy and roles (IDOR)**: for every route handler, server action and service function, test own college, other college, other organization, wrong role, super admin scope, deactivated user, removed membership. Object ids from the URL must never grant access by themselves.
3. **Data integrity on PostgreSQL**: constraints, unique keys, foreign keys, cascades, deletion/archival behaviour, migration up path on a copy of realistic data, no orphan rows after failure (transactions roll back whole units).
4. **Deadlines, time and fairness**: IST handling, DST-free but verify date boundaries (23:59, midnight), late submission policy, extensions, grace windows, server time authority (never trust client time).
5. **Submissions and files**: size and type limits, virus-safe handling, duplicate uploads, resumed uploads, replace/withdraw rules, download authorization, signed URL expiry, filename safety, storage failure handling.
6. **Grading and review integrity**: rubric math, rounding, re-grade history, who can see what and when (learner sees only released results), audit trail of every change, no silent overwrite, export equals screen.
7. **Mentors and assignment**: capacity and overload rules, reassignment mid-project, mentor removed, conflicts of interest, handover notes, notifications to the right people exactly once.
8. **Notifications and activity**: exactly-once with dedupe keys, correct audience, correct wording, unsubscribe rules, failure of the channel never fails the action.
9. **Reporting and exports**: counts match lists, CSV escaping (formula injection), pagination cap messages, tenant scoping, timezone labels.
10. **Pages and UX**: every project page, modal, drawer, toast and empty/error/loading state from `docs/audit/ui-surfaces/ui-surfaces.json` (filter area projects) renders, is keyboard and phone usable, keeps legacy wording, and has a test.
11. **Performance and scale**: lists with 1,000+ projects/tasks paginate, queries use indexes (EXPLAIN in an integration test for the heaviest ones), no N+1 in loops, page weight sane.
12. **Resilience**: service dependency failures (DB timeout, storage, mail, Telegram) degrade gracefully; background jobs are idempotent and safe to re-run; no unhandled promise rejections.
13. **Security**: input validation with Zod everywhere, output escaping, CSRF/same-origin on mutations, rate limits on abuse-prone actions, no secrets in logs.
14. **Backups and recovery**: soft delete/restore paths work, archived projects are read-only everywhere, restore does not duplicate.

## Output
- `docs/audit/coverage/projects-ledger.md`: one row per exported function, route handler and page with its tests; no row empty.
- `docs/audit/projects-defects.md`: every defect found (id, severity, evidence, fix commit, test).
- Break-it tests: adversarial tests named `PROJ-BREAK-<area>-NN` that try to violate each rule above; each must pass after your fix.
- Target: every projects module file referenced by a test, every exported function named in a behavioural test, branch coverage above 90 percent for `src/modules/projects`.

## Squad
Lead and owner of the ledger: chat-14. Breakers (adversarial testers, fix what they find): chat-9, chat-6, chat-13. Harness and fixtures on real PostgreSQL: chat-17. Role journeys: chat-4 and chat-11 (College Admin), chat-3 (Faculty), chat-7 (Learner), chat-12 (TPO view), chat-15 (HR view). Reviewer for every fix: a different lane than the author.
