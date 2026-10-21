# Super Admin Courses: legacy route crosswalk (lane chat-5, 2026-10-21)

This is a compatibility inventory, **not** an alias/redirect contract. Keep the vNext selected-college and UUID access model. A legacy client must not be pointed to a superficially similar route without matching response, permission and identifier rules.

| Legacy CourseController operation | vNext route | Compatibility / action |
| --- | --- | --- |
| POST `/api/v1/courses/create` | POST `/api/courses` | Different request/response DTO, validate selected college and membership; no raw redirect |
| GET `/api/v1/courses/fetch`, scoped paged fetch | GET `/api/courses` | vNext scope and pagination contract differ; migrate callers explicitly |
| GET `/api/v1/courses/fetchAll` global/org | No approved equivalent | vNext currently requires selected-college safety scope; add authorized platform catalogue before migrating |
| GET legacy numeric ID/slug course | GET `/api/courses/{courseId}` (UUID) | Not directly compatible, requires safe legacy ID mapping |
| PUT `/api/v1/courses/update` | PATCH `/api/courses/{courseId}` | Method/DTO/optimistic token differ; no blind redirect |
| DELETE `/api/v1/courses/delete` | DELETE `/api/courses/{courseId}` | Verify archive/delete semantics, permissions and UUID mapping before migration |
| GET `/api/v1/courses/deleted` | No verified equivalent | Do not fabricate archived list |
| POST `/api/v1/courses/restore` | No verified equivalent | Requires authorized restore workflow and audit |

Legacy callers are embedded in `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js` and `docs/legacy-source/frontend/src/pages/superadmin/courses.js`. Search for other `/api/v1/courses` consumers before production redirects. The platform progress policy uses the existing audited GLOBAL settings route `PATCH /api/admin/settings/overrides`, not a course mutation.
