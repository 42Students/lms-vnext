# UI/UX polish queue: lane chat-10

28 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-10.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-10-b with [chat-10], ticking [x] in this queue in the same push.

- [ ] `src/app/(authenticated)/college/profile/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/programs/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/[projectId]/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/at-risk/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/audit/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/create/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/readiness/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/submissions/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/templates/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/projects/workspaces/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/quizzes/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/resources/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/semester-courses/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/semesters/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/students/[membershipId]/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/students/import/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/students/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/students/register/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/verification/page.tsx` (College admin page)
- [ ] `src/app/(authenticated)/college/videos/page.tsx` (College admin page)
