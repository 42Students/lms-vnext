# UI/UX polish — lane 16

## 1. `src/components/academics/academics-actions.tsx` — Academic actions and edit/confirmation overlays

**Problems found (8):**
1. Program row displayed both Edit and Archive as competing actions, including an inactive destructive option.
2. Planned academic-period row gave Edit and lifecycle Activate the same prominence.
3. Planned cohort row exposed Edit, Activate and Archive side by side, causing width pressure and unclear priority.
4. Section row displayed Open, Edit and Archive equally, wrapping at phone widths.
5. Thirteen field labels were separate siblings rather than associated wrappers, with inconsistent label and field spacing.
6. The optional department field preceded the program's core name, code and duration fields.
7. Cohort form stayed one long column on tablet/desktop; expected-end selector was not visually grouped beneath the pair of primary fields.
8. Dialog action footers could crowd or wrap unpredictably on phones, with Save visually following Cancel.

**Polish applied:** One clear inline action per row with less-common lifecycle or edit actions in the existing shared Dropdown + Menu/MenuItem. The same Archive/Edit/Activate labels, disabled rules, confirmation dialogs, callbacks, permissions and mutation routes remain in place. The menu uses the shared native keyboard/Escape/disclosure implementation and a full-width mobile sheet. Linked all 13 previously detached visible labels with their controls, standardized the Department label to the existing LMS field rhythm, and moved that optional field below Program name, Code and Duration. Reorganized the cohort edit layout to one column on phones and two at tablet width, with the expected-end selector spanning the row. All four edit dialogs use a shared responsive footer grouping that places Save first on narrow screens, keeps Cancel then Save on wider screens, and aligns controls. The existing Dialog/ConfirmDialog, Input/Select, Button, Toast, loading, pending, confirmation, error and discard flows remain in use. Source-inspected responsive 375/768 and desktop structure, not browser-verified; no CI.

**Files changed:** `src/components/academics/academics-actions.tsx`, `docs/orchestrator/queues/clone/lane-16-polish.md`, `docs/audit/ux/polish-lane-16.md`.
