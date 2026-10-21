# Work packet (wave 2): edit src/components/admin/college-branding-preview.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-9-030-009  [P2] GAP  facet F03  effort M
- Legacy: Desktop/Mobile segmented selector `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:175-184`
- vNext now: Static desktop/mobile illustrations rather than one selected mode `src/components/admin/college-branding-preview.tsx:31-46`
- Fix: Add segmented preview toggle

## G2-9-030-013  [P2] GAP  facet F04  effort M
- Legacy: Login preview logo16×16 and dummy card `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:217-228`
- vNext now: Larger logo and phone/email mock form `src/components/admin/college-branding-form.tsx:232-260` `src/components/admin/college-branding-preview.tsx:49-91`
- Fix: Match dimensions and simplified mock card

## G2-9-030-014  [P2] GAP  facet F04  effort S
- Legacy: Preview desktop 340×191 and mobile170×302 `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:185-203`
- vNext now: min-height desktop and aspect47/72 mobile `src/components/admin/college-branding-preview.tsx:31-46`
- Fix: Match pixel sizes

## G2-9-030-015  [P2] GAP  facet F04  effort S
- Legacy: Teal halo fixed gradient background `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:10-11,186-203`
- vNext now: Color-token or uploaded-background preview `src/components/admin/college-branding-preview.tsx:17-29`
- Fix: Use fixed teal halo for parity illustration

## G2-9-030-016  [P2] GAP  facet F04  effort S
- Legacy: No-logo fallback 16px teal icon square `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:217-221`
- vNext now: Initial letter in large rounded tile `src/components/admin/college-branding-preview.tsx:58-69`
- Fix: Restore small teal fallback

## G2-9-030-052  [P2] GAP  facet F16  effort M
- Legacy: Compact centered preview with 340/170 widths `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:185-230`
- vNext now: Larger responsive aside and stored preview `src/components/admin/college-branding-form.tsx:224-261` `src/components/admin/college-branding-preview.tsx:31-46`
- Fix: Match old preview geometry

## G2-9-030-055  [P2] GAP  facet F17  effort S
- Legacy: Keyboard segmented Desktop/Mobile preview `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:175-184`
- vNext now: Noninteractive paired desktop/mobile illustration `src/components/admin/college-branding-preview.tsx:31-46`
- Fix: Add labelled segmented switch

## G2-9-030-064  [P2] GAP  facet F21  effort M
- Legacy: Preview mimics old login fixed teal `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:170-173`
- vNext now: Supports dynamic colors/background, redesigned sign in `src/components/admin/college-branding-preview.tsx:17-29` `src/components/admin/college-branding-form.tsx:224-260`
- Fix: Validate against actual sign-in page

## G2-9-030-058  [P3] GAP  facet F18  effort S
- Legacy: Approximation — real page also shows floating symbols and full sign-in form `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:231-233`
- vNext now: Illustration only · No live sign-in `src/components/admin/college-branding-preview.tsx:88-90` `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:57-62`
- Fix: Use legacy footer caveat
