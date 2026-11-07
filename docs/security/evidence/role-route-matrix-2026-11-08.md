# Role by route matrix on dev, 2026-11-08 (SEC-03, SEC-08, SEC-04)

Manual evidence, dev only, not CI. Each seeded TESTA role (learner, faculty, mentor, TPO, college admin) signed in through the real login API, selected its workspace role, then requested every static GET API route that reads data (296 routes in the first pass; a 111-route admin-flavoured subset in the second): routes without path parameters, excluding auth, public, internal, SSE and OAuth-callback routes. Status 200 means the role can read the route.

| Role | 200 | 403 | 400 / 409 / 410 | 500 | 503 |
|---|---|---|---|---|---|
| Learner (296 routes) | 24 | 185 | 67 | 5 | 14 |
| Faculty (296) | 15 | 196 | 68 | 2 | 14 |
| College admin (296) | 72 | 127 | 77 | 6 | 14 |
| Mentor (111) | 5 | 73 | 31 | 0 | 2 |
| TPO (111) | 10 | 63 | 35 | 1 | 2 |

Readable by learner (24): own courses, quiz attempts, groups, notifications, drive-day, requests, profile, verification, projects, features, client settings, department and college lookups, plus **`/api/v1/admin/college-dashboard`**. Readable by faculty (15): faculty reports, faculty self document, staff contacts, projects, lookups, plus the same dashboard. Mentor: mentor exports and notification count, lookups and the dashboard. TPO: placements and TPO tools, staff contacts, lookups and the dashboard. College admin: the admin surface (32 of the 111-route subset).

**Finding (vertical privilege): the staff college dashboard `/api/v1/admin/college-dashboard` answered every role**, including learners, because it only required `academics.read`, which every college member holds. It returns attendance-pending, grading-backlog and unstaffed-delivery lists for the college. Fixed 2026-11-08: the route now requires a College Admin or Faculty role (403 otherwise). No other admin-looking route was readable by a lower role in this pass.

**Finding (robustness): role refusals that older services throw as plain errors (`FACULTY_ROLE_REQUIRED`, `TPO_ROLE_REQUIRED`, `PENDING_RECRUITER_ACCESS_DENIED`) answered 500 and logged an unhandled error.** They now map to 403 centrally in `apiErrorResponse`. The other 500s are the same family (wrong-role access to `/api/people/faculty-self-document*`, `/api/placements/tpo/profile/avatar`, `/api/placements/recruiter/pending-invites`) and one `/api/placements/tpo/companies` call by a college admin; recheck after the redeploy. The 503s are features not configured on dev (announcements, tracker, skills, learner gallery).

Observation: a person whose membership holds two roles (the seeded mentor and TPO also hold FACULTY) answers 401 on every API route until a role is chosen through `POST /api/auth/memberships`, although login reports `selectedMembership: true`. This is the one-role-per-request rule working; the login response wording is misleading for API clients.

Not covered: mutating methods, routes with path parameters (see `cross-college-api-probe-2026-11-08.md`), recruiter and Super Admin as callers, and routes that need a request body or query to return data.
