# Queue reassignments (read together with your own queue file)

Owner priority 2026-10-17: close every gap, fast. Queue sizes were unbalanced (chat-5 311 gaps, chat-3 78). These work packages are moved. A moved WP is owned by the new lane ONLY: the old lane must skip it. Work packages live in `docs/audit/work-packages/<original-lane>/<WP-id>.md`; record status in your OWN queue file (add the moved WP under a 'Moved in' heading).

| WP | New owner | Reason |
|---|---|---|
| WP-chat-5-02-requests-verification-students-s1 | chat-3 | students/requests S1 (College Admin and TPO share verification code) |
| WP-chat-5-09-students-requests-verification-s2 | chat-3 | same area |
| WP-chat-5-10-students-placements-s2 | chat-3 | same area |
| WP-chat-5-14-requests-verification-recruiters-s3 | chat-3 | same area |
| WP-chat-5-15-students-settings-audit-s3 | chat-3 | same area |
| WP-chat-5-04-batches-placements-s2 | chat-6 | batches pages (self-contained directories) |
| WP-chat-5-05-batches-calendar-reports-s2 | chat-6 | batches + reports |
| WP-chat-5-11-batches-placements-s3 | chat-6 | batches |
| WP-chat-5-16-batches-placements-s4 | chat-6 | batches |

chat-5 keeps: WP-chat-5-01, 03, 06, 07, 08, 12, 13 (drive workspace, drives, placements core).

Rules for all lanes: commit gap IDs; one lane per directory: if you need a change in a file another lane owns (shared shell is chat-9 only), put it in your final summary instead of editing. Gaps marked SKIP in a WP (security-sensitive owner decisions) stay untouched. For other owner decisions build the default recommendation.


## Gap-closure reassignments (2026-10-17, ten lanes)

To run ten chats, pages were moved off the heaviest queues. The old queue files (gap-closure-chat-5.md, gap-closure-chat-9.md) still list them; skip these pages, they now belong to the new lane:

- tpo/students and tpo/requests-verification: chat-5 -> chat-12 (queue: gap-closure-chat-12.md)
- superadmin/placements-projects-a-placements and superadmin/academics-people-1-academic-setup: chat-9 -> chat-13 (queue: gap-closure-chat-13.md)

If you already committed work on one of these pages, say so in your next summary and leave it in place; the new lane will verify it instead of redoing it.

## Reassigned 2026-10-17 20:30 (rebalance: chat-7/chat-9 had 150+ OPEN each; graceful lanes 14/15/16 finished)
- chat-14 now owns OPEN gaps on: recruiter/home-drives, recruiter/calendar-messages-profile (32 gaps). Previous owners skip these pages.
- chat-15 now owns OPEN gaps on: learner/learning-misc, learner/placements, learner/course-detail (41 gaps). Previous owners skip these pages.
- chat-16 now owns OPEN gaps on: mentor/projects-meetings-part2, superadmin/placements-projects-c-tracker (32 gaps). Previous owners skip these pages.
