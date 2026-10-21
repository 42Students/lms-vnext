# Lane 6 — TPO students / academic import ID and action crosswalk

This is a transport and identity crosswalk, not a data migration. Legacy numeric IDs are **not** vNext UUIDs. Import only when a verified college-specific mapping is available.

| Legacy action | Legacy input / output | vNext action | vNext input / output |
|---|---|---|---|
| POST /api/v1/tpo/students/academic-import/preview | `{rows:[{...}]}` with legacy numeric student identity; historical response from Students service | POST /api/placements/tpo/students/academic-import, `action:"PREVIEW"` | `{action:"PREVIEW", rows:[{studentCode:<membership UUID>,cgpa,activeBacklogs}],skipUnmatched?:boolean}` => `{preview:{rows:[...match,oldCgpa,oldBacklogs]},identifierType:"COLLEGE_LEARNER_MEMBERSHIP_UUID"}` |
| POST /api/v1/tpo/students/academic-import | `{rows:[{...}]}` => `{updated:number}` | Same vNext endpoint, `action:"IMPORT"` | Same typed rows => `{result:{updated,skipped,unmatched,newlyIneligible},identifierType:"COLLEGE_LEARNER_MEMBERSHIP_UUID"}` |
| GET /api/v1/tpo/students/{learnerId}/detail | Path integer learner ID => college-scoped student detail | TPO student detail / related UUID-based services | Verify college and active learner role; identify learner by `collegeMemberships.id`, not `users.id` |
| POST /api/v1/tpo/students/bulk/* | `learnerIds:Integer[]`, sometimes `jobId`, `courseId`, `assessmentId` (integers) | Separate vNext student/drive/preparation services | Explicit per-command schemas and UUID references. Never submit historical integer IDs or replay a legacy POST payload verbatim |

## Referential integrity policy

1. Resolve `(legacy_college_id, legacy_learner_id)` to one active `college_memberships.id` and its `users.id`, verifying the same persisted college and LEARNER role. Reject missing, ambiguous, disabled, or cross-college matches. A legacy learner integer must never be coerced or padded into a UUID.
2. Map `(legacy_college_id, legacy_job_id)` to `placement_jobs.id`; separately map legacy `courseId` to a college-owned course and `assessmentId` to an assessment owned by that course. The academic-import route has no job/course/assessment fields: refuse them rather than silently dropping them.
3. Academic import accepts only exact fields `studentCode`, `cgpa` (0–10), `activeBacklogs` (integer 0–100), 1–200 rows, and optional `skipUnmatched`. `studentCode` is the membership UUID despite its legacy-compatible name. Do not infer `studentCode` from a roll number, name or email; source-side aliases are not identities.
4. Use PREVIEW before IMPORT and reconcile every CANT_MATCH. The import has persisted TPO actor/college checks, locks active same-college learner membership rows, records verified academic evidence/audit, and flags newly ineligible existing applications instead of silently deleting them.
5. Preserve the vNext model of one workspace per role, membership-based tenant scope and strictly typed application/eligibility histories. No global legacy data migration is required for the empty vNext launch; this document specifies the safe contract if historical data is explicitly imported in future.

Do not assume any legacy integer-to-UUID crosswalk exists. A migration job must create and audit it first; no fallback to ambiguous matching or broad table queries.
