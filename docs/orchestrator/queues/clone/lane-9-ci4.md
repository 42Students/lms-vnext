# CI fix queue round 4: lane chat-9

TOP PRIORITY (build blocker): these are the type errors still left on main; the production build cannot pass until they are 0. Do these BEFORE ci2/ci3 (pause verify2). CI runs on every push to main, so your fixes are checked automatically. Push after every 3 packets. Tick [x] as you go.

- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane9_1.md` (3 errors; edit src/app/(authenticated)/admin/settings/page.tsx)
- [x] `docs/audit/gap-fix-work/ci4/packets/CI4_lane9_2.md` (7 errors; edit src/app/(authenticated)/tpo/messages/[threadId]/page.tsx)
