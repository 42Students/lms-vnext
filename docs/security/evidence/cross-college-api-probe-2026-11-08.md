# Cross-college API probe on dev, 2026-11-08 (SEC-05-005/006/008, SEC-08)

Manual evidence, dev only, not CI. Attacker: the seeded College Admin of TESTA (college `07f7e82e`), signed in through the real login API, workspace COLLEGE_ADMIN, with the lock enforced (RLS on, scope on, shared store on). Victim data: ids of objects that exist in the database but are NOT visible to TESTA (read by a system-scope job, mostly NSRIT's 154 members and drives): projects, placement jobs/rounds/applications/offers, memberships, users, colleges, courses, offerings, lessons, quizzes, assignments, batches, sections, programs, departments, notices, tasks, sprints, contents.

Method: for every GET route under `src/app/api` that has dynamic segments and whose parameters map to one of those tables (157 of 217), substitute the foreign id and request it as TESTA admin. 120 distinct routes ran (the request list was trimmed to routes that read data; mutating methods were not probed on purpose).

| Result | Count |
|---|---|
| 403 forbidden | 37 |
| 404 not found | 59 |
| 400 / 409 (rejected input or state) | 14 |
| 200 | 1 (`/api/placements/tpo/students/[membershipId]/debarments` answered `{"rows":[]}`: empty, no foreign data) |
| 500 (server error) | 4 |
| 503 (feature not configured) | 3 |

No response carried data from another college. The four 500s were "not found" cases thrown as plain errors (`Application not found in this college drive`, `Learner not found in this college`, `Placement drive not found`, `TpoPublicJoinLinkError: Not found`): a correct refusal with the wrong status and an unhandled-error log line each. Fixed the same day: they now raise typed placements errors (and `TpoPublicJoinLinkError NOT_FOUND` maps to 404 centrally), so they answer 404. The three 503s (`/api/courses/[courseId]/display`, `lesson-contents/[contentId]/discussions`, `tpo/jobs/[jobId]/diversity-outreach`) are feature-readiness responses, not isolation findings.

Not covered: mutating methods, the 60 routes whose parameters are not mapped (tokens, public ids, files), routes without a dynamic segment that take ids in the body or query, and other roles (learner, faculty, TPO as attacker). Repeat as a scripted check in CI once a seeded two-college database is part of the pipeline.

**Re-checked after the redeploy (dev image 8efb7c1b):** the four former 500s (`/api/placements/college/jobs/[jobId]/applications/[applicationId]`, `.../interviews`, `/api/placements/college/learners/[membershipId]/summary`, `/api/placements/tpo/drives/[jobId]/public-link`), called by the TESTA college admin with NSRIT ids, now answer 404.
