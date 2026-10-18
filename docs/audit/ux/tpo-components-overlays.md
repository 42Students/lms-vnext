# UX-tpo-overlay coverage — chat-2

All 28 TPO component overlay surfaces in the 2026-10-18 coverage matrix. Shared Dialog, Drawer, BottomSheet, and ConfirmDialog own labelled titles, native focus isolation, Escape/backdrop policy, opener focus return, viewport-safe scroll and reduced-motion styling. Confirmations preserve item-specific consequences; edits preserve validation and failure feedback. `tests/unit/chat2-UX-tpo-overlay-coverage.test.ts` contains an individually named case for each path, and `chat2-UX-tpo-overlay-01.test.ts` verifies shared behavior contracts.

| Component | Overlay | Workflow confirmation / accessibility evidence |
|---|---|---|
| `src/components/tpo/recruiter-lead-detail-workspace.tsx` | Dialog | `Discard unsaved recruiter changes?` |
| `src/components/tpo/tpo-after-college-bulk-editor.tsx` | Dialog | `Update after-college outcomes` |
| `src/components/tpo/tpo-after-college-editor.tsx` | Dialog | `Save after-college outcome` |
| `src/components/tpo/tpo-batch-class-decision.tsx` | ConfirmDialog | `Student overrides are not changed.` |
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | Drawer | `Import eligibility decisions` |
| `src/components/tpo/tpo-batch-inline-decision.tsx` | Dialog | `Mark learner ineligible` |
| `src/components/tpo/tpo-batch-invitation-control.tsx` | ConfirmDialog | `Remove the registration deadline?` |
| `src/components/tpo/tpo-batch-rule-editor.tsx` | ConfirmDialog | `Discard your unsaved batch-rule changes?` |
| `src/components/tpo/tpo-batch-student-saved-views.tsx` | ConfirmDialog | `Delete this saved batch view?` |
| `src/components/tpo/tpo-bell-panel.tsx` | Drawer | `Nothing yet` |
| `src/components/tpo/tpo-bulk-action-panel.tsx` | Dialog | `Share selected applicants with the company` |
| `src/components/tpo/tpo-company-create-form.tsx` | Dialog | `Confirm company creation` |
| `src/components/tpo/tpo-company-team-conversation.tsx` | ConfirmDialog | `Its ask is cancelled too.` |
| `src/components/tpo/tpo-find-shortcut.tsx` | Dialog | `Search records in your college.` |
| `src/components/tpo/tpo-keyboard-shortcuts.tsx` | Drawer | `Press a key, then the next one.` |
| `src/components/tpo/tpo-mobile-footer.tsx` | BottomSheet | `More TPO workspaces` |
| `src/components/tpo/tpo-new-followup-modal.tsx` | Dialog | `Discard this unfinished follow-up?` |
| `src/components/tpo/tpo-new-recruiter-conversation.tsx` | Dialog | `New message to a recruiter` |
| `src/components/tpo/tpo-notice-composer-dialog.tsx` | Dialog | `New announcement` |
| `src/components/tpo/tpo-public-join-link-card.tsx` | ConfirmDialog | `PUBLIC_JOIN_LINK_COPY.replaceExplanation` |
| `src/components/tpo/tpo-student-nudge-panel.tsx` | Dialog | `The message will be audited.` |
| `src/components/tpo/tpo-student-quick-panel.tsx` | Drawer | `Retry loading student details` |
| `src/components/tpo/tpo-student-saved-views.tsx` | Dialog | `Delete saved view` |
| `src/components/tpo/tpo-students-assign-prep.tsx` | Dialog | `Learners will be notified.` |
| `src/components/tpo/tpo-students-bulk-add.tsx` | Dialog | `Add selected students to a drive` |
| `src/components/tpo/tpo-students-bulk-debar.tsx` | Dialog | `Confirm bulk debarment` |
| `src/components/tpo/tpo-students-drive-visibility.tsx` | Dialog | `Confirm drive eligibility overrides?` |
| `src/components/tpo/tpo-timed-debar-control.tsx` | Dialog | `Confirm debarment` |

Additional reviewed surface: `src/components/tpo/recruiter-lead-csv-import.tsx` uses the shared native `Dialog`, safely guarded close while import is in progress, and two labelled vertical `ScrollCue` wrappers around responsive `DataTable` previews. Individual regression in `tests/unit/chat2-UX-tpo-recruiter-lead-import-scroll-01.test.ts`.

Caveat: static/source tests verify delegated shared primitive contracts, not complete browser tab-cycling. Browser automation should additionally verify focus return, Escape and mobile viewport for every affected workflow.
