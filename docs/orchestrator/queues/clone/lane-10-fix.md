# Gap FIX queue: lane chat-10

20 audit documents, 1452 open items (GAP/MISSING). Documents are sorted so the ones with the most P0/P1 items come first.

This is a CODE job now. For EACH document below, read it (facet table rows whose Verdict is GAP or MISSING) and implement every fix so vNext matches the old LMS, strictly one document at a time:
1. Work P0 rows first, then P1, then P2, then P3, but finish the whole document before moving on.
2. Make the change in vNext code (src/app, src/modules, src/components, src/db schema plus a drizzle migration where a table or column is needed). Match old LMS wording, layout, validation, permissions and behaviour exactly; wording parity is mandatory (docs/audit/legacy-copy-A.md and B.md).
3. Keep intentional vNext decisions: one workspace per role, college x role switcher, membership model (rows marked EXTRA or described as intentional are NOT to be undone). When a row is UNKNOWN or the fix would break the membership model, write a one-line note in the proof file and skip it.
4. Rows touching shared components or shared files may conflict with other lanes: keep edits small and local, never reformat files, never rename shared exports.
5. TypeScript strict, valid syntax (you cannot run code, so re-read every edited file for matching tags and imports), no new packages, no CI.
6. After each document: tick [x] here, append to docs/audit/gap-fix/lane-10.md one entry per document (document | rows fixed | rows skipped and why | files changed), and push to chatgpt/chat-10-b with [chat-10] after every 2 documents (git fetch first; on conflict keep the other lane's lines and re-apply yours).

Documents:

- [ ] `docs/audit/gap2/lane-10/superadmin-inbound-mail.md` (P0:2 P1:36 P2:49 P3:11 open:98)
- [ ] `docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md` (P0:0 P1:43 P2:29 P3:2 open:74)
- [ ] `docs/audit/gap2/lane-10/superadmin-tenants.md` (P0:0 P1:30 P2:49 P3:2 open:81)
- [ ] `docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md` (P0:0 P1:30 P2:42 P3:3 open:75)
- [ ] `docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md` (P0:0 P1:27 P2:53 P3:11 open:91)
- [ ] `docs/audit/gap2/lane-10/superadmin-module-access.md` (P0:0 P1:27 P2:44 P3:20 open:91)
- [ ] `docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md` (P0:0 P1:25 P2:39 P3:1 open:65)
- [ ] `docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md` (P0:0 P1:23 P2:46 P3:4 open:73)
- [ ] `docs/audit/gap2/lane-10/superadmin-announcements.md` (P0:0 P1:22 P2:42 P3:3 open:67)
- [ ] `docs/audit/gap2/lane-10/file-upload-controller.md` (P0:0 P1:23 P2:30 P3:5 open:58)
- [ ] `docs/audit/gap2/lane-10/superadmin-companies.md` (P0:0 P1:20 P2:46 P3:5 open:71)
- [ ] `docs/audit/gap2/lane-10/superadmin-jobs-all.md` (P0:0 P1:18 P2:48 P3:6 open:72)
- [ ] `docs/audit/gap2/lane-10/superadmin-settings.md` (P0:0 P1:18 P2:45 P3:16 open:79)
- [ ] `docs/audit/gap2/lane-10/superadmin-recruiters.md` (P0:0 P1:17 P2:39 P3:18 open:74)
- [ ] `docs/audit/gap2/lane-10/superadmin-sections-job-form.md` (P0:0 P1:16 P2:36 P3:4 open:56)
- [ ] `docs/audit/gap2/lane-10/superadmin-lecture-halls.md` (P0:0 P1:15 P2:42 P3:7 open:64)
- [ ] `docs/audit/gap2/lane-10/l19-u030-tpo-profile.md` (P0:0 P1:16 P2:31 P3:5 open:52)
- [ ] `docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md` (P0:0 P1:13 P2:53 P3:3 open:69)
- [ ] `docs/audit/gap2/lane-10/recruiter-self-controller.md` (P0:0 P1:14 P2:41 P3:7 open:62)
- [ ] `docs/audit/gap2/lane-10/superadmin-programs.md` (P0:0 P1:13 P2:48 P3:19 open:80)
