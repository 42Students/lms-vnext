# Work packet: edit src/components/people/faculty-profile-editor.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md

## G2-1-003-005  [P1] GAP  facet F02  effort L
- Legacy: `ProfileSectionsPanel.js:54-69` includes Header, Identity Documents and Contact sections.
- vNext now: `faculty-profile-editor.tsx:92-135` excludes all 3; self profile overview shows identity fields read-only (`teacher/profile/page.tsx:11-47`).
- Fix: Provide secure read and managed-admin update for those sections with privacy controls and explicit edit restrictions.

## G2-1-003-058  [P1] GAP  facet F14  effort L
- Legacy: `FacultyProfileController.java:141-155,204-215,289-302` accepts image/identity storage refs, not binary multipart; UI fields `profileSectionSchemas.js:14-35`.
- vNext now: `faculty-profile-document.ts:302-319` uses private document receipt IDs; editor `faculty-profile-editor.tsx:92-135` has no file widgets.
- Fix: Add secure upload/download/preview for profile image and identity documents with ownership constraints and receipt binding.

## G2-20-030-006  [P1] GAP  facet F02  effort L
- Legacy: Single PageShell with header Profile, avatar and completeness, then two-column 13-section card grid (`docs/legacy-source/frontend/src/pages/teacher/profile.js:117-164`, `docs/legacy-source/frontend/src/components/profile/about.js:905-940`)
- vNext now: Overview 5-field description list and shortcuts; editor is separate flat vertical section stack (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`, `src/components/people/faculty-profile-editor.tsx:86-135`)
- Fix: Match legacy section layout, sequence, card hierarchy and same-route affordances

## G2-20-030-038  [P1] GAP  facet F06  effort L
- Legacy: Legacy offers contacts, metadata, social, experience, education, awards, publications, skills separate mutations (`docs/legacy-source/frontend/src/components/profile/about.js:295-659`, `docs/legacy-source/frontend/src/components/profile/about.js:774-817`)
- vNext now: New editor offers all except contacts and identity; saves entire versioned doc section (`src/components/people/faculty-profile-editor.tsx:92-135`, `src/modules/people/faculty-self-section-model.ts:25-35`)
- Fix: Reinstate missing contact/identity flows and verify parity per section

## G2-1-003-039  [P2] GAP  facet F08  effort S
- Legacy: `ProfileSectionsPanel.js:365-408` toasts `Saved`, `Removed`, `Added`; single edit toast `${label} updated` (`:266`).
- vNext now: `faculty-profile-editor.tsx:84-85` uses persistent success Alert from saved-status helper.
- Fix: Use legacy toast/announcement pattern where parity required, while retaining an accessible persistent success region.

## G2-20-030-042  [P2] GAP  facet F07  effort M
- Legacy: Legacy errors extract backend message and optionally show validation dialog (`docs/legacy-source/frontend/src/components/profile/about.js:277-289`)
- vNext now: New section error uses mapped symbol and page-level Alert (`src/components/people/faculty-profile-editor.tsx:50-68`, `src/components/people/faculty-profile-editor.tsx:78-85`)
- Fix: Map precise server field errors and preserve edit draft on failed save

## G2-20-030-044  [P2] GAP  facet F08  effort M
- Legacy: Legacy showSuccess generic 'Updated successfully!' duration 2s, error duration 4s, dispatches profileUpdated event (`docs/legacy-source/frontend/src/components/profile/about.js:267-274`)
- vNext now: New inline success and error Alerts persist per editor state, no profileUpdated event (`src/components/people/faculty-profile-editor.tsx:50-68`, `src/components/people/faculty-profile-editor.tsx:78-85`)
- Fix: Align timing and notifications or declare intentional toast replacement

## G2-20-030-046  [P2] GAP  facet F08  effort M
- Legacy: Legacy delete success 'Deleted successfully!' (`docs/legacy-source/frontend/src/components/profile/about.js:315-319`, `docs/legacy-source/frontend/src/components/profile/about.js:343-349`)
- vNext now: New repeatable deletions only take effect after section Save, new section-specific save status (`src/components/people/faculty-profile-editor.tsx:109-134`)
- Fix: Show appropriate legacy removal feedback at persisted delete time
