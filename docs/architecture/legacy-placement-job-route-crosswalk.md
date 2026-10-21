# Legacy learner job HTTP contract crosswalk

The legacy Spring job controller and the vNext member-scoped placement feed do **not** share a wire contract. Never reintroduce the legacy learnerId path parameter as an authority to apply on someone else's behalf. The vNext authenticated **membership** is the only learner identity trusted by reads and writes.

| Legacy caller | vNext equivalent and intentional difference |
| --- | --- |
| `GET /api/v1/jobs/all` (job id/title, companyName, jobDescription, jobType, location, candidatePreferences) | `GET /api/placements/jobs/me?legacy=1` returns `{status:"OK",message:"Visible jobs retrieved successfully",data:[...]}` via `summarizeLegacyLearnerJobs`. Normal `/jobs/me` still returns `{jobs}`. |
| `isVisible` and `visibilityReason` on job list | The filtered modern feed contains **visible, published, active-college and learner-targeted jobs only**, so legacy projection sets `isVisible: true`, `visibilityReason: null`. Hidden jobs are not exposed. `canApply` is separately calculated per role option from consent, evidence, participation, held offers and deadline; do **not** infer it from visibility. |
| `GET /applied` job-level `applied`, `applicationId`, `applicationStatus` | Projection returns job-level `applied` plus the first role application for single-field compatibility; `applications[]` lists every applied role option to avoid hiding multi-role submissions. VNext application remains per role option. |
| `POST /{jobId}/apply/{learnerId}`, 200 success | `POST /api/placements/jobs/[jobId]/applications`, with authorized current learner and explicit role option; successful creation returns 201. Old learnerId must **not** be accepted as an impersonation target. |
| Offer `{accept:boolean}` | `legacyOfferResponseAction(true)` maps to `ACCEPT`, false to `DECLINE`, but normal offer route accepts typed actions and performs the current state/owner checks. Legacy `WITHDRAW` has no boolean representation. |
| `GET /saved` and `GET /savedIds` | `GET /api/placements/learner/saved-jobs` returns `{jobs,status,message,data}`; `?ids=1` returns `{ids,data,status,message}`. Exact response strings: “Saved jobs retrieved”, “No saved jobs”. |
| Legacy feed statuses | Projection uses “Visible jobs retrieved successfully”. The normal vNext `{jobs}` envelope is intentionally unchanged. Legacy alternatives include “Active jobs retrieved successfully” and “Jobs retrieved successfully”; only label them on the corresponding filtered page. |

The compatibility read projection never changes placement eligibility, target filters, deadlines, stored applications, candidate preferences, offer transitions or tenant grants. All responses are `private, no-store`.
