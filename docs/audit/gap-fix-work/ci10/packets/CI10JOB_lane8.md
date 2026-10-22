# ci10 CI-job packet lane 8: db09-staged-acceptance

CI job db09-staged-acceptance: TPO lead tests fail with AuthorizationError Missing permission: placements.manage. The test actor needs the right TPO role/permission fixture, or the service checks the wrong permission. Fix the real cause.

Run (CI does it): see .github/workflows/ci.yml job db09-staged-acceptance. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```
 ❯ tests/integration/db09-tpo-crm.test.ts (23 tests | 12 failed) 1426ms
   ❯ DB09 recruiter CRM isolated PostgreSQL integrity (23)
     ✓ preserves immutable lead history against direct TRUNCATE 25ms
     × atomically creates an audited lead and records idempotent Not Now changes 95ms
     ✓ rolls back lead creation when the persisted audit actor is unauthorized 28ms
     × denies a foreign-college and nonstaff Not Now update without audit rows 34ms
     × creates tenant-scoped lead, lists it, and transitions NEW to CONTACTED on real activity 24ms
     × never returns a hashed invite token in TPO lead APIs 30ms
     ✓ deduplicates competing lead creation by normalized email 26ms
     ✓ rejects malformed invite hashes and forged activity actors at the database boundary 69ms
     ✓ tracks follow-up due, move and completion; refuses moving done follow-ups 70ms
     ✓ denies learner access and forged college on service layer 16ms
     × rejects cross-college event, follow-up owner, and event-history rewrite via SQL 44ms
     × can check a recruiter duplicate without disclosing a raw invite hash 41ms
     × edits recruiter contact atomically while preserving omitted details and lifecycle 34ms
     × makes a racing duplicate edit lose without corrupting either contact 45ms
     ✓ denies unauthorized lead lookup, detail and edits even by known IDs 35ms
     ✓ records only one auditable manual Contacted transition and clears Not Now metadata 44ms
     ✓ limits recruiter activity to newest 200 and prioritizes unfinished follow-ups 622ms
     × rotates recruiter invite tokens, previews without consuming, and hides old links 22ms
     ✓ denies cross-role or cross-college invite issuance 20ms
     × spends a public invite exactly once when Not Hiring races 25ms
     × unsubscribes once, invalidates the capability token and blocks reissue 20ms
     × groups legal-suffix aliases into one tenant-scoped Company Memory view 22ms
     ✓ keeps Company Memory tenant-scoped and returns not-found without cross-college leakage 20ms
 ✓ tests/integration/db09-tpo-policy.test.ts (5 tests) 64ms

⎯⎯⎯⎯⎯⎯ Failed Tests 12 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/db09-tpo-crm.test.ts > DB09 recruiter CRM isolated PostgreSQL integrity > atomically creates an audited lead and records idempotent Not Now changes
AuthorizationError: Missing permission: placements.manage
 ❯ requireTpoBatchActor src/modules/placements/tpo-batch-workspace-read-service.ts:29:22
     27|   .where(and(eq(collegeMemberships.id,m.id),eq(collegeMemberships.coll…
```
