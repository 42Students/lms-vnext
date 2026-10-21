# Work packet (wave 2): edit src/components/admin/college-signin-method-form.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-006  [P2] GAP  facet F02  effort S
- Legacy: Explanation above picker, then Sign-in methods and Save (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:141-144`)
- vNext now: Heading Sign-in method, fieldset, saved method, button, confirmation (`src/components/admin/college-signin-method-form.tsx:55-75`)
- Fix: Place exact explanation and form order, put saved value into old card.

## G2-4-031-007  [P2] MISSING  facet F02  effort M
- Legacy: Miniature method switch sketches in each option (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:17-40`)
- vNext now: Radio rows without toggle sketch (`src/components/admin/college-signin-method-form.tsx:58-64`)
- Fix: Draw Email/Phone pill sketch with active first per option.

## G2-4-031-008  [P2] GAP  facet F03  effort S
- Legacy: Four selectable bordered 2px/1px rounded12 radio-card choices (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:43-75`)
- vNext now: Four plain radio rows with divide-y border (`src/components/admin/college-signin-method-form.tsx:58-65`)
- Fix: Use 4 card tiles with border thickness, radius, selected fill and spacing.

## G2-4-031-010  [P2] MISSING  facet F03  effort S
- Legacy: Selected first method mini pill white/light gray, 11px text (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:20-35`)
- vNext now: No miniature selected-first toggle (`src/components/admin/college-signin-method-form.tsx:60-64`)
- Fix: Match active sketch on all four cards.

## G2-4-031-011  [P2] MISSING  facet F03  effort S
- Legacy: ReloadOutlined icon in card toolbar (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:136-136`)
- vNext now: No Reload button or reload icon (`src/components/admin/college-signin-method-form.tsx:55-75`)
- Fix: Provide Reload icon/action while blocking dirty close appropriately.

## G2-4-031-012  [P2] GAP  facet F03  effort S
- Legacy: SaveOutlined primary icon button label Save (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:149-150`)
- vNext now: Primary button label Save sign-in settings, no icon (`src/components/admin/college-signin-method-form.tsx:67-70`)
- Fix: Restore exact button and icon.

## G2-4-031-018  [P2] GAP  facet F05  effort M
- Legacy: Choices adaptive grid minmax190, max640, no pagination (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:46-75`)
- vNext now: Vertical full-width divide-y list, max-w-3xl container (`src/components/admin/college-signin-method-form.tsx:55-65`)
- Fix: Restore adaptive 2–3 column cards and max640 width.

## G2-4-031-020  [P2] GAP  facet F05  effort S
- Legacy: Radio card click changes form value immediately, selected border (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:50-72`)
- vNext now: Radio change sets local selection, row background changes (`src/components/admin/college-signin-method-form.tsx:60-64`)
- Fix: Match selected border state and exact card click target.

## G2-4-031-022  [P2] GAP  facet F06  effort S
- Legacy: Form vertical single `loginMethods` required by selection, Save disabled only fetching/error (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:145-149`)
- vNext now: Fieldset disabled if !ready/saving; Save disabled if no changes (`src/components/admin/college-signin-method-form.tsx:58-70`)
- Fix: Show explicit unsaved state and match legacy Save availability after load.

## G2-4-031-024  [P2] GAP  facet F06  effort S
- Legacy: Form.Item label Sign-in methods plural (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:80,145`)
- vNext now: Heading/legend Sign-in method singular (`src/components/admin/college-signin-method-form.tsx:56-59`)
- Fix: Use exact plural label.

## G2-4-031-049  [P2] GAP  facet F13  effort S
- Legacy: Error still shows options but disables Save while loadError (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:138-140`)
- vNext now: Disables entire fieldset if DB migration pending/invalid (`src/components/admin/college-signin-method-form.tsx:57-70`)
- Fix: Match disabled actions with clear recovery path.

## G2-4-031-054  [P2] GAP  facet F16  effort S
- Legacy: Auto-fit 190px columns up to max640; card min sizes on mobile (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:46-75`)
- vNext now: Full-width stacked choice rows on mobile (`src/components/admin/college-signin-method-form.tsx:55-65`)
- Fix: Restore responsive card grid and 640px cap.

## G2-4-031-059  [P2] GAP  facet F18  effort S
- Legacy: Card heading Sign-in and form label Sign-in methods (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:133-146`)
- vNext now: Section heading Sign-in method (singular) (`src/components/admin/college-signin-method-form.tsx:55-59`)
- Fix: Use exact heading and plural label.

## G2-4-031-064  [P2] MISSING  facet F18  effort S
- Legacy: Reload button exact label Reload (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:136`)
- vNext now: No Reload; page has back link (`src/components/admin/college-signin-method-form.tsx:55-75`)
- Fix: Add Reload action.

## G2-4-031-075  [P2] MISSING  facet F23  effort S
- Legacy: Visual sketch previews which channel displays first (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:17-40`)
- vNext now: No preview of email vs phone tabs (`src/components/admin/college-signin-method-form.tsx:58-65`)
- Fix: Restore miniature login-tab sketch for all options.

## G2-4-031-009  [P3] GAP  facet F03  effort S
- Legacy: Default tag on first choice and second-line detail (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:65-70`)
- vNext now: Choice label contains (default), hints differ (`src/components/admin/college-signin-method-form.tsx:14-19`)
- Fix: Add separate Default tag and exact secondary copy.

## G2-4-031-014  [P3] GAP  facet F04  effort S
- Legacy: Choice names Email and phone/Phone and email/Email only/Phone only (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:10-13`)
- vNext now: Same names except first includes (default) in label (`src/components/admin/college-signin-method-form.tsx:14-19`)
- Fix: Display default badge not label suffix.

## G2-4-031-036  [P3] GAP  facet F09  effort S
- Legacy: Radio click immediately changes pending option (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:50-55`)
- vNext now: Radio changes and ConfirmDialog invoked on Save (`src/components/admin/college-signin-method-form.tsx:60-71`)
- Fix: Ensure keyboard selection and modal do not commit until confirmed.

## G2-4-031-055  [P3] GAP  facet F16  effort S
- Legacy: MethodSketch grows equal channel pill widths across cards (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:20-40`)
- vNext now: No sketch; choices full-width label/hint (`src/components/admin/college-signin-method-form.tsx:58-65`)
- Fix: Ensure method sketch at 375px does not clip.

## G2-4-031-058  [P3] GAP  facet F17  effort S
- Legacy: Save button disabled on load failure/fetch (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:149-150`)
- vNext now: Button disabled for readiness, busy, unchanged selection (`src/components/admin/college-signin-method-form.tsx:67-70`)
- Fix: Announce why Save disabled and retain form semantics.

## G2-4-031-061  [P3] GAP  facet F18  effort S
- Legacy: Choice detail Both, with email shown first. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:10`)
- vNext now: Hint Email first; phone also available (`src/components/admin/college-signin-method-form.tsx:15`)
- Fix: Match exact option detail.

## G2-4-031-062  [P3] GAP  facet F18  effort S
- Legacy: Choice detail Both, with phone shown first. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:11`)
- vNext now: Hint Phone first; email also available (`src/components/admin/college-signin-method-form.tsx:16`)
- Fix: Match exact option detail.

## G2-4-031-063  [P3] GAP  facet F18  effort S
- Legacy: Choice details Phone sign-in is turned off / Email sign-in is turned off. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:12-13`)
- vNext now: Only email one-time codes / Only phone one-time codes (`src/components/admin/college-signin-method-form.tsx:17-18`)
- Fix: Use exact explanatory copy.
