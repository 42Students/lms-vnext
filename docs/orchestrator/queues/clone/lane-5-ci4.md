# CI fix queue round 4: lane chat-5

TOP PRIORITY (build blocker): these are the type errors still left on main; the production build cannot pass until they are 0. Do these BEFORE ci2/ci3 (pause verify2). CI runs on every push to main, so your fixes are checked automatically. Push after every 3 packets. Tick [x] as you go.

- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane5_1.md` (1 errors; edit src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane5_2.md` (1 errors; edit src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx)
