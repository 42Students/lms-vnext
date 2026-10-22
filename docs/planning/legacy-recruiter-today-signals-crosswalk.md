# Recruiter Today legacy signal crosswalk

The old RecruiterTodayService combined jobs, changes, rounds, results,
offers, applicant shares and the TPO communication/audit feed. vNext projects
those **college-and-company-scoped** signals into
`buildRecruiterActionQueue` in
`src/modules/placements/hr-today-action-queue-model.ts`.
This is a mapping of existing normalized signals, not permission to query
records from another recruiter grant.

| Old signal and source column/status | vNext source/normalized status | Today action / index and migration check |
| --- | --- | --- |
| Job open, application deadline | Authorized `placement_jobs`, status `PUBLISHED`, not archived, `application_deadline` | Live drives and approaching deadline. `CLOSED` may support history, never a fresh application action. Verify company + college index and legacy numeric job→UUID import. |
| Change request `direction`, `kind`, unanswered | Drive change request with `ASK` or proposed change and authorized job ID | Group by drive; preserve freeform `ASK` as a question, not an accepted mutation. Preserve original direction and source request ID; index by job and status. |
| Job round, scheduled/result deadline | Round status `SCHEDULED` or `COMPLETED` with bounded due time | Only offer a **results due** action when the round is an assessment (not TALK) and results are still outstanding. Stable sort by deadline + round UUID. |
| Round interview slot gap | Same authorized job/round and concrete scheduled time | Create the interviewer time action only where recruiter scheduling is applicable; a NULL time cannot create a false deadline. |
| Issued/accepted/declined offer | Scoped offer status `RELEASED`/`ISSUED`, `ACCEPTED`, `DECLINED` and `respondBy` | Waiting on reply or follow-up; do not equate selection recorded with an issued offer. Preserve old status/date/actor as audit metadata. |
| Shared applicant selection | College-authorized selected-applicant share count by job | Show counts only from a valid company+college share; never expose unshared applicant identity. Verify share grant validity and job relationship in persistence layer. |
| TPO company/team messages or audit reminder | Scoped unread conversation receipts and job-linked activity/audit events | Open message thread. Count actual unread receipts, not arbitrary deadlines or aggregate total messages. Preserve old thread/source actor IDs as import provenance. |
| Returned drive request | Owned request status `SENT_BACK` | Fix-and-resend for the original recruiter/college, not for an unrelated company's request. |

All outputs must be filtered through the authorized job IDs constructed
from `input.collegeId`, `input.companyId` and non-archived jobs.
Unknown source types are **not** silently counted as ASK. A due timestamp
alone is **not** evidence of an outstanding result. The current Today model
enforces these gates and renders instants in Asia/Kolkata.

Migration sign-off requires row count reconciliation and active-index review
for each source (job, change request, rounds/results, offers, applicant
shares, message receipts and activities), including old integer→UUID mappings,
status transition history, timezone provenance, and tenant boundary tests.
This file does **not** claim that such an import has been executed.
