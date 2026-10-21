# Work packet (wave 2): edit src/components/hr/recruiter-profile-details-editor.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-1/recruiter-profile.md

## G2-11-031-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:159-175: two-column name then mobile/designation full width.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:75-90: all fields two-col >=768.
- Fix: Match legacy grid/focus order.

## G2-11-031-036  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:115-139: loading Skeleton and fatal Retry separate from save state.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:48-73: save errors retain draft.
- Fix: Add recoverable profile load state.

## G2-11-031-048  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:84: validateFields runs client-side before network call.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:48-61: sends form, server validates after request.
- Fix: Add client validation before request.

## G2-1-035-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:150: orange Tag 'Unsaved changes' in ListingPageHeader.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:89: warning text Unsaved changes by Save button.
- Fix: Match orange tag shape/location.

## G2-1-035-016  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:160-172: user.firstName, lastName, contactMobile, designation all editable.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:76-82: same four fields, first/last derived from displayName.
- Fix: Verify compound-name split/join retains given/surname distinctions.

## G2-1-035-027  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:167-169: Mobile input tel with maxLength14, optional helper.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:76-84: phone max14, helper only in collapsed About these details P:29-33.
- Fix: Place mobile helper directly under field.

## G2-1-035-028  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:170-171: Designation maxLength150.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:79 and V:6: designation/title max160.
- Fix: Use original 150-character client/server cap.

## G2-1-035-032  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:160-166: firstName and lastName side-by-side, mobile/designation below.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:75-82: grid 2 columns at 768px for all 4 (designation and mobile beside).
- Fix: Restore first/last row, then full-width mobile and designation.

## G2-1-035-040  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:64-76: browser routeChangeStart confirms 'Discard your unsaved profile changes?'.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:28-46,92-97: browser unload warning; ConfirmActionDialog on clicked links.
- Fix: Cover Next programmatic navigation/popstate, not only click anchors.

## G2-1-035-045  [P2] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:96-100: update loginUser Redux display name on save.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:68-70: router.refresh() after saved response; session identity may remain stale in navbar.
- Fix: Verify shell header updates canonical name without session re-login.

## G2-1-035-073  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:58-76: handles router events for unsaved prompt.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:31-45: click interception does not catch keyboard/programmatic router navigation.
- Fix: Implement robust route-change guard including browser history.

## G2-1-035-031  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:158: requiredMark optional labels.
- vNext now: src/components/hr/recruiter-profile-details-editor.tsx:74-82: custom labels no 'optional' visual required marks.
- Fix: Match AntD optional marker treatment.
