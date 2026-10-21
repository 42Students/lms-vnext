# Gap FIX queue, wave 1 (by file): lane chat-15

You own 59 work packets (633 findings, 3 P0, 610 P1) in: schema and migrations. No other lane edits these files.

For EACH packet below, in order (highest severity first), strictly one at a time:
1. Open the packet. It lists the audit findings for ONE file (or one new-feature group). Read the target file in the repo, then apply ALL findings of the packet in a single editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Packets of the same file come in parts (part 1 of N, ...): do the parts in order.
2. Edit ONLY files in your areas. If a finding needs a change in a file another lane owns, append one line to docs/audit/gap-fix/handoff-lane-15.md (target file, finding ID, change needed) and go on.
3. Keep the intentional vNext model: one workspace per role, college x role switcher, membership model. Skip UNKNOWN, conflicting or already-fixed findings with a one-line note in your proof file.
4. TypeScript strict, valid syntax. You cannot run code, so re-read each edited file for matching tags, imports, props and exports. No new packages. Never reformat untouched code. Never rename or change the signature of shared exports without checking every caller you can find with search.
6. You are the MIGRATIONS lane: you own the other half of the schema files and the journal drizzle/meta/_journal.json. Add new SQL migrations numbered 0138 to 0199 (last existing is 0137_lanes_round_4), one file per logical change, plus a matching journal entry for each (idx continues from 137, version 7, when, tag, breakpoints true). Lane 14 writes migrations numbered from 0200 upward and does not touch the journal: once their files exist on main, add journal entries for them too (use idx after yours, in numeric order). Never edit an existing migration. At the end read every docs/audit/gap-fix/handoff-lane-*.md for schema needs from other lanes and cover them in your range. Nothing is executed; the owner approves running migrations.
5. Tick [x] in this queue and append one line per packet to docs/audit/gap-fix/lane-15.md (packet | findings applied | skipped and why). Push to chatgpt/chat-15-b with commits tagged [chat-15] after every 2 packets (git fetch first; on conflict keep the other lane's lines and re-apply yours). If the merge robot restores one of your files because of a syntax error, you will be told: redo that packet.

Packets:

- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part1of15.md` (edit src/db/schema/placements.ts; 20 findings; best P0)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part2of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part3of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part4of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part5of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part6of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part7of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part8of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part9of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part10of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part11of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part12of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part13of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part14of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placements.ts.part15of15.md` (edit src/db/schema/placements.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_inbound-mail.ts.md` (edit src/db/schema/inbound-mail.ts; 17 findings; best P0)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_academics.ts.part1of3.md` (edit src/db/schema/academics.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_academics.ts.part2of3.md` (edit src/db/schema/academics.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_academics.ts.part3of3.md` (edit src/db/schema/academics.ts; 18 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_memberships.ts.part1of2.md` (edit src/db/schema/memberships.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_memberships.ts.part2of2.md` (edit src/db/schema/memberships.ts; 13 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_profiles.ts.part1of2.md` (edit src/db/schema/profiles.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_profiles.ts.part2of2.md` (edit src/db/schema/profiles.ts; 12 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_assessments.ts.part1of2.md` (edit src/db/schema/assessments.ts; 20 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_assessments.ts.part2of2.md` (edit src/db/schema/assessments.ts; 2 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_tenant-domains.ts.md` (edit src/db/schema/tenant-domains.ts; 19 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_project-audit-staged.ts.md` (edit src/db/schema/project-audit-staged.ts; 17 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_discussions.ts.md` (edit src/db/schema/discussions.ts; 14 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_db10-bug-tracker.ts.md` (edit src/db/schema/db10-bug-tracker.ts; 12 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_colleges.ts.md` (edit src/db/schema/colleges.ts; 11 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_messaging-receipts.ts.md` (edit src/db/schema/messaging-receipts.ts; 10 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placement-college-application-stages.ts.md` (edit src/db/schema/placement-college-application-stages.ts; 8 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_platform-setting-overrides.ts.md` (edit src/db/schema/platform-setting-overrides.ts; 8 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_db10-log-alerts.draft.ts.md` (edit src/db/schema/db10-log-alerts.draft.ts; 6 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_db10-outbound-messages.draft.ts.md` (edit src/db/schema/db10-outbound-messages.draft.ts; 6 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_tpo-configuration.ts.md` (edit src/db/schema/tpo-configuration.ts; 6 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_module-access.ts.md` (edit src/db/schema/module-access.ts; 5 findings; best P1)
- [x] `docs/audit/gap-fix-work/packets/lane-15/drizzle_0076_db10_announcements_bug_tracker.sql.md` (edit drizzle/0076_db10_announcements_bug_tracker.sql; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_electives.ts.md` (edit src/db/schema/electives.ts; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_faculty-course-associations.ts.md` (edit src/db/schema/faculty-course-associations.ts; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_db02-learner-import-batches.staged.ts.md` (edit src/db/schema/db02-learner-import-batches.staged.ts; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_db10-audit-findings.draft.ts.md` (edit src/db/schema/db10-audit-findings.draft.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_db06-history-staged.ts.md` (edit src/db/schema/db06-history-staged.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_departments.ts.md` (edit src/db/schema/departments.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placement-drive-requests.ts.md` (edit src/db/schema/placement-drive-requests.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/drizzle_0024_placements_p6c_results.sql.md` (edit drizzle/0024_placements_p6c_results.sql; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/drizzle_0004_courses_c2_learning.sql.md` (edit drizzle/0004_courses_c2_learning.sql; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placement-external.ts.md` (edit src/db/schema/placement-external.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_index.ts.md` (edit src/db/schema/index.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_identity-auth-attempts.ts.md` (edit src/db/schema/identity-auth-attempts.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placement-registration.ts.md` (edit src/db/schema/placement-registration.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_course-upload-receipts-staged.ts.md` (edit src/db/schema/course-upload-receipts-staged.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/drizzle_0033_attendance_foundation.sql.md` (edit drizzle/0033_attendance_foundation.sql; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/drizzle_0007_courses_c4b_quizzes.sql.md` (edit drizzle/0007_courses_c4b_quizzes.sql; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/drizzle_0050_db02_program_terms_curriculum.sql.md` (edit drizzle/0050_db02_program_terms_curriculum.sql; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_recruiter-message-email.ts.md` (edit src/db/schema/recruiter-message-email.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_placement-tpo-notice-audiences.ts.md` (edit src/db/schema/placement-tpo-notice-audiences.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/src_db_schema_college-signin.ts.md` (edit src/db/schema/college-signin.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/packets/lane-15/drizzle_0131_placement_tpo_job_types_canonical.sql.md` (edit drizzle/0131_placement_tpo_job_types_canonical.sql; 1 findings; best P1)
