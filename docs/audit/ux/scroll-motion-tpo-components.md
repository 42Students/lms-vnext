# UX scroll & motion pass — TPO components (chat-2)

Global scrollbars are hidden; do not restore them. Shared `ScrollCue` detects actual horizontal/vertical overflow, adds conditional edge fades, enables focus only when scrollable, supports overscroll containment, observes size and content changes. Shared native dialogs provide visualViewport-safe height, background lock and focus behavior. No custom motion durations introduced; global motion tokens and reduced-motion policy remain authoritative.

| Component | Container or overlay | Change / visual overflow cue |
|---|---|---|
| `src/components/tpo/tpo-spreadsheet-grid.tsx` | Wide desktop table | horizontal ScrollCue; keyboard-focusable edge fades, sticky optional columns, mobile cards |
| `src/components/tpo/tpo-builtin-job-types-editor.tsx` | Job types table | DataTable shared horizontal cue, mobile action column, empty copy |
| `src/components/tpo/tpo-bell-panel.tsx` | Notifications Drawer | single parent Drawer scroll; no nested scrollbar; 44px footer actions |
| `src/components/tpo/tpo-company-team-conversation.tsx` | Message log | vertical ScrollCue labelled Company Team message history |
| `src/components/tpo/tpo-student-quick-panel.tsx` | Student drawer and history | shared Drawer, sticky previous/next footer, remove nested history scroll, responsive cards |
| `src/components/tpo/tpo-notice-composer-dialog.tsx` | Announcement modal | shared Dialog: visual viewport scroll/focus + native backdrop and Escape |
| `src/components/tpo/tpo-mobile-footer.tsx` | Mobile More overlay | shared BottomSheet with safe-area padding + focus and accessible dismiss |
| `src/components/tpo/tpo-company-create-form.tsx` | Add company form | shared Dialog with preserved review/confirm and friendly errors |
| `src/components/tpo/tpo-company-memory-workspace.tsx` | Drives history table | DataTable + accessible role link; mobile cards/More details |
| `src/components/tpo/tpo-academic-import-workspace.tsx` | CSV preview table | DataTable preserves selection and row match checks, 320px mobile cards |
| `src/components/tpo/tpo-student-nudge-panel.tsx` | Long learner selection list | vertical ScrollCue with truthful edge fades |
| `src/components/tpo/tpo-students-bulk-debar.tsx` | Confirmation + result list | single Dialog scroll; vertical ScrollCue on batch results |
| `src/components/tpo/tpo-bulk-action-panel.tsx` | Selection and link-review list | two labelled vertical ScrollCues |
| `src/components/tpo/tpo-students-drive-visibility.tsx` | Confirmation list | remove inner scroll; single Dialog content scroll |
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | Drawer preview list | remove inner paged scroller; Drawer owns scroll |
| `src/components/tpo/recruiter-lead-csv-import.tsx` | Import preview and result tables + modal | Shared Dialog, two DataTables and separate labelled vertical ScrollCues; includes group empty copy, row opt-in, 44px targets |
| `src/components/tpo/recruiter-lead-detail-workspace.tsx` | Edit and Not-now modals | replace two bespoke overlays with shared Dialog; discard guards intact |

Regression tests: `tests/unit/chat2-UX-tpo-scroll-motion-01.test.ts`, `tests/unit/chat2-UX-tpo-overlay-01.test.ts`, `tests/unit/chat2-UX-tpo-overlay-coverage.test.ts`. Pending: dedicated browser tests for scroll detection, focus and motion; regression suite not runnable through this GitHub connection.

**Specialized table exception to evaluate with the shared-kit owner:** `src/components/tpo/tpo-spreadsheet-grid.tsx` retains a semantic desktop `<table>` to preserve adjustable pinned columns and select/open interactions. It now uses labelled horizontal `ScrollCue` edge fades and a distinct small-screen card list. Replacing its table directly with `DataTable` would remove pinned-column behavior; no permission to waive the raw-table policy is assumed.
