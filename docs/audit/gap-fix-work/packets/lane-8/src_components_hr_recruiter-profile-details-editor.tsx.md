# Work packet: edit src/components/hr/recruiter-profile-details-editor.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-1/recruiter-profile.md

## G2-11-031-023  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:106-108: INVALID_MOBILE maps directly to contactMobile field and 'Check the mobile number.'
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:61-71: generic save feedback; no per-field errors.
- Fix: Bind Zod/server field errors to matching control.

## G2-1-035-063  [P1] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:158-175: AntD Form validation moves focus to invalid field.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:74-91: native form no HTML required, server-only schema checks.
- Fix: Set firstName required, native constraints and aria-invalid field feedback.

## G2-1-035-035  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:157: 'Profile was not saved' error Alert with description.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:91: plain text error under form with no heading/icon.
- Fix: Restore error Alert title, description and showIcon.

## G2-1-035-039  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:150: orange 'Unsaved changes' Tag shown when dirty.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:89: inline text, same content but not tag.
- Fix: Match badge style.

## G2-11-031-026  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:103: success toast 'Profile saved'.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:70-91: inline Profile saved.
- Fix: Align toast placement/duration.

## G2-1-035-038  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:103: AntD toast 'Profile saved'.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:70,91: inline role=status 'Profile saved'.
- Fix: Align toast location/duration.
