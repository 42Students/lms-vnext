# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-4-015-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-4-015-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-4-015-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-4-028-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-001-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-001-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-001-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-001-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-001-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-001-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)

## Results

- G2-4-028-011: OK — `src/app/(authenticated)/tpo/settings/team/page.tsx:80-82,183` loads eligible faculty and mounts the assignment UI; `src/components/tpo/tpo-settings-team-manage.tsx:39-69` has the exact “Add a team member” action, search and submit, matching `docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:132-140`.
- G2-4-015-020: OK — `src/modules/people/learner-profile-document-edit-service.ts:64-78` patches only supplied job-preference fields under a matching baseline, preserving unrelated profile sections; `src/modules/placements/learner-placement-notification-model.ts:33-49` uses nullish coalescing for legacy nullable notification fields. Matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:954-972`.
- G2-4-015-034: OK — `src/modules/people/learner-profile-document-edit-service.ts:39-110` makes profile and matching-job notification writes one transaction; `src/modules/placements/learner-placement-notification-service.ts:24-99` explicitly scopes and atomically writes only its two notification choices, with stale-baseline detection. Legacy single-record upsert is `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:944-975`; split vNext saves have distinct bounded ownership.

