# DB-069 — mutable TPO drive ownership and team removal lifecycle

**Worker:** Chat 3  
**Phase:** DATABASE  
**Date:** 2026-10-12  
**Status:** source/staging contract; not registered or PostgreSQL-verified  
**Frozen legacy backend:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Finding

vNext currently persists immutable job creator provenance as
`placement_jobs.created_by_user_id`, but the frozen production source has a
second, actively mutable concept: `job.owner_faculty_id`.

Those two fields are not interchangeable.

The owner is operational responsibility: it changes when a recruiter request is
approved or when a placement-team member is removed and their work is handed to
someone else. Creator identity is historical provenance and must not be rewritten
during reassignment.

## Frozen source evidence

### Job model

`src/main/java/com/_42students/lms/model/Job.java`

The persisted `owner_faculty_id` is explicitly documented as the drive owner:
a TPO administrator or delegated faculty coordinator.

### Drive creation / approval

`src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java`

- a TPO-created draft sets both creator and owner to the acting faculty;
- approving a recruiter request changes the mutable owner to the approving TPO;
- creator provenance is not used as a replacement for that owner.

### Drive copying

`src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java`

A copied drive is owned by the faculty member performing the copy.

### Placement-team removal

`src/main/java/com/_42students/lms/service/tpo/TpoTeamService.java`

The source removal flow is explicit:

1. calculate impact from recruiter leads owned by the member plus open
   `DRAFT | PUBLISHED | REQUEST` drives owned by them;
2. without a replacement, refuse removal while that ownership remains;
3. with a replacement, validate the replacement belongs to the placement team
   (or is the college TPO/admin);
4. reassign `recruiter_lead.owner_faculty_id`;
5. reassign `job.owner_faculty_id`;
6. only then delete the team-member row.

When a replacement is supplied, the source updates **all** owned jobs, not only
open ones. Closed/history rows therefore move too.

### Recruiter lead ownership

`src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java`

Lead tables expose owner identity and allow owner changes. DB09 already carries
the normalized equivalent as `placement_tpo_leads.owner_membership_id`.

## Current vNext gap

`src/db/schema/placements.ts :: placementJobs` has
`createdByUserId` but no mutable owner field.

The DB08 frozen inventory still contains active
`job.owner_faculty_id`, and its prior field ledger did not establish a
canonical mapping. Treating `created_by_user_id` as the owner would break:

- approval-time ownership transfer;
- delegated coordinator responsibility;
- team-member removal impact;
- reassignment without corrupting provenance.

## Staged normalization

Canonical candidate:

`docs/planning/sql/db09-team-owner-lifecycle-candidate.sql`

### placement_jobs.owner_membership_id

Add nullable `owner_membership_id` as a college-membership identity.

It remains nullable at the column level for historical CLOSED/ARCHIVED rows.
Legacy recruiter requests could be ownerless until approval, while current vNext
does not persist a `REQUEST` status on `placement_jobs`. A staged CHECK
therefore requires a non-null owner specifically for current live
`DRAFT | PUBLISHED` jobs after conservative backfill; DATABASE phase does not
invent a new request lifecycle.

Every non-null owner must:

- belong to the job college;
- have ACTIVE membership;
- have ACTIVE platform user;
- belong to an ACTIVE college;
- be either a persisted `TPO | COLLEGE_ADMIN` membership, or a current
  `placement_tpo_team_members` row with
  `TPO_ADMIN | FACULTY_COORDINATOR`.

This operation-specific helper is deliberately broader than
`db09_has_active_tpo_actor`. A faculty coordinator may own assigned drives,
but must **not** gain unrestricted college-wide placement administration.

### Direct team deletion

A direct delete **or direct identity change** of
`placement_tpo_team_members.(college_id,membership_id)` is rejected when the
old member identity still owns:

- any recruiter lead in that college; or
- any live vNext `DRAFT | PUBLISHED` job in that college.

Current vNext has no `REQUEST` job status. The source's REQUEST case belongs to
the recruiter-request flow and must be represented explicitly by its eventual
API/database design rather than faked as another job status.

Closed/archived drive ownership is historical and does not by itself block a
no-replacement removal, matching the source impact check.

### Atomic reassignment/removal

`db069_reassign_and_remove_tpo_team_member(...)` stages the source transaction:

- lock source/target owner identities;
- lock the source team row;
- reject self-removal;
- require a college-wide TPO actor for the removal operation;
- validate replacement owner scope;
- reassign all owned recruiter leads;
- reassign all owned jobs, including closed/history rows;
- delete the team row only after ownership has moved.

When no replacement is supplied, it refuses removal while owned leads/live jobs
remain.

### Race safety

The candidate uses a transaction-scoped advisory lock derived from the full
`college_id + membership_id` owner identity.

The same lock is acquired by:

- placement-job owner assignment;
- recruiter-lead owner assignment/change (serialized and validated against the
  active placement-owner scope);
- team-member deletion/reassignment.

This closes the stale-check race:

1. removal sees “owns nothing”;
2. concurrent transaction assigns a new drive/lead;
3. removal deletes team row;
4. newly assigned work is orphaned.

Whichever transaction obtains the owner lock first determines the valid final
state; both cannot commit an orphaning interleaving.

## Important non-goals

- Do not rewrite `created_by_user_id` on ownership transfer.
- Do not grant FACULTY_COORDINATOR the college-wide
  `db09_has_active_tpo_actor` authority.
- Do not turn every historical closed-drive owner into an active team member.
- Recruiter-lead owner eligibility is intentionally tightened in vNext:
  the legacy bulk action accepted any same-college faculty, which allowed a
  removed coordinator to regain ownership after removal. DB-069 requires the
  same active placement-owner scope used by drive ownership. This is a
  deliberate hardening, not a claim that the legacy check was already strict.
- Do not register the candidate directly. Chat 1 owns Drizzle/migration order.

## API/runtime cutover requirements

Before migration activation:

1. add `ownerMembershipId` to canonical Drizzle `placementJobs`, including
   the live-owner CHECK;
2. TPO-created/copied jobs set owner to the acting college membership;
3. recruiter-request approval sets owner to the approving TPO membership;
4. job reads that display responsibility use owner, not creator;
5. team removal calls one atomic reassign/remove transaction;
6. creator remains immutable provenance;
7. any existing greenfield rows are backfilled only when a same-college owner
   can be resolved without ambiguity.

## Current-main integration drift (31 October 2026)

The current typed `placementJobs` schema **already includes**
`ownerMembershipId` and registered composite same-college
`placement_jobs_owner_college_fk`. Earlier source checks incorrectly asserted
the column was absent; those checks have been corrected to require the actual
existing column *and* composite FK.

**Do not apply this isolated SQL candidate verbatim.** Its `ADD COLUMN
owner_membership_id` and `db069_job_owner_college_fk` design were written
before these definitions landed. A future numbered promotion must reconcile
and omit duplicate DDL, then implement the *remaining* live-owner, team-removal
and race guards with successful registered PostgreSQL evidence. The candidate
and static tests are source/staging artifacts, not runtime completion.

## PostgreSQL acceptance witnesses

At minimum execute:

1. every live `DRAFT | PUBLISHED` job has a non-null owner after backfill;
2. same-college ACTIVE TPO owner succeeds;
3. same-college delegated FACULTY_COORDINATOR owner succeeds;
4. ordinary faculty outside the placement team is rejected as drive owner;
5. learner membership is rejected;
6. inactive membership/user/college is rejected;
7. cross-college owner is rejected;
8. lead owner outside the active placement team/TPO scope is rejected;
9. direct team delete or identity mutation with owned lead is rejected;
10. direct team delete or identity mutation with DRAFT/PUBLISHED drive is rejected;
11. closed-only historical drive does not block no-replacement removal;
12. atomic reassignment moves both leads and all jobs before deletion;
13. invalid/cross-college replacement owner is rejected;
14. self-removal is rejected;
15. concurrent team-delete vs drive-owner assignment cannot orphan ownership;
16. concurrent team-delete vs lead-owner assignment cannot orphan ownership;
17. a closed drive whose former owner left cannot be republished until a valid
    owner is restored;
18. creator identity remains unchanged after ownership reassignment;
19. registered migration replay and schema drift match the final Drizzle model.

## Evidence boundary

This task can be source/staging **COMPLETED** after the static/source contract
and executable witness suite are authored and independently inspected.

It is not `DONE_VERIFIED` until Chat 1 registers the final schema and the
disposable PostgreSQL/runtime witnesses execute successfully.
