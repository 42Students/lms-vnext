# Same-college horizontal probe on dev, 2026-11-08 (SEC-08, SEC-14-003/009/010)

Manual evidence, dev only. Attacker: the NSRIT QA learner (college `nsrit42`), workspace LEARNER. Targets: four other NSRIT members (ids read by a system-scope job; all learners). Every GET route whose only path parameters are `membershipId`, `userId` or `collegeId` (36 routes) was requested for each target (144 requests), plus the same routes for the learner's own membership id. Script: `scripts/verify/horizontal-learner-probe.mjs` (needs `scratch/nsrit-members.json`).

| Status | Count |
|---|---|
| 403 | 108 |
| 400 | 28 |
| 404 | 4 |
| 200 | 4 (all `GET /api/colleges/[collegeId]/branding` for the learner's own college: sign-in branding, public by design) |

No route returned another person's data to the learner. The learner's own membership id was also refused on all of these routes (they are staff routes), so none of them is a self-service read.

Not covered: mutating methods, other learner-owned resources (submissions, attempts, notifications) because the dev data has none for these pairs, and mentor or faculty as the attacker against learners outside their assignments (SEC-14-009/010 need seeded assignments). Quizzes outside the learner's courses answered `LEARNING_ACCESS_DENIED` (3 of 3 probed).
