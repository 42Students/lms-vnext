# DB05 — Faculty teaching-assignment ending race

**Chat 6 · DATABASE · Source fix on main · Node/API/PG runtime acceptance NOT RUN**

Previously `endCourseTeachingAssignment` authorized `courses.manage` against the initial delivery's college, then updated a teaching assignment by ID alone. A concurrent reassignment of the teacher or delivery/course ownership could reuse the stale grant.

The new `src/modules/courses/teaching-assignment-service.ts` write transaction takes assignment row `FOR UPDATE` and requires original delivery ID, faculty membership ID, and `ended_at IS NULL`. It SHARE-locks the delivery → offering → course → department → college → organization chain; the original college/organization must still match. The final assignment UPDATE again includes original delivery and membership IDs. Existing role policy and error type are unchanged.

**Eight independent PostgreSQL/API acceptance cases (NOT RUN):** FA-01 authorized end once and repeated end rejection; FA-02 reassigned delivery or member after auth rejects; FA-03 cross-college course department movement rejects; FA-04 organization reparent rejects; FA-05 concurrent scope move vs end cannot end another college's assignment; FA-06 suspended/unprivileged requester denied; FA-07 READ COMMITTED two-session lock order with delivery end and DB02 academic guards; FA-08 any error rolls back without partial end.

Static regression definitions: `tests/db05-faculty-assignment-end-race.test.mjs` (4 authored); no native `node --test`, TypeScript, PG or end-to-end pass is claimed.
