# Gap FIX queue: lane chat-9

21 audit documents, 1462 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-9.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-9-b with [chat-9] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md` (P0:0 P1:44 P2:41 P3:2 open:87)
- [ ] `docs/audit/gap2/lane-9/college-admin-jobs-settings.md` (P0:0 P1:36 P2:49 P3:3 open:88)
- [ ] `docs/audit/gap2/lane-9/college-admin-jobs-applications.md` (P0:0 P1:33 P2:47 P3:0 open:80)
- [ ] `docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md` (P0:0 P1:31 P2:38 P3:0 open:69)
- [ ] `docs/audit/gap2/lane-9/college-admin-jobs-all.md` (P0:0 P1:27 P2:56 P3:2 open:85)
- [ ] `docs/audit/gap2/lane-9/superadmin-company-curation.md` (P0:0 P1:27 P2:53 P3:6 open:86)
- [ ] `docs/audit/gap2/lane-9/superadmin-companies-college.md` (P0:0 P1:27 P2:52 P3:4 open:83)
- [ ] `docs/audit/gap2/lane-9/college-admin-electives.md` (P0:0 P1:28 P2:40 P3:0 open:68)
- [ ] `docs/audit/gap2/lane-9/college-admin-companies.md` (P0:0 P1:27 P2:41 P3:0 open:68)
- [ ] `docs/audit/gap2/lane-9/college-admin-batches.md` (P0:0 P1:26 P2:47 P3:1 open:74)
- [ ] `docs/audit/gap2/lane-9/superadmin-dashboard.md` (P0:0 P1:24 P2:56 P3:7 open:87)
- [ ] `docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md` (P0:0 P1:26 P2:30 P3:3 open:59)
- [ ] `docs/audit/gap2/lane-9/college-admin-jobs-interviews.md` (P0:0 P1:24 P2:32 P3:0 open:56)
- [ ] `docs/audit/gap2/lane-9/cross-settings-feature-flags.md` (P0:0 P1:19 P2:59 P3:8 open:86)
- [ ] `docs/audit/gap2/lane-9/l19-u019-faculty-teaching-assignment.md` (P0:0 P1:20 P2:35 P3:1 open:56)
- [ ] `docs/audit/gap2/lane-9/college-admin-jobs-overview.md` (P0:0 P1:20 P2:31 P3:0 open:51)
- [ ] `docs/audit/gap2/lane-9/college-admin-batch-promotion.md` (P0:0 P1:18 P2:44 P3:0 open:62)
- [ ] `docs/audit/gap2/lane-9/l15-u027-faculty-controller.md` (P0:0 P1:18 P2:40 P3:1 open:59)
- [ ] `docs/audit/gap2/lane-9/superadmin-admin-resources.md` (P0:0 P1:18 P2:39 P3:3 open:60)
- [ ] `docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md` (P0:0 P1:20 P2:16 P3:0 open:36)
- [ ] `docs/audit/gap2/lane-9/superadmin-colleges.md` (P0:0 P1:17 P2:43 P3:2 open:62)
