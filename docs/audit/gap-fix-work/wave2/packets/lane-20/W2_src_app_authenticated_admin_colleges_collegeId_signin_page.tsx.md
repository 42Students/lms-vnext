# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md

## G2-4-031-001  [P2] GAP  facet F01  effort S
- Legacy: Embeddable Manage College Sign-in tab with fixedCollegeId and dirty/busy callbacks (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-89`)
- vNext now: Dedicated `/admin/colleges/[collegeId]/signin` route with back link (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:12-25`)
- Fix: Embed panel under legacy Manage College drawer tab or adapt drawer nav preserving edits.

## G2-4-031-005  [P2] GAP  facet F02  effort S
- Legacy: AntD small Card title Sign-in, extra Reload and single Save form (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:131-153`)
- vNext now: PageHeader college name and separate form section; no Reload at top (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:22-32`)
- Fix: Restore small card and in-card Reload action.

## G2-4-031-035  [P2] GAP  facet F09  effort S
- Legacy: Single Card, no drawer own overlays; parent Manage College controls close (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:131-153`)
- vNext now: Dedicated page and ConfirmDialog on save (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:22-35`)
- Fix: Restore original embedded form or route-leave protection.

## G2-4-031-048  [P2] GAP  facet F13  effort S
- Legacy: Card spinner while initial fetch and error Alert within card (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:131-140`)
- vNext now: Readiness warning, server render before form (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:18-32`)
- Fix: Provide in-card initial skeleton and load-failure retry.

## G2-4-031-050  [P2] GAP  facet F13  effort S
- Legacy: When no fixedCollegeId, load returns, picker stays default (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:90-113`)
- vNext now: Invalid college UUID → notFound (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:15-20`)
- Fix: Show select-college state inside Manage College drawer instead of hard 404 when no selection.

## G2-4-031-060  [P2] GAP  facet F18  effort S
- Legacy: Info paragraph How everyone — students, staff and recruiters — signs in on this college's own web address. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:141-144`)
- vNext now: New copy Choose the one-time-code channels offered on this college web address. (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:23-25`)
- Fix: Restore complete legacy explanatory paragraph.

## G2-5-030-042  [P2] GAP  facet F13  effort M
- Legacy: Legacy unsaved/busy state protected before close. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:58-81`
- vNext now: vNext migration pending prevents sign-in edits but navigation still possible. `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:27-31`
- Fix: Distinguish saving/busy and migration pending in UI.

## G2-5-030-051  [P2] GAP  facet F17  effort M
- Legacy: Legacy explicit danger confirmation before dirty discard. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:73-80`
- vNext now: vNext back link navigates with no shared dialog. `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:22-34`
- Fix: Accessible danger modal, focus first error/continue editing.

## G2-5-030-063  [P2] GAP  facet F22  effort M
- Legacy: Legacy local dirty/busy object with domain/signin/branding/admin keys; not persisted. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33`
- vNext now: vNext form-specific draft/version, no shared persisted revision ID. `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:46-55`, `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:28-31`
- Fix: Track per-section expectedVersion and pending changes consistently.
