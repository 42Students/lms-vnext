# DB-012 / Chat 3 — CRM compile repair and cross-tenant FK review

**2026-10-11 IST · global phase DATABASE.** Source review against `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` and staged `lms-vnext/main`. These findings are source-level, **not a live PostgreSQL exploit demonstration or verified schema migration**.

## Source-level regression repaired

- `src/db/schema/tpo-crm.ts` contained 7 exported `pgTable` declarations for 3 intended tables, including repeated `placementTpoLeadActivities` and `placementTpoFollowups`, and broken `sql` check templates. A malformed source declaration is a build blocker even when the migration is not registered.
- Commit [`62c5f1c`](https://github.com/42Students/lms-vnext/commit/62c5f1ccc545200dd1b60c66e8250d1ce033a671) replaced the corrupt body with one `placementTpoLeads`, one `placementTpoLeadActivities`, and one `placementTpoFollowups`; complete phone and token hash CHECK definitions are restored. This was a **source change committed to main**.
- Added [`scripts/verify-db09-crm-source.mjs`](../../scripts/verify-db09-crm-source.mjs) to reject duplicate exports, missing composite references or truncated checks. Only independent read-only source-string checks were executed through the connected repository view. The committed Node script, TypeScript compiler, CI, and PostgreSQL have not been executed by Chat 3. GitHub commit statuses and PR-triggered workflow-run lookup returned no reported runs/statuses for the cited commits; that is **not** evidence of CI success.

## Full DB09 frozen candidate inventory

The existing field crosswalk now carries preliminary evidence for **279/279** source field candidates across **31** tables. Fourteen legacy V162 policy/visibility fields were compared earlier; the remaining 265 were classified against declared vNext targets by source/name candidates in a concurrently committed ledger update. The current source summary reports **139 same-name candidate matches, 45 explicit rename candidates, and 81 with no declared target identified** for this 265-field pass. None is a signed-off semantic mapping or executed SQL witness. Do not relabel `UNVERIFIED_FIELD_SEMANTICS` or count 279 as implementation-complete.

## Highest-risk SQL-only tenant integrity gaps

| Staged child table | Fields that must agree | Current source declaration | Candidate constraint |
|---|---|---|---|
| `placement_tpo_leads` | `college_id` with `company_relationship_id` and `owner_membership_id` | Separate global UUID FKs allow mismatched parent colleges at SQL level | Composite `(college_id, parent_id)` references for both optional owners |
| `placement_tpo_followups` | `college_id`, `owner_membership_id` | Followup→lead is scoped, owner membership FK is not | Composite college/member FK |
| `placement_tpo_message_threads` | `college_id`, optional `job_id` | Job ID independent of college; General thread must still support NULL job | Composite job/college FK |
| `placement_tpo_share_links` | `college_id`, `job_id` | Job ID independent of college; a forged source row could attach wrong-college job | Composite job/college FK |
| `placement_tpo_student_notes` | `college_id`, `learner_membership_id` | Note could reference another college's valid membership via SQL | Composite membership/college FK |
| `placement_tpo_team_members` | `college_id`, `membership_id`, `department_id` | Independent FKs permit foreign member or department association | Composite references for membership and optional department |
| `placement_recruiter_applicant_notes` | `college_id`, `job_id`, `application_id` | Separate FKs don't prove target applicant is on note's job or college | `(college_id,job_id)` to job and `(job_id,application_id)` to application |
| `placement_drive_day_coordinator_assignments` | `college_id`, `job_id`, `learner_membership_id` | Independent valid IDs may be from incompatible colleges | Composite job and membership refs |

**Scope of assertion:** The source models permit these mismatched keys because a single-column PK FK proves existence, not tenant equality. Existing application checks may reject normal API requests; we did **not** demonstrate a reachable unauthorized API flow. These are database contract hardening gaps pending migration integration.

### Staged SQL for Chat 1

- [`db09-crm-scoped-fk-candidate.sql`](sql/db09-crm-scoped-fk-candidate.sql): additional parent unique keys and lead/company/owner/followup composite references.
- [`db09-collaboration-scoped-fk-candidate.sql`](sql/db09-collaboration-scoped-fk-candidate.sql): job, membership, department, application and linked collaboration composite references.
- Both are **unregistered candidates**. Chat 1 owns numbered Drizzle migrations and schema barrel. Reconcile duplicate parent UNIQUE constraints, check latest other workers' FK changes, then generate proper Drizzle definitions/migrations and execute disposable PostgreSQL replay. No `drizzle/**` or `src/db/schema/index.ts` changed in this batch.

### Adversarial acceptance

1. Insert tenant A lead with valid tenant B company relationship and owner membership IDs; each must fail. Same-tenant and nullable optional links must succeed.
2. Attempt tenant A share/thread referencing tenant B job; must fail. General thread with NULL job remains valid.
3. Attempt tenant A applicant note referencing tenant A job but tenant B's application, and tenant A note on tenant B job; both fail.
4. Attempt tenant A team member with tenant B department/member, learner note for B member, and drive-day assignment using foreign college student/job; all fail.
5. Verify archived parent, suspended user, revoked recruiter grants, private recruiter note readership and share-token revocation via service+DB acceptance; the proposed composite FK alone does not solve these.
6. Confirm atomic update/rollback after owner college changes, insert conflicts, and cross-tenant joins under concurrent transactions.
7. Execute schema compile, migration generation/replay, typecheck and negative tests; attach actual logs, commit SHAs and database version. **Never convert authored tests or source checks into DB_TESTED**.

## Handoff status

`DB-012`: IN_PROGRESS; 279/279 *source candidate annotations*, zero database verified. `DB-007`: BLOCKED pending registration/PG/legacy-use disposition. Global phase remains DATABASE; API/UI/RELEASE still LOCKED.
