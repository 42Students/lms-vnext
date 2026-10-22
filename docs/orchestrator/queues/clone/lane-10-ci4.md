# CI fix queue round 4: lane chat-10

TOP PRIORITY (build blocker): these are the type errors still left on main; the production build cannot pass until they are 0. Do these BEFORE ci2/ci3 (pause verify2). CI runs on every push to main, so your fixes are checked automatically. Push after every 3 packets. Tick [x] as you go.

- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane10_1.md` (1 errors; edit src/app/(authenticated)/college/course-progress/page.tsx)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane10_2.md` (1 errors; edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane10_3.md` (1 errors; edit src/modules/notifications/exotel-sms.ts)
