# Work packet: edit src/components/tpo/tpo-new-followup-modal.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-035  [P1] GAP  facet F06  effort M
- Legacy: Legacy recruiter selection remote-searches globalSearch after 2 characters (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:55-71`)
- vNext now: vNext fetches full lead list when dialog opens (`src/components/tpo/tpo-new-followup-modal.tsx:56-67`)
- Fix: Use paged remote recruiter lookup with stale-response protection

## G2-5-012-037  [P1] GAP  facet F06  effort M
- Legacy: Legacy When picker D MMM YYYY h:mm A at 5-minute increments (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:143-157`)
- vNext now: vNext new dialog uses native datetime-local and week hour slot (`src/components/tpo/tpo-new-followup-modal.tsx:119-122`)
- Fix: Allow 5-minute selection and match display format

## G2-5-012-038  [P1] GAP  facet F06  effort S
- Legacy: Legacy picker disallows past day and validates date-time strictly after now (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:143-157`)
- vNext now: vNext New dialog only validates nonempty before POST; week slot checks future (`src/components/tpo/tpo-new-followup-modal.tsx:70-83`)
- Fix: Apply future-time validation to all create paths, with exact field error

## G2-5-012-097  [P1] GAP  facet F20  effort M
- Legacy: Legacy invalid future date prevented in datetime picker (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:143-156`)
- vNext now: vNext modal checks future only in week editor not other entry (`src/components/tpo/tpo-new-followup-modal.tsx:70-83`)
- Fix: One validation schema for all flows and exact now boundary

## G2-5-012-043  [P2] GAP  facet F07  effort S
- Legacy: Legacy recruiter search error headline Recruiter search unavailable (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:62-70`)
- vNext now: vNext fetch failure returns Could not load recruiters (`src/components/tpo/tpo-new-followup-modal.tsx:59-66`)
- Fix: Preserve exact field-level search error plus retry

## G2-5-012-046  [P2] GAP  facet F08  effort M
- Legacy: Legacy save failure shows inline alert Follow-up was not saved and error toast (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:86-90`)
- vNext now: vNext only InlineNotice Could not save the follow-up (`src/components/tpo/tpo-new-followup-modal.tsx:79-89`)
- Fix: Render matching alert and toast once each on failure

## G2-5-012-045  [P3] GAP  facet F08  effort S
- Legacy: Legacy success toast Follow-up added (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:86-95`)
- vNext now: vNext toast adds description It shows on the calendar (`src/components/tpo/tpo-new-followup-modal.tsx:84-88`)
- Fix: Drop nonlegacy description for exact toast parity
