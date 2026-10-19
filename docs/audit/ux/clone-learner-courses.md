# H — Learner / Courses / Super Admin course-content clone audit

Owner lane: `chat-7` · Branch: `chatgpt/chat-7-b` · Status: IN PROGRESS
Baseline: `origin/main` commit `ca5572f28bd815ac394180d4269df3db5889e19f` (2026-10-19).
Rules: `docs/design/ui-clone-checklist.md` WORK STYLE and STRICT TICK RULE.
Legacy sources: `docs/design/legacy-styles/`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-pages.md`.

## Coverage inventory and grep plan

Repository tree inventory from GitHub (recursive, not truncated): 98 TSX in `src/components/courses/`, 135 TSX under `src/app/(authenticated)/learn/`, and 13 TSX in `src/app/(authenticated)/admin/{courses,course-progress,lessons}` = **246 TSX paths**. This does not assert that all nested learner widgets outside `components/courses` have been reviewed; those are another explicit search step.

Source check commands (record actual resulting match counts and paths after each sweep; do not count component imports as migration):

```bash
rg -l '<button([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<select([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<input([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<textarea([[:space:]>])' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '#[[:xdigit:]]{6}([[:space:]"';]|$)' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<table([[:space:]>])|role="dialog"|fixed inset-0' src/components/courses 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
rg -l '<h1([[:space:]>])' 'src/app/(authenticated)/learn' 'src/app/(authenticated)/admin/courses' 'src/app/(authenticated)/admin/course-progress' 'src/app/(authenticated)/admin/lessons' --glob '*.tsx'
```

Native hidden inputs without styling, and textarea DOM refs that depend on selection/focus are *not* yet accepted exemptions under the owner's strict rule. They remain open until migrated safely or documented with a concrete behavioral necessity and approved policy.

## Items — STRICT TICK RULE

- [ ] H1 learner route headings / shared PageHeader / one canvas (missing: complete page-wise comparison, source-line value table, phone/tablet proof, and final grep counts)
- [ ] H2 learner assignment / quiz / discussion controls (missing: exhaustive control enumeration, zero raw styled instances, full legacy property-state parity table)
- [ ] H3 course list, lessons, roadmap, video, resource, attendance and progress UI (missing: exhaustive UI instances, responsive proof and value table)
- [ ] H4 Super Admin course, lessons, content authoring and progress UI (missing: source grep zero and value/state proof)
- [ ] H5 shared course component library across faculty/college/learner (missing: all 98 files reviewed against legacy source and all raw controls migrated)
- [ ] H6 no raw tables, custom overlays, hard-coded hex or nested outer canvas (missing: complete grep and documented exception review)

## Property/state comparison ledger (not yet signable)

| Element / property / state | Legacy file:line / value | vNext file:line / value | Result |
|---|---|---|---|
| Primary button default height/radius/colour | `docs/design/ui-clone-checklist.md` D: 36px / 9px / #0a7c88 (legacy SCSS per owner) | `src/components/ui/button.tsx` (shared skin maintained by chat-17; verify exact lines and states) | OPEN |
| Page head title font / colour | `docs/design/ui-clone-checklist.md` B5: shared head; `old-lms-pages.md` for exact values | `src/components/ui/page-header.tsx` (chat-9) | OPEN |
| Canvas background / padding / border | `docs/design/ui-clone-checklist.md` B5: white, radius 12px, padding 24px | Authenticated page canvas (chat-9) | OPEN |
| Form focus / invalid / disabled / readonly | `docs/design/legacy-styles/` forms SCSS (exact lines pending) | shared `Input`, `Select`, `Textarea` (chat-17) | OPEN |
| Mobile/tablet page layout, focus order, touch targets | `docs/design/old-lms-pages.md` + legacy rules (comparison pending) | Each learner and admin page (screenshots pending) | OPEN |

Do not tick any item until each value and state has exact legacy/vNext file:line proof and match; record negative findings as missing, not as completed. Pixel screenshots are orchestrator's separate section J.
