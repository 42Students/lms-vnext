# Work packet: edit src/components/college/college-admin-profile-editor.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-015  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:95-130: gender Select, DOB DD-MM-YYYY, blood group Select.
- vNext now: src/components/college/college-admin-profile-editor.tsx:88-101: Name, Role / Title, About, Photo URL instead.
- Fix: Implement exact gender/DOB/blood group fields with back-end persistence.

## G2-1-026-016  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:130-170: editable 10-digit primary mobile and alternate 10–15 digit phone.
- vNext now: src/components/college/college-admin-profile-editor.tsx:104-117: primary read-only, alternatePhone text.
- Fix: Add verified primary-contact change path and phone validation.

## G2-1-026-018  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/address.js:58-65,110-117: separate currentAddress and permanentAddress textareas.
- vNext now: src/components/college/college-admin-profile-editor.tsx:134-144: only one line1/line2 address schema.
- Fix: Preserve independent current/permanent addresses.

## G2-1-026-021  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/socialProfiles.js:169-200: Portfolio and Twitter URLs.
- vNext now: src/components/college/college-admin-profile-editor.tsx:127-130: Website and Instagram, no Twitter field.
- Fix: Define Portfolio mapping and add Twitter if still required.

## G2-1-026-026  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:97-130: selects Gender, Blood group; DatePicker DOB in DD-MM-YYYY.
- vNext now: src/components/college/college-admin-profile-editor.tsx:91-99: free text controls without those fields.
- Fix: Restore typed pickers/required/default policies.

## G2-1-026-031  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:941-946,1298-1301,1345-1349,1366-1369: per-card Edit Save Cancel.
- vNext now: src/components/college/college-admin-profile-editor.tsx:42-55,148-160: one whole-form submit Save profile.
- Fix: Provide card-local edit/cancel and non-lossy section update.

## G2-1-026-038  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:40-48, CT:38-47, SO:39-47, AD:26-35: 'Discard changes'/'Keep editing' cancel Modal.
- vNext now: src/components/college/college-admin-profile-editor.tsx:57-160: no Cancel control or confirmation Modal.
- Fix: Restore cancel and unsaved-discard confirmation.

## G2-1-026-039  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:117-140: beforeunload and routeChangeStart prompt 'Discard your unsaved profile changes?'.
- vNext now: src/components/college/college-admin-profile-editor.tsx:26-160: no unsaved browser/navigation guard.
- Fix: Track dirty fields and block navigation until user confirms.

## G2-1-026-069  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:117-140: dirty route guard protects drafts.
- vNext now: src/components/college/college-admin-profile-editor.tsx:42-55: no dirty guard, concurrent tabs save unconditionally.
- Fix: Add unsaved guard and document CAS conflict handling.

## G2-1-026-037  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:77-79 and section handlers: messageApi toasts for updates.
- vNext now: src/components/college/college-admin-profile-editor.tsx:149-153: inline 'Profile updated successfully.' after global PATCH.
- Fix: Compare exact section success toast wording and position live.
