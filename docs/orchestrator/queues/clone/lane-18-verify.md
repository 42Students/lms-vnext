# UI/UX polish VERIFICATION queue: lane chat-18 (surfaces polished by OTHER lanes)

32 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-18.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-18-b with [chat-18] after every 2 surfaces.

- [x] `src/app/(authenticated)/college/academics/page.tsx`
- [x] `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx`
- [x] `src/app/(authenticated)/college/activity/[eventId]/page.tsx`
- [x] `src/app/(authenticated)/college/activity/page.tsx`
- [x] `src/app/(authenticated)/college/announcements/page.tsx`
- [x] `src/app/(authenticated)/college/assignments/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/corrections/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/departments/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/settings/page.tsx`
- [x] `src/app/(authenticated)/college/batch-promotion/page.tsx`
- [x] `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx`
- [x] `src/app/(authenticated)/college/batches/page.tsx`
- [x] `src/app/(authenticated)/college/branding/page.tsx`
- [x] `src/app/(authenticated)/college/classes/page.tsx`
- [x] `src/app/(authenticated)/college/classes/recurring-preview/page.tsx`
- [x] `src/app/(authenticated)/college/college-profile/page.tsx`
- [x] `src/app/(authenticated)/college/companies/page.tsx`
- [x] `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/college/contacts/page.tsx`
- [x] `src/app/(authenticated)/college/course-progress/page.tsx`
- [x] `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx`
- [x] `src/app/(authenticated)/college/courses/page.tsx`
- [x] `src/app/(authenticated)/college/departments/page.tsx`
- [x] `src/app/(authenticated)/college/domains/page.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`
- [x] `src/app/(authenticated)/college/electives/page.tsx`
- [x] `src/app/(authenticated)/college/faculty-assignment/page.tsx`
- [x] `src/components/college/college-faculty-assignment-actions.tsx`
- [x] `src/components/college/college-student-lifecycle-action.tsx`
- [x] `src/components/people/faculty-profile-editor.tsx`
