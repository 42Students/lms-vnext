# Work packet (wave 2): edit src/components/people/faculty-profile-repeatable.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-008  [P2] GAP  facet F03  effort S
- Legacy: `ProfileSectionsPanel.js:445-446` uses `Popconfirm` 'Remove this entry?' and destructive red remove icon.
- vNext now: `faculty-profile-repeatable.tsx:129-136` uses reusable confirm text with row number, disabled for managed receipts.
- Fix: Preserve legacy icon/red warning and title wording; keep receipt protection.

## G2-1-003-023  [P2] GAP  facet F05  effort M
- Legacy: `ProfileSectionsPanel.js:445-447` Remove performs immediate DELETE, then reload.
- vNext now: `faculty-profile-repeatable.tsx:129-157` removal is draft until section Save; list may reject removal of managed receipt.
- Fix: Display clear unsaved state and confirm draft deletion, documenting new two-step semantics.

## G2-1-003-041  [P2] GAP  facet F09  effort M
- Legacy: `ProfileSectionsPanel.js:205-317` single inline Edit expands forms; `:318-469` list inline Add and Edit; Remove popconfirm.
- vNext now: `faculty-profile-repeatable.tsx:63-157` shows inline editable array and same-level Add/Save, with multiple confirm interactions.
- Fix: Recreate legacy collapsed read→edit states and explicit per-row editing controls, without losing staged saving.

## G2-1-003-063  [P2] GAP  facet F16  effort M
- Legacy: `ProfileSectionsPanel.js:130-162,205-317` AntD responsive form/description grids and compact inline buttons.
- vNext now: `faculty-profile-repeatable.tsx:63-157` mobile stacked min-h-11 controls, wider desktop; `faculty-profile-editor.tsx:86-91` horizontally scrollable nav.
- Fix: Live compare desktop/tablet/375px cards and form label stacks; preserve accessible hit targets.

## G2-1-003-072  [P2] GAP  facet F20  effort S
- Legacy: `ProfileSectionsPanel.js:374-408` Add/Delete list mutation takes place immediately after click.
- vNext now: `faculty-profile-repeatable.tsx:129-157` records draft until a save and can discard.
- Fix: Make pending persisted vs draft state unambiguous for repeated clicks and tab closure.

## G2-1-003-020  [P3] GAP  facet F04  effort S
- Legacy: `ProfileSectionsPanel.js:148-160` displays empty field fallback em dash and no data 'Nothing on file yet.'
- vNext now: `teacher/profile/page.tsx:41` overview empty fallback 'Not provided'; `faculty-profile-repeatable.tsx:63-157` no legacy summary fallback in list.
- Fix: Align empty-value copy ('—' and 'Nothing on file yet.') by section while preserving accessible state.
