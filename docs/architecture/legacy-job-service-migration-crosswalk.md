# Legacy JobService → vNext placements migration crosswalk

Legacy source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java`.
This is a route/service migration contract, not an additional public API or a promise of backward-compatible integer IDs. The vNext college × role workspace, active membership, scoped permissions, secure receipts and approval model remain authoritative.

| Legacy Java method | vNext equivalent or status | Behaviour / security boundary |
|---|---|---|
| `getAllActiveJobsForLearnerOrganization` | Learner placements list (learner-scoped jobs read in `src/modules/placements/`) | Tenant + active membership, published/active and deadline filters; no unscoped organization leak. |
| `getAllActiveJobs` (deprecated) | **No unscoped equivalent** | Legacy unsafe all-organization read intentionally refused. |
| `getJobById` | `GET /api/placements/jobs/[jobId]`, `job-service.ts` | UUID, scoped college visibility and permission; no numeric ID lookup. |
| `getVisibleJobsForLearner` | Learner jobs browse / eligibility and targeting reads | College, published state, target cohort/program/section and deadline; vNext participation/eligibility policies can further govern apply. |
| `checkJobVisibility` | Learner job access/eligibility service | Return explicit scoped gate status, not global job existence. |
| `applyToJob` | Placement application POST; `application-service.ts` | Learner session identifies membership; active job, target, deadline, repeat-apply and college policies verified transactionally. |
| `getLearnerApplications` | Learner applications list, `application-service.ts` | Own active membership only, including current application state. |
| `getLearnerApplicationsWithInterviews` | Learner applications plus placement interview/calendar reads | Upcoming interview is a scoped joining projection, not raw cross-tenant data. |
| `getApplicationById` | Learner application detail, `learner-application-detail-service.ts` | Requires owner membership; employer reference is immutable `publicRef`. |
| `hasApplied` | Own application list / application service existence guard | Database uniqueness and withdrawals govern repeat applications. |
| `getApplicationByLearnerAndJob` | Scoped own application lookup | Learner UUID + job UUID; never caller-chosen user ID. |
| `withdrawApplication` | Explicit application withdrawal service | Legacy implicit learner × job selection is resolved by owned application; no cross-user mutation. |
| `withdrawApplicationById` | Own application withdraw route / `application-service.ts` | Pessimistic lock, lifecycle rules, audit and dependent interview state. |
| `respondToOffer` | Own offer response service / offer route | Separate offer and joining statuses with conditional cascade; not an application status overwrite. |
| `previewOfferAccept` | Read-only offer accept cascade preview | Categorize withdrawn, stays-open and declined offers using the same college policy used on commit. |
| `getEligibleJobsForLearner` (deprecated) | Learner visible jobs | Legacy method was a visibility alias, **not** a CGPA/degree skill eligibility check. |
| `getImportantDateEventsForAdmin` | Admin/college placement calendar service | Organization or explicitly acting-college scope, inclusive legacy dates projected to explicit IST. |
| `getImportantDateEventsForLearner` | Learner placement calendar service | Visible + already-applied union, college-scoped. |
| `getCalendarJobIdsForLearner` | Learner calendar allowed-job-set projection | Reuse visible/applied union before enriching round dates, rather than unscoped ID lists. |
| `checkLearnerEligibility` (deprecated) | Current placement eligibility/participation policy | The legacy method was visibility-only; current vNext validation is explicit and not inferred from an old boolean. |

## Step hierarchy and labels

Legacy: **Target → Apply → Screen → Decide**. Targeting controls a learner's visibility and job reachability. Applying creates a persisted application. Screening is an independent post-apply evaluation, never a claim that the learner was hired. Human decisions, offers and joining outcomes are separate authorized records. The vNext restrictions on college placement participation, deadlines, hold limits and secured identity are intentional differences; do not bypass them for legacy compatibility.

| Legacy status/action | vNext persisted state / UI label |
|---|---|
| Apply / `APPLIED` | `placementApplications.status=SUBMITTED`, show **Applied** to learners |
| Withdraw | `WITHDRAWN`, show **Withdrawn**; status history records the transition |
| `OFFERED` | Separate `placementOffers` row: show **Offered** when a valid offer exists |
| `HIRED` | Offer acceptance / verified joining outcome: show **Hired** only when the business outcome warrants it |
| `REJECTED` | Rejected/declined outcome recorded separately: show **Rejected** where appropriate |
| Application screening | Screening evaluation; do not show it as a committed offer or job decision |
| Legacy `INTERNAL` source | The internal learner-application channel; recruiter/imported external channels remain distinct |

### Resume and identifiers

The legacy optional `resumeUrl` used a learner-profile fallback. New records must use the authorized learner's current private resume/file receipt or secure signed read flow. Do **not** trust a raw learner-supplied URL, persist bearer tokens in a job, or disclose private storage keys. Where no accepted resume is available, preserve the explicit missing-file state instead of inventing a profile fallback. Legacy integer job/application/student IDs map to distinct vNext UUIDs; employers see `publicRef`, not internal routing UUIDs. Audit/application channel and first-applied timestamps are authoritative for migrated history.

### Route boundary

`src/modules/placements/job-service.ts` exposes `legacyPlacementJobRouteMap` for CRUD/publish/close/archive/applications. The legacy monolithic interface has no all-permission successor; placements' `application-service.ts`, `screening-service.ts`, offer services and calendar readers each enforce their own role, tenant and origin constraints. A legacy UI deep link must resolve through its appropriate role workspace, not an endpoint that skips scoped authorization.
