# CI fix queue round 4: lane chat-19

TOP PRIORITY (build blocker): these are the type errors still left on main; the production build cannot pass until they are 0. Do these BEFORE ci2/ci3 (pause verify2). CI runs on every push to main, so your fixes are checked automatically. Push after every 3 packets. Tick [x] as you go.

- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane19_1.md` (1 errors; edit src/app/(authenticated)/learn/my-placements/support/page.tsx)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane19_2.md` (1 errors; edit src/app/api/placements/company-share/[token]/export/route.ts)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane19_3.md` (1 errors; edit src/app/api/placements/jobs/[jobId]/applications/route.ts)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane19_4.md` (1 errors; edit src/app/api/projects/[projectId]/members/route.ts)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane19_5.md` (10 errors; edit src/components/placements/college-application-detail-drawer.tsx)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane19_6.md` (1 errors; edit src/components/projects/learner-project-activity.tsx)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane19_7.md` (2 errors; edit src/components/projects/project-workspace.tsx)
