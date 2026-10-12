# DB05 — Archived learning hierarchy reads

**Chat 6 · DATABASE · Committed source change · Node/API/PG verification NOT RUN**

Three admin listing services `listLearningPaths`, `listCourseLessons` and `listLessonContents` accept an `includeArchived` flag. Their original `requireLearningReadAccess` calls used the default `includeHistorical=false` even after loading an archived parent, denying legitimate administrative history reads.

Each call now explicitly passes `{ includeHistorical: includeArchived }`. The existing `courses.manage` check after the access decision remains in place: learners and faculty cannot bypass role/college scope by toggling `includeArchived`. Published-only learner path/content constraints remain active. The existing access helper still enforces tenant membership, enrollment and active role.

**Security acceptance (NOT EXECUTED):** (1) college admin can inspect archived offering/path/lesson/content on explicit historical request; (2) ordinary read excludes archive; (3) learner historical request rejects even when previously enrolled; (4) college B cannot read archived college A; (5) suspended/ended membership remains denied; (6) learner published-only content unchanged; (7) handling when source organization/college is ARCHIVED is consistent with legacy policy.

Source regression definitions: `tests/db05-archived-learning-hierarchy-access.test.mjs`. Database migrations are unaffected. Additional integration proof is necessary before DB-008 certification.
