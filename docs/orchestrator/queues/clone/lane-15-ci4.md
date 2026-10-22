# CI fix queue round 4: lane chat-15

TOP PRIORITY (build blocker): these are the type errors still left on main; the production build cannot pass until they are 0. Do these BEFORE ci2/ci3 (pause verify2). CI runs on every push to main, so your fixes are checked automatically. Push after every 3 packets. Tick [x] as you go.

- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane15_1.md` (2 errors; edit src/app/(authenticated)/college/projects/page.tsx)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane15_2.md` (1 errors; edit src/app/api/academics/schedule-events/route.ts)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane15_3.md` (1 errors; edit src/app/api/academics/sections/route.ts)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane15_4.md` (2 errors; edit src/app/api/placements/recruiter/profile/route.ts)
