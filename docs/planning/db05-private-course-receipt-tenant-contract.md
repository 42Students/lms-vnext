# DB-008 / DB06: private course upload receipts need same-college persistence

**Status:** SOURCE-ONLY, UNREGISTERED companion. **Worker:** Chat 6, DATABASE DB-008.  
**Candidate:** `scripts/sql/db05-course-receipt-college-scope.draft.sql`. **No numbered Drizzle migration, API route or active DB table changed.**  
**Related staged authority:** `docs/planning/sql/db06-assignment-private-files-candidate.sql`, `src/db/schema/course-upload-receipts-staged.ts`, `src/modules/courses/assignment-file-service.ts`, `src/modules/storage/private-object-storage.ts`, `docs/planning/sql/db16-private-object-receipt-overlay-candidate.sql`.  
**Integrator:** Chat 1. Confirm DB06/DB16 owners before registering, and merge all mutually compatible guards exactly once.

## Exact source gaps

The staged `course_upload_receipts` table separately references college, owner membership, assignment or lesson content, and optional consumed assignment submission. A foreign key proves **existence**, not equality of their owning college/learner/course/delivery. The assignment-file API currently requires an authenticated learner and validates assignment access before creating upload grants, but privileged workers or future SQL writers could bypass those service checks. Preserving privacy requires a database guard too.

- `college_memberships.college_id` must equal `course_upload_receipts.college_id`.
- An assignment targets a lesson in a learning path in an offering with both `academic_periods.college_id` and the owning course department's `college_id`. Both must match the receipt's college.
- A course resource targets `lesson_contents` through the same path. A delivery-scoped lesson content/assignment must use a delivery of that exact offering and a section whose academic period belongs to the same college.
- A consumed assignment receipt must match the actual submission's assignment ID, learner membership, delivery offering, and any assignment-specific delivery.
- `private-object-storage.ts` builds object keys as `private/<college>/<membership>/<namespace>/<uuid>`. The source namespaces include `assignment-submission` and `course-resource`. The DB rejects cross-owner, cross-college, cross-namespace, extra path segments, path traversal and a non-UUID suffix; it **cannot** prove the object exists, belongs to a signed grant or has been malware-scanned.
- `upload_token_hash` is server-generated SHA-256 lowercase hex; legacy/current runtime business storage safety still requires scanner identity, object generation, digest, expiry and revocation checks.

## Staged guard coverage

| Check | Proposed SQL behavior | Proof |
| --- | --- | --- |
| Owner membership matches persisted college | Reject mismatch via `23514` | NOT RUN |
| Assignment or content's offering period and course department match college | Reject mismatch via `23514` | NOT RUN |
| Optional target delivery is same offering and college section | Reject mismatch via `23514` | NOT RUN |
| Submission receipt consumption remains bound to one owner, assignment and delivery | Reject mismatch via `23514` | NOT RUN |
| Object key has exact `private/<college>/<membership>/<namespace>/<uuid>` shape | Reject wrong prefix, extra segments, traversal and non-UUID suffix via `23514` | NOT RUN |
| Upload token hash has SHA-256 hex shape | Reject malformed field via `23514` | NOT RUN |

## Must remain blocked

1. **Upstream drift:** Updating a course's department, academic-period college, offering, section, lesson, content delivery, membership college, assignment delivery or submission can invalidate an *existing* receipt. An INSERT/UPDATE trigger on the receipt itself cannot prevent that. DB02/DB05/DB06/W01 must agree on upstream immutability or revalidation before migration registration.
2. **Permanent object identity:** DB16 has its own staged immutable receipt identity/retention proposal. This DB05 companion must not create a duplicate trigger or silently override DB16's obligations.
3. **File-to-submission linking:** The staged `assignment_submission_files` references receipt and submission separately. It still needs proof of matching object key, generation, digest, assignment, owner, and the `FILE` submission type at commit; this draft does not claim that linkage is complete.
4. **Lifecycle and race:** One receipt consumed exactly once; wrong-owner and cross-tenant replay, revoked/expired receipt, competing submissions, scanner-attestation substitution, signed-read permission and private asset deletion/retention policies require executed DB + integration tests.
5. **Course resource binding:** `COURSE_RESOURCE` targets lesson content but there is not yet a proven atomic link between consumed receipt and `lesson_content_materials.id`. Do not activate resource upload ahead of that contract.
6. **Authorization:** A learner in the same college does not necessarily have access to every offering/delivery; `requireLearningReadAccess` and role permissions are separately required. A same-college DB constraint does not grant access.
7. **Source certainty:** DB05 legacy `ContentDataDTO.fileDTO` and resourceMaterials are not automatically equivalent to vNext `course_upload_receipts` without producer/consumer comparisons.

## Disposable PostgreSQL acceptance cases

Build fixture colleges A/B, different departments, academic periods, offerings, lessons, content, deliveries, active memberships, assignments and submissions. Check authorized same-college course resource and assignment receipt, then try each crossed foreign-key dimension and wrong object key. Confirm SQLSTATE `23514` for deliberate scope breaks and real FK errors for missing IDs. Check malformed and mixed-case `upload_token_hash`, attempted receipt edits, consumed-by cross-assignment/learner/delivery, wrong namespace, and two-session concurrent consumption. Exercise upstream reparenting and verify no existing receipt changes tenant. Run clean journal replay and UI/API read grants after integrating DB06/DB16 overlays.

**Current outcome:** contract and SQL draft authored; actual Node, PostgreSQL, CI, typecheck and browser acceptance **NOT RUN**. DB-008 remains `IN_PROGRESS`.
