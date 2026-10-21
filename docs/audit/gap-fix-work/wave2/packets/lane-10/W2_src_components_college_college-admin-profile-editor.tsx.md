# Work packet (wave 2): edit src/components/college/college-admin-profile-editor.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:915-956,1292-1312,1340-1384: UserInfo then Personal, Social, Address, Contacts.
- vNext now: src/components/college/college-admin-profile-editor.tsx:59-146: profile banner, nav, Personal, Contacts, Social, Address.
- Fix: Reorder four sections and preserve two-column card design.

## G2-1-026-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:937-956,1293-1312,1341-1384: AntD Cards xs24 xl12 gutter20 with pale blue headers.
- vNext now: src/components/college/college-admin-profile-editor.tsx:87-145: unboxed sections with md field grid.
- Fix: Build standalone Card sections with blue header accent and 20px gutters.

## G2-1-026-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:941-946,1298-1301,1345-1349,1366-1369: each card has pencil Edit.
- vNext now: src/components/college/college-admin-profile-editor.tsx:88-145: all inputs editable; no pencil actions.
- Fix: Restore per-card Edit control and read-only default.

## G2-1-026-013  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:917-924: UserInfo profile photo upload pencil.
- vNext now: src/components/college/college-admin-profile-editor.tsx:60-71: image display and view link; photo updated as HTTPS URL text.
- Fix: Provide signed avatar upload or approved replacement.

## G2-1-026-017  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:218-228: editable contact email.
- vNext now: src/components/college/college-admin-profile-editor.tsx:104-111: primary email read-only and Additional email separate.
- Fix: Preserve equivalent contact-email action using verified update.

## G2-1-026-019  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/address.js:70-91: City, State, Pincode.
- vNext now: src/components/college/college-admin-profile-editor.tsx:137-142: City, State, Postal code, plus Country.
- Fix: Map pincode to postalCode and match legacy label.

## G2-1-026-022  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/socialProfiles.js:215-223: coding-profile platforms/username map.
- vNext now: src/components/college/college-admin-profile-editor.tsx:120-131: fixed URL fields only.
- Fix: Add platform username map or approved removal.

## G2-1-026-023  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/socialProfiles.js:237-268: Google Scholar and ResearchGate for faculty.
- vNext now: src/components/college/college-admin-profile-editor.tsx:120-131: neither link exists.
- Fix: Resolve compact admin faculty flag and map academic links.

## G2-1-026-027  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:138-140: primary mobile 10 max inputMode tel.
- vNext now: src/components/college/college-admin-profile-editor.tsx:104-116: primary readonly and generic field max500.
- Fix: Use verified primary update and max10 with numeric feedback.

## G2-1-026-028  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:167-169: alternate phone maxLength15 and tel inputMode.
- vNext now: src/components/college/college-admin-profile-editor.tsx:113-114: text field maxLength500, server max40.
- Fix: Set type=tel and field-specific 15-char cap.

## G2-1-026-030  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/address.js:58-65,110-117: current/permanent textareas rows2.
- vNext now: src/components/college/college-admin-profile-editor.tsx:137-143: single-line text inputs.
- Fix: Restore separate multiline fields.

## G2-1-026-042  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:153-156: per-section ProfileService actions and partial refresh.
- vNext now: src/components/college/college-admin-profile-editor.tsx:47-52: PATCH /api/college/profile sends all profile fields.
- Fix: Use scoped incremental updates with optimistic version to prevent overwrites.

## G2-1-026-053  [P2] GAP  facet F14  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:917-924: avatar pencil upload; about.js:28,31-34 file presign and image/link import.
- vNext now: src/components/college/college-admin-profile-editor.tsx:98-99: secure photo URL input, upload absent.
- Fix: Use existing signed upload APIs and size/type validation.

## G2-1-026-056  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:937-956,1292-1384: Col xs24 xl12 and gutter20, cards stack until XL.
- vNext now: src/components/college/college-admin-profile-editor.tsx:90-145: md field grid inside full-width sections.
- Fix: Preserve breakpoint and responsive card layout.

## G2-1-026-062  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:141 'Profile'; A:938 'Personal Details', 1297 'Social Profiles', 1345 'Address', 1366 'Contacts'.
- vNext now: src/components/college/college-admin-profile-editor.tsx:77-79 same section names but order Personal, Contacts, Social, Address.
- Fix: Reorder labels/sections exactly.

## G2-1-026-063  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:138,167,225: placeholders 'Primary Mobile Number (10 digits)', 'Alternate Phone (Optional, 10-15 digits)', 'Contact Email'.
- vNext now: src/components/college/college-admin-profile-editor.tsx:104-116 uses 'Additional phone'/'Additional email' no placeholders.
- Fix: Clone field labels and hint strings.

## G2-1-026-064  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/address.js:63,115: 'Current Address' and 'Permanent Address'; AD:90 'Pincode'.
- vNext now: src/components/college/college-admin-profile-editor.tsx:138-142 'Address line 1', 'Address line 2', 'Postal code'.
- Fix: Use legacy address names and separate meaning.

## G2-1-026-010  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:38,941-945: CardHeader accent #BDE9FA.
- vNext now: src/components/college/college-admin-profile-editor.tsx:88-145: basic headings no accent.
- Fix: Apply exact pale-blue card header background.

## G2-1-026-029  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/socialProfiles.js:123-194: per-site URL example placeholders and prefix icons.
- vNext now: src/components/college/college-admin-profile-editor.tsx:123-130: URL controls without placeholder/prefix.
- Fix: Clone exact placeholders and social icons.

## G2-1-026-059  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:153: aria-busy=loading on profile content.
- vNext now: src/components/college/college-admin-profile-editor.tsx:57-160: no aria-busy on form while saving.
- Fix: Expose aria-busy and announce saving.
