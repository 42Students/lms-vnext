# Deep verification packet (round 2, Claude agent 4)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-16-005-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-16-027-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-17-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-19-002-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-018-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-006-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-2-006-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-010-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-013-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-014-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-015-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-016-134  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-017-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-017-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-4-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-018-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-028-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-12-016-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-13-031-098  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)

## Results

- G2-2-013-009 — OK (static scope mapping): `src/db/schema/memberships.ts:148-171` resolves primary learner college from direct college or home-class college, rejects conflicts and requires role verification. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerRepository.java` (`findLearnersByCollegeIdIncludingViaClass`). This is scope mapping verification, not evidence of a completed historic data import.
- G2-4-025-075 — OK (schema and registration only): `src/db/schema/db10-skills-catalog.draft.ts:37-66` maps legacy integer Skill.id to nullable `legacy_skill_id` with unique partial index and canonical UUID; retains name/category/display/active/usage/priority/timestamps and corresponding indexes. `drizzle/meta/_journal.json` registers 0195. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Skill.java:10-51`. Database replay and actual data import remain unverified; schema explicitly fails closed pending migration-owner verification.

- **G2-4-028-012 — OK (guarded remove path).** `src/app/(authenticated)/tpo/settings/team/page.tsx` renders `TpoSettingsTeamRemove` for each relevant team entry. `src/components/tpo/tpo-settings-team-manage.tsx` checks removal impact with a scoped API request before presenting an accessible in-page confirmation; disables removal while owned work remains, protects self and permanent roles, and reports failures without pretending success. Legacy reference: `docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:79-86,161-164,228-244`. The new flow requires separately handing off owned work before retrying, rather than removing directly with an assignee selected in the same modal.

- G2-2-017-052 — OK: `src/app/api/college/course-progress/start-attempt/route.ts:41-43` uses transaction-scoped PostgreSQL advisory locking keyed by learner membership and offering before it reads attempts or inserts the next attempt (`:78-111`); `drizzle/0212_learner_content_progress_attempts.sql:3-9` enforces membership/content/attempt uniqueness. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:66-80`.
