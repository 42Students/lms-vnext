# CI fix queue round 4: lane chat-6

TOP PRIORITY (build blocker): these are the type errors still left on main; the production build cannot pass until they are 0. Do these BEFORE ci2/ci3 (pause verify2). CI runs on every push to main, so your fixes are checked automatically. Push after every 3 packets. Tick [x] as you go.

- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane6_1.md` (2 errors; edit src/app/api/placements/tpo/audit/export/route.ts)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane6_2.md` (1 errors; edit src/app/enterprises/page.tsx)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane6_3.md` (1 errors; edit src/components/placements/college-application-pipeline-controls.tsx)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane6_4.md` (2 errors; edit src/components/placements/placement-job-create-form.tsx)
- [ ] `docs/audit/gap-fix-work/ci4/packets/CI4_lane6_5.md` (1 errors; edit src/components/placements/tpo-drive-edit-form.tsx)
