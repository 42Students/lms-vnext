# CI fix queue round 4: lane chat-18

TOP PRIORITY (build blocker): these are the type errors still left on main; the production build cannot pass until they are 0. Do these BEFORE ci2/ci3 (pause verify2). CI runs on every push to main, so your fixes are checked automatically. Push after every 3 packets. Tick [x] as you go.

- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane18_1.md` (1 errors; edit src/app/api/projects/templates/[templateId]/route.ts)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane18_2.md` (2 errors; edit src/components/projects/super-admin-template-subview-page.tsx)
