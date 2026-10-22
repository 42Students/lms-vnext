# Deep verification packet (round 2, agent 4)

## Results

- G2-2-013-009 — OK (static scope mapping): `src/db/schema/memberships.ts:148-171` resolves primary learner college from direct college or home-class college, rejects conflicts and requires role verification. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerRepository.java` (`findLearnersByCollegeIdIncludingViaClass`). This is scope mapping verification, not evidence of a completed historic data import.
- G2-4-025-075 — OK (schema and registration only): `src/db/schema/db10-skills-catalog.draft.ts:37-66` maps legacy integer Skill.id to nullable `legacy_skill_id` with unique partial index and canonical UUID; retains name/category/display/active/usage/priority/timestamps and corresponding indexes. `drizzle/meta/_journal.json` registers 0195. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Skill.java:10-51`. Database replay and actual data import remain unverified; schema explicitly fails closed pending migration-owner verification.
