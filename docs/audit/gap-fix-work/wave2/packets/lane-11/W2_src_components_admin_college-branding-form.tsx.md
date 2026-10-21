# Work packet (wave 2): edit src/components/admin/college-branding-form.tsx

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-15-020-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:130-161 Card Look and feel, Reload, explanatory help
- vNext now: src/components/admin/college-branding-form.tsx:142-149 starts with Colours heading
- Fix: Clone legacy card hierarchy and descriptive introduction.

## G2-15-020-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169 Logo, :173-234 Preview, :236-238 Save
- vNext now: src/components/admin/college-branding-form.tsx:149-221 colours, grouped disclosures, save; :224-261 preview aside
- Fix: Restore Logo→Preview→Save sequence and section spacing.

## G2-15-020-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:173-234 in-column preview
- vNext now: src/components/admin/college-branding-form.tsx:143 340px preview aside at >=992
- Fix: Match preview position and aspect at desktop/mobile.

## G2-15-020-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:134-141 Reload button
- vNext now: src/components/admin/college-branding-form.tsx:217-220 Save branding only
- Fix: Add Reload action disabled on no college/while pending.

## G2-15-020-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169 Logo crop square 200x200 min
- vNext now: src/components/admin/college-branding-form.tsx:34 Logo URL https field and separate upload component
- Fix: Integrate cropped image upload into the editor.

## G2-15-020-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:175-183 Desktop/Mobile Segmented
- vNext now: src/components/admin/college-branding-form.tsx:224-261 static aside preview
- Fix: Add exact Desktop/Mobile preview toggle.

## G2-15-020-020  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:71-85 form resets when college selection changes
- vNext now: src/components/admin/college-branding-form.tsx:53-70 fixed college+initial values
- Fix: Restore dirty-reset notification on college change.

## G2-15-020-022  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169 image upload aspect1 min200
- vNext now: src/components/admin/college-branding-form.tsx:34,203-210 Logo URL text input
- Fix: Enforce upload dimensions/crop and actual preview.

## G2-15-020-023  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:236-238 Save disabled if no college/load error/fetching
- vNext now: src/components/admin/college-branding-form.tsx:90-99 guarded only canEdit or savingRef
- Fix: Disable save during failed initial load and unsynced college state.

## G2-15-020-034  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:175-183 segmented preview selector
- vNext now: src/components/admin/college-branding-form.tsx:224-261 no selector
- Fix: Implement mode toggle and focus.

## G2-15-020-035  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:30 useUnsavedFormGuard
- vNext now: src/components/admin/college-branding-form.tsx:68-74 no unsaved-route guard
- Fix: Guard beforeunload and in-app back.

## G2-15-020-053  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:175-189 Desktop340x191,Mobile170x302 preview
- vNext now: src/components/admin/college-branding-form.tsx:143,224-261 fixed side preview
- Fix: Match original preview dimensions/aspect.

## G2-15-020-054  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:186-204 fixed teal halo preview
- vNext now: src/components/admin/college-branding-form.tsx:224-261 current college brand-colour style
- Fix: Use actual fixed login background and teal card.

## G2-15-020-055  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169 crop component with Ant label
- vNext now: src/components/admin/college-branding-form.tsx:203-210 URL inputs aria-invalid
- Fix: Provide accessible crop/keyboard flow.

## G2-15-020-056  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:175-183 Desktop/Mobile segmented keyboard control
- vNext now: src/components/admin/college-branding-form.tsx:224-261 static preview
- Fix: Restore accessible preview selector.

## G2-15-020-064  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:74-83 switching colleges discards dirty with warning
- vNext now: src/components/admin/college-branding-form.tsx:68-70 local state snapshot lacks switch warning
- Fix: Guard selected scope change.

## G2-9-030-006  [P2] GAP  facet F02  effort M
- Legacy: Logo field, preview, Save in one vertical form `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-239`
- vNext now: Upload, large form and preview disclosure separate `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:46-61` `src/components/admin/college-branding-form.tsx:142-220`
- Fix: Use old vertical sequence

## G2-9-030-010  [P2] GAP  facet F03  effort S
- Legacy: Save button SaveOutlined, text Save, disabled on loading/error `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:236-238`
- vNext now: Save branding button, disabled only saving `src/components/admin/college-branding-form.tsx:217-220`
- Fix: Match Save label, icon and disabled states

## G2-9-030-013  [P2] GAP  facet F04  effort M
- Legacy: Login preview logo16×16 and dummy card `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:217-228`
- vNext now: Larger logo and phone/email mock form `src/components/admin/college-branding-form.tsx:232-260` `src/components/admin/college-branding-preview.tsx:49-91`
- Fix: Match dimensions and simplified mock card

## G2-9-030-019  [P2] GAP  facet F05  effort S
- Legacy: Preview default desktop `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:27-28`
- vNext now: Live mock preview has no Desktop/Mobile toggle `src/components/admin/college-branding-form.tsx:224-261`
- Fix: Default selected Desktop, offer Mobile

## G2-9-030-021  [P2] GAP  facet F06  effort S
- Legacy: Logo helper states initials fallback and optimal square image `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:165-169`
- vNext now: New URL and upload copy different `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:43-46` `src/components/admin/college-branding-form.tsx:34-41`
- Fix: Use literal old helper text

## G2-9-030-046  [P2] GAP  facet F13  effort M
- Legacy: Card spinner and load error + Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:143-154`
- vNext now: Server data await without in-panel retry `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:30-35` `src/components/admin/college-branding-form.tsx:142-148`
- Fix: Add in-panel loading/retry

## G2-9-030-052  [P2] GAP  facet F16  effort M
- Legacy: Compact centered preview with 340/170 widths `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:185-230`
- vNext now: Larger responsive aside and stored preview `src/components/admin/college-branding-form.tsx:224-261` `src/components/admin/college-branding-preview.tsx:31-46`
- Fix: Match old preview geometry

## G2-9-030-060  [P2] GAP  facet F19  effort M
- Legacy: Saves then reloads effective branding and cleans files `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:97-109`
- vNext now: Locally updates version, no immediate preview fetch `src/components/admin/college-branding-form.tsx:107-113`
- Fix: Refresh preview post-save

## G2-9-030-064  [P2] GAP  facet F21  effort M
- Legacy: Preview mimics old login fixed teal `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:170-173`
- vNext now: Supports dynamic colors/background, redesigned sign in `src/components/admin/college-branding-preview.tsx:17-29` `src/components/admin/college-branding-form.tsx:224-260`
- Fix: Validate against actual sign-in page

## G2-15-020-007  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:131 'Look and feel' card
- vNext now: src/components/admin/college-branding-form.tsx:149 'Colours' and :230 'Sign-in preview' headings
- Fix: Restore exact title.

## G2-15-020-011  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:236-238 Save button with icon
- vNext now: src/components/admin/college-branding-form.tsx:217-220 Save branding button text
- Fix: Align button copy/icon and loading.

## G2-15-020-057  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:131 'Look and feel'
- vNext now: src/components/admin/college-branding-form.tsx:149 'Colours'
- Fix: Clone exact title.

## G2-15-020-058  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:164-166 'Logo' and initials help
- vNext now: src/components/admin/college-branding-form.tsx:34 'Logo URL' and https hint
- Fix: Restore label and initials fallback explanation.

## G2-15-020-059  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:231-233 'Approximation' disclaimer
- vNext now: src/components/admin/college-branding-form.tsx:229-261 mock sign-in without disclaimer
- Fix: Restore disclaimer or build exact preview.

## G2-15-020-060  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:236-238 'Save'
- vNext now: src/components/admin/college-branding-form.tsx:219 'Save branding'
- Fix: Align button text.
