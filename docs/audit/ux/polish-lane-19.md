# UI/UX polish — chat-19

## Surface 1 — `src/components/tpo/tpo-batch-eligibility-import.tsx`

**Problems found (16):** (1) launcher sat on a separate line from its heading; (2) duplicate heading inside drawer; (3) redundant Close button beside the built-in drawer close; (4) dense CSV format paragraph took priority over the task; (5) template link competed with uploading; (6) seldom-used raw CSV editor was permanently expanded; (7) preview and confirm actions competed as separate buttons; (8) the main confirmation was offscreen after the preview table; (9) file replacement, discard, and copy controls were scattered; (10) pagination showed even for one page; (11) pagination wrapped unevenly; (12) an empty filtered preview gave no direct recovery; (13) errors/success feedback were far from the step that caused them; (14) skip actions were cramped on a 375px row; (15) acknowledgement text and checkbox aligned poorly; (16) long selected filenames could overflow.

**Removed, merged, moved and realigned:** Reflowed the launch row with a mobile full-width button and desktop right-aligned action; removed the extra title and Close (the Drawer supplies both); collapsed CSV schema guidance, template/Excel instructions, and raw CSV paste into keyboard-accessible native disclosures while preserving their original copy; retained one sticky Drawer footer CTA (Preview import before review, Confirm matched decisions afterward) with loading/disabled validation, moving re-preview, Choose another file, Discard review and Copy preview outcomes CSV into a secondary More actions disclosure; placed progress and match counts above the table, kept tabs, made the empty state switch back to All, suppressed unnecessary one-page navigation, and aligned Previous/Page/Next without wrapping; moved errors and success notices beside the active step using the existing InlineNotice; retained Undo after successful submission, all confirmation/skip rules, API routes, file size/type restrictions, row indices and callbacks; used full-width mobile skip/launch/footer controls, min-width-safe text and filename wrapping, 44px mobile touch targets and existing legacy font, colour, radius, gap, border and button tokens. The shared Drawer, FileUpload, Tabs, DataTable, Checkbox, Button, ConfirmDialog, ScrollCue and undo child were read for loading, error, focus, disabled, empty, long-row, 375px mobile and 768px tablet behavior; no shared changes or new dependencies.

**Files changed:** `src/components/tpo/tpo-batch-eligibility-import.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

**Rebase-only preservation:** src/components/college/college-admin-profile-editor.tsx and src/components/college/college-faculty-schedule-reassign.tsx retain other lanes' newer layout, loading, and mobile changes while restoring only this lane's previously audited 13px/600/16px, neutral-400 label and 6px field-gap lines. This rebase reconciliation is not another polished surface.

**Verification:** source-level check of JSX tag balance and existing imports/ids/routes/permissions/ARIA/behavior; no CI, runtime or side-by-side browser screenshots executed. Legacy tokens unchanged.

## Surface 2 — `src/components/tpo/tpo-batch-inline-decision.tsx`

**Problems found (9):** Override select and reason picker competed for narrow horizontal space; the reason could overflow; modal instructions repeated the title block rather than occupying its description position; confirmation controls sat inside the scrollable modal content; primary and secondary modal actions could cramp on 375px; invalid feedback appeared before the operator typed; review checkbox text was vertically misaligned; Save control stayed narrow on phone; feedback notices were flex items and could squeeze beside buttons.

**Fixed:** Kept the eligibility decision, labels, audit acknowledgement, reason presets, freeform reason, save and undo behavior intact. The learner selector and reason now claim full phone width and share the row only where appropriate on tablet; moved existing modal guidance into Dialog.description and existing Cancel/Use reason controls into the sticky Dialog.footer; kept the existing primary/secondary wording and validation gate; error appears after invalid freeform entry; review checkbox aligns with first line; Save fills mobile width; feedback spans the row and the freeform reason wraps. Examined shared Dialog, Button, InlineNotice, Select, Textarea, FilterChip, Checkbox and child TpoBatchUndoControl; retained modal close behavior, API route, guarded action and router refresh. Code-only reasoning for empty, validation, loading, disabled, error, success, 375px and 768px; runtime/browser checks not run.

**Files changed:** `src/components/tpo/tpo-batch-inline-decision.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 3 — `src/components/tpo/tpo-bell-panel.tsx`

**Problems found (10):** Three footer actions had similar visual priority; actions wrapped unpredictably; narrow drawer footers squeezed the navigation link; notification entries were bordered cards within the pane; extra outer item margins created uneven rows; text/title overflow risk; the date grouping lacked breathing room; fast refresh had no clear location in the hierarchy; desktop popover scrolling lacked overscroll containment; empty/error feedback could compress at small widths.

**Fixed:** Kept all notification IDs, read/unread semantics, 20-item grouping, timestamps, mark-as-read API calls, link targets, polling, keyboard dismissal and breakpoint-dependent Drawer/Popover. Made See all notifications the one prominent footer action; Mark all read remains secondary and Refresh ghost, all full-width on phone and aligned at 768px. Replaced decorative card-per-notification chrome with hairline-separated list rows, consistent legacy gutters, wrapped titles and content, clearer date headings and overscroll containment. Reviewed Drawer, PopoverPanel, Button and topbar.module.css for open/closed, refreshing, initial empty, request failure, pending/disabled, focus, 375px mobile and 768px tablet; source-only verification, no CI or browser run.

**Files changed:** `src/components/tpo/tpo-bell-panel.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 4 — `src/components/tpo/tpo-bulk-action-panel.tsx`

**Problems found (17):** Selection status and select-all CTA were disconnected; two long selection methods permanently open; roll-number paste and its help crowded the default action area; row-selection list had uneven gaps; selection tools occupied a second action row even when unused; mobile buttons did not stack; Action/Review field controls were not full-width; reason presets started immediately under the label; action counts and preview each competed with the primary task; duplicate Other actions section heading; share options expanded on every visit; share confirmation footer was cramped on mobile; the share URL had no safe width; suggested Do it competed with the main Preview primary; Preview remained visible beside the confirm in a review state; the preview child used h2 nested below the parent; next-batch CTA could be narrow at 375px.

**Fixed:** Paired the selected count and Act on all into a responsive toolbar; moved rarely used paste-by-roll and selection utilities into independently keyboard-operable Disclosures; retained exact select/copy/cancel actions and all IDs/limits. Used flush row dividers and consistent padding for the scrollable selection, aligned inputs and presets, moved share/review tools behind an Other actions disclosure, and placed share confirmation controls in the shared Dialog footer with stacked 44px buttons on phone. Showed only the appropriate primary CTA per phase (Preview initially, Confirm in preview child, Preview next batch after outcomes); kept the Suggested action as secondary without changing its preview behavior. Improved mobile widths, shared tokens and nested preview heading. Read the shared ScrollCue, Disclosure, Dialog, Button, Select, Input, Checkbox, Textarea, InlineNotice, TpoSelectedReviewQueue and TpoBulkActionPreview; considered empty, large selections, pending/errors, skipped rows, undo, confirmation, focus, 375px and 768px. Code inspected only, no runtime/CI.

**Files changed:** `src/components/tpo/tpo-bulk-action-panel.tsx`; `src/components/tpo/tpo-bulk-action-preview.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 5 — `src/components/tpo/tpo-company-create-form.tsx`

**Problems found (11):** Extra Company details heading duplicated the dialog title; a second Cancel button competed with the built-in close; the explanatory paragraph repeated the description; optional technical fields were permanently expanded; action button lived at the end of scrolling form content; submit and Cancel lacked stable footer alignment; mobile launcher and footer actions were narrow; form lacked a stable association with dialog footer; request errors were visually weak; long domain/url text could squeeze; review text could overflow on narrow screens.

**Fixed:** Retained two-step review/confirmation, original button and field wording, native URL validation, API request, guards and navigation. Removed duplicate title/Cancel in the body; kept one succinct explanation and moved rarely used website/domain controls into accessible Disclosure without removing their values or validation; tied the existing submit handler to the footer primary button with React useId form id; grouped Cancel and submit in shared Dialog footer, full-width 44px phone buttons and desktop right alignment. Promoted errors to InlineNotice, ensured field width and review text wrapping, kept Dialog close semantics and progress/disabled state. Reviewed shared Dialog, Button, Input, Disclosure and InlineNotice for empty, filled, invalid, reviewing, pending, failure, focus, 375px and 768px. No runtime/CI, code inspection only.

**Files changed:** `src/components/tpo/tpo-company-create-form.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 6 — `src/components/tpo/tpo-find-shortcut.tsx`

**Problems found (9):** Long global-find launcher cramped small screens; search field could inherit constraining width; a second bordered, shadowed listbox looked like a card inside the dialog; Recent heading had an interactive listbox hierarchy; long result titles were truncated even when a group occupied space; groups could collide with names at 375px; an initial no-results message could appear alongside a fetch error; keyboard hints and full-search action wrapped awkwardly; full-search link had a small mobile target.

**Fixed:** Kept existing shortcuts, server-backed search, ARIA combobox/option IDs, result order, recent records, keyboard navigation, route pushes and wording. Made launcher and input fluid; flattened the nested listbox surface without changing its shared keyboard functionality; made recent heading presentational, result labels wrap while retaining their group; showed error without a simultaneous misleading empty state; stacked footer hint/link with a full-width 44px mobile action, aligned in one row at 768px. Reviewed Dialog, PopoverListbox, Button, Input and Alert states including loading, no recent, no results, error, focus, active option and closed/open; source inspection only, no CI or browser run.

**Files changed:** `src/components/tpo/tpo-find-shortcut.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 7 — `src/components/tpo/tpo-keyboard-shortcuts.tsx`

**Problems found (8):** Navigation shortcuts were bare text with inconsistent spacing; plain keyboard labels did not form recognizable keycaps; ten Go to items could be difficult to scan; four section headings and content had uneven gaps; text was not aligned against a stable left edge; longer role labels could crowd key pairs on 375px; shortcut trigger needed a reliable touch width; miscellaneous shortcuts used inconsistent presentation.

**Fixed:** Preserved all G/N, Ctrl-K, ?, applicant keys and their original labels/route mapping. Rendered shortcuts as simple accessible lists with uniform keycaps using existing canvas-border, neutral surface, radius and typography tokens, 44px-high hairline-separated rows, consistent section dividers, one-column phone/two-column tablet navigation, wrapping labels and an 44px mobile trigger. Did not introduce decorative cards or new interaction; inspected shared Drawer and Button for open/dismiss, focus, scroll, touch and responsive behavior. Source-only verification; no CI/browser run.

**Files changed:** `src/components/tpo/tpo-keyboard-shortcuts.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 8 — `src/components/tpo/tpo-new-followup-modal.tsx`

**Problems found (10):** Optional note consumed permanent height in a short follow-up form; Cancel/Add buttons sat inside scrolled content and could disappear below a keyboard; footer actions inherited bespoke sizing and hard-coded radius; mobile actions were not guaranteed full-width; the form had no stable association with a sticky dialog footer; an empty recruiter list appeared indistinguishable from an unloaded selector; recruiter-loading failures had no in-dialog recovery; conditional validation and error feedback competed with button group; inputs/labels were dense when the keyboard occupied the viewport; the discard confirmation could compete with the form on small screens.

**Fixed:** Preserved recruiter/date validation, IST conversion, draft-leave protection, reset, API save, calendar toast, and the existing ConfirmDialog. Added one form id for Dialog.footer submission; moved Cancel/Add to the existing shared footer with a clear primary action, 44px phone targets and token-based radius. Collapsed the optional note into a keyboard-accessible Disclosure while retaining its field, characters and value. Added an accurate empty recruiter state and a retry when loading fails, kept InlineNotice local to the form. Read Dialog, ConfirmDialog, Button, Select, Input, Textarea, Disclosure, InlineNotice and Toast for loading/saving, invalid input, draft discard, success/error, touch width 375px and tablet width 768px; code-only, no CI or browser run.

**Files changed:** `src/components/tpo/tpo-new-followup-modal.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 9 — `src/components/tpo/tpo-new-recruiter-conversation.tsx`

**Problems found (10):** Message CTA shared a row width without mobile guarantee; dozens of quick-reply chips could dominate the composer; empty recruiter state was a second h2 inside a modal; missing recruiter guidance appeared after all the fields; form actions scrolled away with the body; fixed-width Cancel/Send actions could crowd a 375px sheet; repeated raw radius/border styling added density; inputs stayed editable during network send; quick replies and message had weak separation; failed send created a recovery link below a wall of controls.

**Fixed:** Preserved recruiter selection, cached draft, 4000-character budget, quick-reply strings, Enter/Ctrl/Shift behavior, thread create/send sequence, retry/Open conversation, routes and copy. Moved quick replies to native Disclosure after recruiter selection; replaced a huge nested EmptyState heading with concise InlineNotice near the recruiter field; moved Discard draft and Send into shared Dialog footer with a stable form association, full-width touch targets on phone and inline desktop layout. Disabled changing recruiter/message while sending, retained accessible labels, progress/loading and guarded network flow, and tightened mobile width. Reviewed Dialog, Button, Select, Textarea, Disclosure and InlineNotice across missing recruiter, draft restore, pending, validation, failure/partial creation, success, focus and 375/768. No runtime or CI.

**Files changed:** `src/components/tpo/tpo-new-recruiter-conversation.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 10 — `src/components/tpo/tpo-notice-composer-dialog.tsx`

**Problems found (5):** Announcement dialog overrode the shared 16px mobile side gutter with an 8px edge gap; form children could crowd the width; long URL/message inputs could exceed the visual content rail; an announcement launcher in a narrow header needed reliable sizing; the edit/new modal used inconsistent mobile and desktop body padding.

**Fixed:** Preserved original New/Edit wording, launch state, initialOpen on targeted URLs, focus/dismissal, child forms, POST routes, audience-preview GET and draft-restore semantics. Returned Dialog to the shared responsive viewport gutter and consistent legacy canvas padding, constrained descendant form and field widths, hid stray horizontal over-scroll without changing vertical scrolling or form behavior, and gave the launcher fluid mobile layout with a 44px target. Inspected the announcements page (new and edit children), TpoNoticeAudiencePicker, TpoNoticeDraftGuard, TpoNoticeScheduleControls and shared Dialog/Button for long form content, audience preview, targeted storage error, invalid input, edit/save, tablet and phone. No runtime/CI; source-level verification only.

**Files changed:** `src/components/tpo/tpo-notice-composer-dialog.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 11 — `src/components/tpo/tpo-notice-delete-confirm.tsx`

**Problems found (8):** Destructive action form appeared as an extra interior button row rather than the dialog footer; top margin created unexplained blank content; Delete and Cancel wrapped unpredictably; 375px actions could fit side-by-side too narrowly; buttons did not surface in-flight work; no visible busy state despite the synchronous duplicate-request latch; an extraneous JSX expression wrapper added noise; the dialog could display an unnecessary empty scroll-body band.

**Fixed:** Kept the exact alertdialog title, description, version/DELETE hidden fields, lifecycle POST route, confirmed destructive label and refocus/dismiss behavior. Placed the native form and its hidden inputs in shared Dialog.footer, removed the empty interior padding, aligned Cancel/Delete in a safe stack on phone with 44px controls and right-aligned at tablet width, added a pending state and loading/disabled feedback while preserving the existing synchronous submission latch. Reviewed shared Dialog and Button for keyboard, escape, pending, navigation and mobile/768 layout; inspected native form success/error navigation source, no runtime/CI.

**Files changed:** `src/components/tpo/tpo-notice-delete-confirm.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 12 — `src/components/tpo/tpo-student-nudge-panel.tsx`

**Problems found (12):** The selected learners list had loose row spacing with no visible boundaries; long names could collide with registration status; checkboxes were vertically centered on wrapped text; status had no overflow guard; message fields lacked explicit fluid width; Send CTA was narrow on 375px; invalid short messages could enter confirmation unnecessarily; confirmation said only that a notification would arrive but did not show the actual message; Confirm and Cancel crowded the modal footer on phone; server errors surfaced behind an open modal; busy state lacked visible spinner; selection could mutate while an action guard was pending.

**Fixed:** Preserved limits, in-app send endpoint, nudge template content, selection behavior, audited confirmation, and sent/skipped counters. Aligned each student as a 44px touch row with hairline dividers, wrapping names and status; maintained scroll containment. Kept fields full-width and action full-width at 375px; gated actions on minimum message length; added the existing message as a read-only text preview within Dialog and placed errors inside it when open; stacked footer actions on phone and added loading feedback, while retaining the original wording and request guard. Inspected ScrollCue, Checkbox, Select, Textarea, Dialog, Button and InlineNotice for full/empty selection, validation, loading/error/success and 375/768. No CI/runtime.

**Files changed:** `src/components/tpo/tpo-student-nudge-panel.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 13 — `src/components/tpo/tpo-student-quick-panel.tsx`

**Problems found (14):** Duplicate student heading conflicted with the Drawer title; redundant Close panel repeated the drawer close; metadata had uneven starts; previous/next pagination crowded 375px; 21 profile facts appeared before actionable attention; definition-list values risked overflow; list spacing was tall for dense facts; mobile placement/team links used an arbitrary left margin; every request had unnecessary warning-card chrome; every private note used an identical warning-card treatment; loading state had no muted hierarchy; error state used unstructured red text; Retry button was narrow on mobile; tab sections and header had inconsistent vertical rhythm.

**Fixed:** Shared Drawer remains the only title and close control, while roll, branch, cohort, stage and after-college metadata remain visible once; placed Needs attention before facts, reduced definition rows to aligned hairlines with wrapping, kept five Tabs and all permissions/URLs. Changed panel footer to a two-equal-button mobile row with page position above, one aligned row on tablet; removed stray margins on companion links and made them stack on phone. Requests and Notes now read as separated records, not repeated yellow cards; kept request decision controls, note editor, nudge child, all pending actions and historical data. Used shared InlineNotice and a full-width retry for loading failure. Reviewed Drawer, Tabs, Button, TpoStudentNoteEditor, TpoRequestDecisionControl and the just-polished TpoStudentNudgePanel including close, in-flight data/aborts, no details, loading/error, 375px and 768px. Source-only; no CI/browser.

**Files changed:** `src/components/tpo/tpo-student-quick-panel.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 14 — `src/components/tpo/tpo-student-saved-views.tsx`

**Problems found (13):** Default view editor was permanently expanded alongside results; duplicate Save/Update buttons competed with opening a saved view; pinned/recent buttons could overflow; list items had scattered radio/name/badge/actions; long names lacked wrap; Delete looked like a routine Open action; footers wrapped unevenly on mobile; delete confirmation lacked destructive styling; requests showed no loading status; an empty state appeared before loading finished; errors and successes were unstructured text; selection status separated from its related form; controls stayed editable while a request was pending.

**Fixed:** Preserved view filter schema, pinned/recent counts, CRUD endpoints, action wording, navigation and saved IDs. Moved infrequent Create/Update inputs behind a native Disclosure with selected status inline; grouped each row’s selector/label/pin and demoted Delete to ghost next to Open, using a 44px two-button phone row; wrapped names and made saved shortcut buttons stack on mobile. Confirmation keeps the same dialog and copy, with a danger footer button, loading guard and responsive stack. Added actual loading/empty/error/success notices using shared InlineNotice; disabled input/radio during network work. Read Dialog, Disclosure, Checkbox, Radio, Input and Button interactions, errors, zero/pinned/recent lists and 375/768. Source-only, no CI or browser.

**Files changed:** `src/components/tpo/tpo-student-saved-views.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 15 — `src/components/tpo/tpo-students-assign-prep.tsx`

**Problems found (11):** Preparation course and optional date floated at unrelated widths; mobile datetime input could overflow; course list displayed no loading state; a zero-course list looked like a blank selector; action style was secondary despite being the primary task; action was narrow on phone; confirmation controls could wrap poorly; modal summary omitted the chosen course; server errors appeared behind the confirmation; fields could be changed while saving; selection count lacked clear muted hierarchy.

**Fixed:** Kept selected-roster limits, IST conversion, eligibility checks, assigned/duplicate/skipped behavior, API mutation, routing and exact action copy. Aligned course and due date in a responsive one/two-column grid using the existing 44px mobile and 36px desktop field heights; added loading/empty course feedback and disabled course while loading; gave Review prep assignments one clear primary placement. Confirmation names the selected course and due date, retains audited 100-student message, uses shared Dialog footer with stacked full-width mobile actions and visible pending. Error stays in open dialog when active. Read Dialog, Button, Select, Input, InlineNotice and selection context for initial loading, empty course, bad IST value, no selection, 100+ picks, error/success, 375/768; source-only, no CI.

**Files changed:** `src/components/tpo/tpo-students-assign-prep.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 16 — `src/components/tpo/tpo-students-bulk-add.tsx`

**Problems found (16):** Search field had no stable fluid width; no-result drives created a large EmptyState inside the action workspace; Drive/Role selectors differed in width/height; selectable learner rows used scattered rounded chips and spacing; long learner names/branch/readiness had collision risk; checkbox overrides were smaller than the shared control; ineligible override had a permanent multi-control area; override explanation took space when not needed; selected counter and CTA split unpredictably; mobile CTA did not fill available width; dialog footer controls could compress at 375px; confirmation errors were only visible behind the modal; busy confirmation lacked spinner; per-learner results were bordered card-within-card; long result names lacked wrap; selection list did not communicate scroll edges.

**Fixed:** Kept 200-row cap, drive role loading, ineligible override, preflight fingerprint, guard, server eligibility rechecks, all API calls and statuses. Standardized selector and search geometry; replaced decorative learner cards with hairline rows inside ScrollCue; kept names/branch/readiness wrapped, aligned checkboxes. Moved rarely used ineligibility inclusion form behind a native Disclosure; paired selection count and one full-width mobile CTA. Dialog confirmation uses a stacked legacy footer and shows errors while open, with visible loading; results become a flat separated list. Reviewed Input, Select, Checkbox, Textarea, Button, Disclosure, Dialog, ScrollCue and EmptyState for no drives, no search hits, loading roles, invalid override, preflight mismatch, failure, success, 375px and 768px. Source-only, no CI/browser.

**Files changed:** `src/components/tpo/tpo-students-bulk-add.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 17 — `src/components/tpo/tpo-students-bulk-debar.tsx`

**Problems found (12):** Action and duration fields had arbitrary narrow caps on phones; reason and date controls used manually repeated borders and radii; 375px date input could exceed viewport; duration controls stayed editable during mutation; primary review action appeared secondary and narrow; confirmation listed up to 200 students without scroll bounds; confirmation omitted reason and debarment duration; destructive debar action had no danger distinction; dialog footer buttons could cramp; pending confirmation lacked spinner; long student names could overflow; results were undivided text rows with weak hierarchy.

**Fixed:** Preserved all debar/lift API flows and 200-selection guard, time/drive/manual duration semantics, concurrency (5), per-learner statuses, existing reason validation, routes and exact copy. Standardized shared Select/Input/Textarea controls and fluid phone widths, disabled them while pending. Made Review the clear primary CTA and Confirm debar danger while lift remains primary, both arranged in the shared responsive Dialog footer. Review now includes recorded reason, duration and a bounded scrollable hairline roster; errors appear in dialog when relevant. Flattened results to readable separated rows. Reviewed Dialog, ScrollCue, Button, Select, Input, Textarea and InlineNotice for empty selection, invalid date, debar/lift, busy and mixed saved/skipped/failed states at 375px/768px; source-only, no CI.

**Files changed:** `src/components/tpo/tpo-students-bulk-debar.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 18 — `src/components/tpo/tpo-students-drive-visibility.tsx`

**Problems found (11):** Drive/Action selector widths and heights did not align; reason input lacked fluid width; no drives looked like ordinary text; selection count had no subdued hierarchy; review action was visually secondary and narrow; confirmation list up to 200 was unbounded; modal footer actions could cram mobile widths; failure message appeared outside an open modal; pending action had no loading animation; undo CTA and result lists had uneven width and rows; long learner names could overflow the review and results.

**Fixed:** Retained INCLUDE/EXCLUDE/CLEAR model, 200 cap, concurrency=5, optimistic override/version checks, reasons, undo and all API routes. Aligned controls as a one-column mobile/two-column tablet grid with shared 44/36px fields and fluid reason; promoted Review as the only primary CTA. Modal retains exact impact description and displays selected names as a bounded hairline list with inline reason and errors, stacked full-width mobile footer actions and visible pending. Results and undo use readable separated rows, wrapping names and consistent action widths; form fields lock during changes. Reviewed Dialog, ScrollCue, Select, Textarea, Button and InlineNotice for empty drives, invalid count/reason, include/exclude/clear, mixed outcomes and undo, 375px/768px. Source-only; no CI.

**Files changed:** `src/components/tpo/tpo-students-drive-visibility.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 19 — `src/components/tpo/tpo-team-ask-panel.tsx`

**Problems found (13):** Composer controls dominated the thread even when existing asks were the priority; duplicate ask actions in a modal lined up inside scrolling content; danger Cancel ask looked like routine completion; form/date widths could exceed phone; action CTAs did not fill 375px; ongoing mutation had no spinner; long ask titles and notes lacked wrapping; list rows had duplicate dividing borders; empty ask state took a disproportionate section; respondent name could overrun; errors were distant from modal actions; modal close alternatives were low-contrast links; responsive grouping and vertical rhythm varied across action states.

**Fixed:** Maintained each ask ID, highlighted scroll target, task status/deadline, request-key de-duplication, and all mutation endpoints. Moved low-frequency New ask composer into a keyboard-accessible Disclosure, initially open for an empty thread; retained draft fields and date conversion. Aligned form inputs, 44px mobile send button, and wrapped names. AskAction dialogs use the sticky shared footer: Keep it/Not now secondary, Mark done primary, Cancel ask danger with loading; optional note and in-modal errors remain. Flattened ask list to one separator per entry and replaced large nested EmptyState with succinct status. Inspected Disclosure, Dialog, Button, Input, Textarea, Alert and InlineNotice for open/done/cancel, unsaved draft, away status, 200 rows, empty, error, 375/768. Source only, no runtime/CI.

**Files changed:** `src/components/tpo/tpo-team-ask-panel.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 20 — `src/components/tpo/tpo-team-message-actions.tsx`

**Problems found (10):** Edit opened a full-width embedded form below message actions with no clear alignment to the conversation; edit buttons competed with thread replies; edit and delete had inconsistent confirmation layouts; destructive controls were placed inside scrollable dialog content; Delete/Cancel might wrap at 375px; Delete dialog had an empty upper band; long message content lacked min-width containment; no consistent loading affordance; edit reopening could retain an unrelated stale draft; error notices needed to be beside the relevant action.

**Fixed:** Preserved thread/message IDs, permission guard, existing edit/delete labels, 4000-character budget, optimistic body hash, POST endpoint and refresh. Kept ghost launch controls in thread row, moved edit form into the shared Dialog with its own stable form id, controlled body and sticky footer so Save/Cancel stay visible with a mobile keyboard. Refocused edit draft from the latest message when reopened, retained server error at the action. Delete remains an accessible alertdialog with original impact wording, now uses a danger+secondary stacked footer and visible busy state; removed its empty body band. Reviewed Dialog, Button, Textarea and InlineNotice for no edit permission, open/close, pending, invalid text, failed update and 375/768. Source inspection only, no CI/browser.

**Files changed:** `src/components/tpo/tpo-team-message-actions.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 21 — `src/components/tpo/tpo-timed-debar-control.tsx`

**Problems found (12):** Debar creation form expanded even when active restrictions prohibit it; active case had enabled form fields despite disabled submit; arbitrary date/number input widths could overflow narrow phones; distinct controls used inconsistent min-width handling; secondary Review appeared low priority; history and create form were weakly separated; empty history resembled another paragraph; lifting textarea lacked responsive containment; confirmation did not restate the reason or duration; debar (high-impact) looked identical to lift; modal footer actions crowded phones; failure notice was hidden behind the open modal.

**Fixed:** Preserved active restriction guards, all duration types, lift semantics, dates, reason text, POST payload, conflict errors and in-memory result rows. Moved Create debarment into native Disclosure, open by default only without active restriction; disabled form controls while pending or active, kept 44px fluid inputs and a clear Review primary. Aligned history with simple border dividers and retained inline lift input; in the shared confirmation dialog show reason/term with high-impact danger confirm only for DEBAR, stable mobile footer, busy indicator and local errors. Read Disclosure, Dialog, Button, Input, Select, Textarea and InlineNotice for active/expired/empty, pending/error, debar and lift, 375px and 768px; source-only, no CI/browser.

**Files changed:** `src/components/tpo/tpo-timed-debar-control.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 22 — `src/components/tracker/known-errors-workspace.tsx`

**Problems found (15):** Each known-error record displayed three metadata inputs and nine same-weight actions by default; no obvious primary next step among copies, triage, trackers, mute and status; full-width actions crowded each other on 375px; long signatures/identifiers risked crowding; first/last seen metadata fought the status header; the high-value Create tracker issue link was buried after two copy actions; per-row forms had uncontrolled widths; mute confirmation put buttons in scrollable content; its action order could vary at small widths; modal reason input lacked width guard; no reliable 44px mobile footer; low-priority diagnostics distracted from affected account counts; mark-reviewed action was narrow; row section could overflow; excessive action-control noise overwhelmed the error list.

**Fixed:** Preserved all status badges, redacted summaries, safe SQL, ticket link, mutable fields, API routes, guarded status and toast. Left Create tracker issue as the immediately visible next action and put metadata editing, diagnostic copy and rare status/mute/link controls behind a native Disclosure per error, no functionality removed. Input and button widths now fit 375px with consistent 44px targets and aligned tablet rows; status header wraps safely. Mute confirmation uses existing Dialog.footer with Cancel then Mute in a responsive stack, reason remains visible and focusable. Last-reviewed toolbar now also stacks mobile. Read shared Dialog, Disclosure, StatusBadge, Button, Input, EmptyState and Toast flows; considered empty, pending, failed API/clipboard, mute/unmute, fixed/regressed and 375/768; source-only, no CI.

**Files changed:** `src/components/tracker/known-errors-workspace.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

**Source correction (same surface):** Repaired the nested Dialog body closing tag after moving the mute controls into its footer; the form content is now structurally closed before the Dialog. No runtime/CI.

## Surface 23 — `src/components/tracker/tracker-live-logs-explorer.tsx`

**Problems found (14):** Three filters and three competing top-bar actions wrapped into an uneven toolbar; search input lacked reliable flex containment; report/export competed with primary Refresh newer; log summary path overflowed; entry actions could cramp in narrow viewports; full-width longer references strained lists; no separation between common reading and rare export; report dialog had three bottom buttons in scrollable content; read-only Markdown textarea could grow beyond sheet width; Copy/Download report had weak priority; mobile footer order was inconsistent; small log actions lacked reliable touch widths; Cloud-source status shared header width unpredictably; per-record spacing was generous for a long live feed.

**Fixed:** Kept the same log API pagination, redacted CSV/Markdown outputs, clipboard, diagnosis/mute links, service status and data. Aligned time/severity/search in a responsive one-column mobile/four-column desktop grid with one primary Refresh newer action; moved rare Download logs and Report for Claude behind native Disclosure. Gave log disclosure summaries overflow-safe wrapping and made per-entry action links wrap into clear full-width phone targets. Report dialog now keeps read-only source content in the body and original actions in shared sticky footer with Copy primary, Download secondary, Close secondary, all mobile full-width. Retained ConfirmDialog mute flow and code unchanged. Read Input, Select, Textarea, Disclosure, ConfirmDialog, Dialog, Button, InlineNotice and EmptyState for initial/loading, not configured, no items, pagination, export/clipboard error, mobile 375 and tablet 768. Source-only, no CI.

**Files changed:** `src/components/tracker/tracker-live-logs-explorer.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 24 — `src/components/tracker/tracker-quick-report-launcher.tsx`

**Problems found (7):** Report launcher lacked safe-area placement near mobile bottom controls; fixed position did not constrain its width on 375px; keyboard shortcut was invisible to assistive technology; modifier combinations could trigger unintended toggles; captured-context disclosure looked like a decorative card nested inside the Drawer; long browser user-agent strings risked horizontal overflow; nested report form fields could exceed the Drawer content rail on phones.

**Fixed:** Preserved Report issue · Alt+B wording, Alt+B toggle, page/user-agent/viewport prefill, native Drawer close/focus, persistent issue form drafts, issue submission and all routes. Positioned launcher above mobile safe area, maxed its width within 16px gutters and attached the existing shortcut as aria-keyshortcuts; avoided intercepting mixed Ctrl/Meta+Alt combinations. Replaced boxy captured context card with a plain hairline Disclosure and wrapped long technical context; constrained nested Form inputs/textareas with existing Drawer body slot without altering TrackerReportForm behavior. Read Drawer, Disclosure, Button, TrackerReportForm, useFormDraft, report API states in source, including open/closed, capture, successful report, restored draft, invalid form, 375/768. No runtime/CI.

**Files changed:** `src/components/tracker/tracker-quick-report-launcher.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 25 — `src/components/tracker/tracker-telegram-manual-panel.tsx`

**Problems found (11):** Two top actions did not stack on phone; Daily digest preview displayed five unaligned summary values; long deploy identifier could overrun its column; footer actions sat inside scrollable dialog content; preview Send did not read as primary; confirmation could open on top of still-open preview and trap keyboard focus unpredictably; disabled send had no stable spacing; error from manual send appeared only behind the open confirm; ConfirmDialog close could be triggered while request was pending; high-level counts lacked label/value hierarchy; the sheet used inconsistent row spacing on desktop and mobile.

**Fixed:** Retained test/digest POST requests, known errors visibility count, up-to-100 preview description, rate limit wording, existing states and notifications. Made both launcher actions full-width 44px at 375px, separated on tablet; restyled digest counts into one/two-column hairline definition rows with wrapping deploy ID. Moved Close and Send to Telegram now into the shared Dialog footer with clear primary/secondary mobile stacking. Closes the preview before opening its ConfirmDialog to avoid competing native overlays, while retaining the explicit second confirmation; displays send failures inside active confirmation and blocks dismissal during pending. Read Dialog, ConfirmDialog, InlineNotice and Button, including configured/unconfigured, no errors, pending/failure/success, modal layering, 375/768; source-only, no CI/browser.

**Files changed:** `src/components/tracker/tracker-telegram-manual-panel.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 26 — `src/components/ui/confirm-action-dialog.tsx`

**Problems found (8):** Danger and Cancel buttons lacked a layout group; they could wrap unpredictably in a 375px confirmation; no guaranteed full-width mobile touch targets; action buttons had no explicit type to prevent accidental outer form submissions; shared legacy modal body used bespoke 30px padding unrelated to canvas variables; long undo guidance could overflow; alertdialog footer actions had inconsistent alignment at tablet; pending state risked cramped loading label in a narrow footer.

**Fixed:** Preserved all legacy ConfirmActionDialog props, caller action callbacks, alertdialog role, consequence description, undo hint, focus-first Cancel, pending escape/backdrop lock, original button labels, variant and aria-live. Grouped Cancel/danger in the existing Dialog.footer with a 44px full-width phone stack and right-aligned desktop row, explicit non-submit types, responsive legacy canvas-padding variable, and overflow-safe undo guidance. Read shared Dialog/Button implementations and call sites in HR, Activity and TPO plus their conditional draft/discard/grant flows. Reasoned through open/closed, pending/error controlled by callers, no-undo/undo, keyboard, 375/768. No runtime/CI, source-only.

**Files changed:** `src/components/ui/confirm-action-dialog.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 27 — `src/components/ui/confirm-dialog.tsx`

**Problems found (7):** Footer actions squeezed into a single row at 375px; unequal target sizes between this and ConfirmActionDialog; long localized labels risk wrapping awkwardly; the default body repeated a caller-provided description; no explicit button type; destructive action could be visually secondary on phone; long caller body text had no resilient width.

**Fixed:** Aligned with the already-audited ConfirmActionDialog: a single responsive footer with 44px full-width mobile controls, compact inline tablet/desktop controls and clear confirm-first mobile order; preserved autofocus on Cancel, danger/primary variants, all labels, disabled and pending safeguards, role=alertdialog, routes and callbacks. Kept the fallback explanation only when the caller supplied neither children nor description, avoiding duplicate guidance. Kept content inside the existing Dialog/ScrollCue without nested cards. Source-reviewed Dialog, Button and sibling ConfirmActionDialog for open, confirm, pending, description-only, long-body, 375px and 768px; no runtime or CI.

**Files changed:** `src/components/ui/confirm-dialog.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 28 — `src/components/ui/date-input.tsx`

**Problems found (8):** Calendar popup anchored past the viewport when a narrow date field sat near either screen edge; 7-column grid forced a sideways scroll on 375px; the picker looked like a tiny dropdown on phone rather than a usable sheet; Hour and Minute columns lacked visible headings; time options were hard to distinguish; combined date/time Apply button competed for width with the time input; popup had an arbitrary 12px radius instead of the shared canvas token; narrow mobile value controls could cram into one row.

**Fixed:** Kept all five native HTML input modes, calendar/time/month/week/datetime selection, min/max/step enforcement, focus recovery, keyboard navigation, native bubbling change/input events, ARIA ids and legacy styling. Converted the nonmodal popup into an inset viewport-safe bottom sheet at phone widths (scroll-contained to 70dvh) while retaining anchored popup on tablets/desktops. Tightened the seven-column phone grid to legacy 2px gaps and compact gutters so all date buttons stay 44px without horizontal scrolling at 375px; labelled Hour and Minute columns visibly and gave datetime Apply a full-width phone row. Reviewed Input, Button, PopoverPanel, CalendarGrid and every picker branch for empty, selected, disabled, invalid, bounded, opening/dismissal, Escape, 375px and 768px; source-only, no CI/runtime.

**Files changed:** `src/components/ui/date-input.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 29 — `src/components/ui/drawer.tsx`

**Problems found (8):** Footer peers lacked reliable mobile stacking and direct-button widths, tiny phone action targets, poor safe-area footer grouping, narrow left-panel title gutter, long description overflow, insufficient min-width guards, different footer hierarchy from Dialog, and mobile content competing with footer for width.

**Fixed:** Preserved native dialog/backdrop/Escape, focus return, history state, both left/right geometry, title/close controls, inline-desktop filter behavior and all props. Added safe width/overflow, compact phone header gaps, long-description wrapping, full-width direct footer buttons and confirm-first mobile order; kept wrapped/right-aligned tablet-desktop footer with legacy spacing/borders. Inspected Button, ScrollCue and responsive filter use of Drawer across dismissal, disabled/pending, empty/tall body, left-navigation, 375px and 768px; source only, no CI/browser.

**Files changed:** `src/components/ui/drawer.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 30 — `src/components/ui/searchable-select.tsx`

**Problems found (9):** Dropdown opened below viewport edge; unnecessary 120px empty height; only 200px list for many options; invisible scroll affordance; overlong options clipped; weak scroll containment; tiny empty feedback; filter list could remain off-screen; narrow touch layouts were dense.

**Fixed:** Added root-geometry-aware above/below placement at opening, viewport-bounded scrolling (max 18rem/half screen), no forced empty height, multiline labels with resilient breaking, readable compact empty notice and preserved 44px options. Maintained native input/selection and clearable behavior, controlled/uncontrolled props, keyboard arrows/Enter/Escape/Tab, blur validation, outside dismissal and exact ARIA roles, IDs and result text. Reviewed PopoverListbox/Input/Button for no/one/many results, disabled, validation error, focus, 375px and 768px by source; no runtime/CI.

**Files changed:** `src/components/ui/searchable-select.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 31 — `src/components/verification/VerificationReviewDrawer.tsx`

**Problems found (15):** Decision history consumed the top of the task; two boxed sections repeated chrome; every snapshot field rendered as a card within a drawer; confirmation and sending back had equal priority; action buttons were cramped at 375px; error/retry lost visual hierarchy; sequential review nav wrapped awkwardly; lengthy personal fields risked overflow; long document links lacked touch targets; review feedback crowded the body; muted status had weak contrast; decision CTA lived beyond lengthy history; confirm controls didn't stack; large education rows occupied the narrow drawer; and completed state lacked a clear distinction from pending.

**Fixed:** Preserved privacy-masked snapshots, signed document routes, section-specific reasons, verification versions/CAS, guarded save and conflict retry, all text, APIs and callbacks. Made current submitted-vs-verified data the first review content, flattened its field list to hairline dividers, moved historical records into a native keyboard-operable disclosure after actionable content, promoted Verify as primary, kept Send back secondary and moved mobile action/confirmation/retry controls onto full-width 44px rows. Aligned sequence progress above content, document link tap targets, overflow-resistant values and light error/confirm strips, keeping the Drawer header and scroll container as the only shell. Inspected Drawer, Button, DataTable, Select, Textarea, comparison helpers for loading, error, no records, already decided, pending/retry, 375px and 768px. Source-only, no runtime/CI.

**Files changed:** `src/components/verification/VerificationReviewDrawer.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 32 — `src/components/activity/notification-toolbar.tsx`

**Problems found (8):** Two filters unnecessarily scrolled horizontally despite fitting at 375px; uneven widths/active destinations; the compact filter row was visually separate from the primary task; no positive outcome feedback after mutation; an inert confirmation dialog was mounted when confirmation was disabled; toolbar borders mixed generic/new and legacy tokens; long customized All labels could squeeze the Unread tab; and 375px layout wasted a strip below two chips.

**Fixed:** Kept the exact filter labels, URLs, unread count, role=group, aria-current, guarded POST, pending/disabled semantics, optional consequence dialog and error toast. Changed filters to an equal-width two-column mobile grid with wrapping 44px targets and tablet inline layout; aligned legacy canvas border and spacing, kept Mark all as read full-width on phone. Mounted the confirm dialog only when required, and added a transient success toast after the successful request before refresh; no duplicate confirmation. Read Button, ConfirmActionDialog, ToastProvider for empty, nonzero, confirmation open/cancel/pending, success, failure, 375px and 768px; source only, no CI/browser.

**Files changed:** `src/components/activity/notification-toolbar.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 33 — `src/components/verification/CollegeVerificationPanel.tsx`

**Problems found (17):** Rare permission switch appeared ahead of daily verification; four bulk buttons shown even with zero selected; bulk actions appeared *after* long list selection, requiring a screen-length return; Clear selection competed with the primary preview; Verify/send-back preview choices had equal hierarchy; preview subheading and controls had tight phone spacing; long preview rows could clip; waiting one-by-one CTA was visually secondary; export/refresh tools wrapped unevenly; nested settings details crowded the queue; bottom sort controls squeezed labels and native selects; page sizes mixed control heights; no logical 2-column phone layout for tools; large outcome text competed with the queue; selection count could disappear below the fold; mobile confirmation controls lacked a stable CTA width; and action groups used nonlegacy borders.

**Fixed:** Reviewed VerificationWorkspace, VerificationFilterPanel, VerificationExportControl, TpoVerificationSwitch, VerificationReviewDrawer and selection/bulk guards. Moved occasional placement-cell verification setting to the end of the page; paired batch selection and preview commands just before the actionable queue (instead of below all rows); hid irrelevant Clear and Preview actions with no selection, made Preview verify primary only when selected, promoted the one-by-one launcher and kept preview/cancel/send-back behavior. Kept URL sorting/pagination/filters, existing text, 20-item safety cap, guard and all API calls. Added equal-width 44px export/refresh tools on phone, sensible responsive queue select widths, scrolling preview confinement, hairline dividers and min-width safe status copy. Source-inspected empty/selection/preview/ack/error/outcome/pending, 375px and 768px; runtime/CI not run.

**Files changed:** `src/components/verification/CollegeVerificationPanel.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 34 — `src/components/auth/connection-failure-notice.tsx`

**Reachability:** Confirmed live in `src/app/(authenticated)/layout.tsx`; referenced by the auth-network notice regression checks.

**Problems found (6):** Duplicate status/alert live region for one error; background-tab timer erased unread warnings; no min-width guard on a 375px page; manual dismiss left a stale timeout; tab return offered no time to read; repeated events could collide with expiry.

**Fixed:** Preserved the exact four event texts, 10-second visible-time duration, original event name and dismissal, and session/draft safety. Kept InlineNotice as the single assertive alert; paused auto-dismiss when hidden, restarted a complete reading interval upon return, and cleared timeout/reference on manual dismissal. Checked InlineNotice, authenticated layout and its event users for mount/unmount, repeated events, focus/dismiss, 375px and 768px by source; no browser/CI.

**Files changed:** `src/components/auth/connection-failure-notice.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 35 — `src/components/courses/course-detail-anchor-tabs.tsx`

**Reachability:** GitHub code search for `CourseDetailAnchorTabs` found its definition but no import or rendered use in the current application. This is a presently dormant utility, not a live route surface.

**Problems found (0):** Source audit found no independent layout or accessibility defects to change safely. The component already passes four named in-page targets to the shared `Tabs` navigation branch, preserves the familiar underlined active tab, listens for hashchange, and uses the shared `ScrollCue` horizontal tab affordance. No redundant controls or card nesting; at 375px the shared strip scrolls, and at 768px it uses legacy token gaps. Making speculative visual changes to unreachable code would introduce unnecessary divergence.

**Fixed:** No source mutation warranted. Kept route hashes, four exact labels, active value, ariaLabel and native-link behavior. Inspected `Tabs`'s navigation/selected/disabled, focus states and 375px/768px behavior by source; runtime/CI not run.

**Files changed:** `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md` (audit-only).

## Surface 36 — `src/components/placements/learner-placements-tabs.tsx`

**Reachability:** Mounted by `src/app/(authenticated)/learn/my-placements/layout.tsx`. All seven legacy tab destinations and the notice count are active.

**Problems found (7):** The parent touch-end route gesture could intercept horizontal scrolling of the seven-tab strip at 375px; a long swipe could navigate to another page while the reader only intended to reveal hidden tabs; scroll affordance and swipe navigation had no precedence; scrolling could reset context unexpectedly; the mobile active tab could be missed behind horizontally clipped neighbors; the 60px swipe threshold alone didn't distinguish scrolling; and tablet drag behavior could also accidentally change routes.

**Fixed:** Preserved every Home/Drives/Applications/Schedule/Offers/Notices/Placement cell label and href, unread count, URL-derived selection, shared legacy underlined Tabs/ScrollCue and navigation helper. Now captures the ScrollCue viewport's scroll position on touch start; if the tab strip moved or there is more horizontal tab content in the gesture direction, it lets native scroll finish; only at horizontal edges does the existing deliberate 60px route swipe execute. Kept touchcancel reset, vertical gestures, all seven destinations, 375px/768px native scrolling and keyboard link focus. Inspected Tabs, ScrollCue, swipe helper and learner placement layout; source only, no runtime/CI.

**Files changed:** `src/components/placements/learner-placements-tabs.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 37 — `src/components/public/error-page-view.tsx`

**Reachability:** GitHub code search for `ErrorPageView` found the component definition, but no runtime import. Both live root boundaries (`src/app/error.tsx` and `src/app/not-found.tsx`) use `GracefulErrorBoundary`/`GracefulScreen` instead; this is a dormant public-screen alternative.

**Problems found (0 live):** The component is not reached from any route. Its shared CSS already stacks brand, centered legacy-white canvas, PageHeader, concise message, action row and footer, with 44px phone targets, 375px/768px gutters, focus outlines and Inter fallback. There is no active overlay, loading, state mutation or modal to adjust here; modifying a dormant alternative would introduce churn without making the live boundaries better.

**Fixed:** No source change warranted. Preserved 404/500 codes, title ID, messages, logo, privacy/terms links, recovery callbacks and exact branded copy. Inspected `ErrorRecoveryActions`, `public-screen.module.css`, live root error/not-found files and shared PageHeader for the compact, failure, recovery, 375px and 768px states by source; no runtime/CI.

**Files changed:** `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md` (audit-only).

## Surface 38 — `src/components/tpo/tpo-academic-import-preview.tsx`

**Reachability:** Code search found the component definition, legacy batches audit and an associated unit test, but no imported live page. Prepared it for any later route wiring without changing import/validation semantics.

**Problems found (8):** Instructions repeated 'not saved' in adjacent paragraphs; strict schema dominated the initial action; neutral Validate CTA was visually weak despite being the only action; CSV data and button competed for width on phone; arbitrary textarea radius departed from shared Input family; invalid CSV had mixed warning/error colors; live status wrapped an entire result table and could announce every cell; table wrapper scrolled in both axes despite DataTable owning horizontal scrolling.

**Fixed:** Kept exact CSV schema, accepted IDs, 25-learner-page limits, preview-only/no-save policy, error texts, parser/row IDs and action behavior. Moved detailed schema copy into native keyboard-operable disclosure, promoted Validate as the one full-width phone CTA, used shared Textarea chrome and InlineNotice error surface, localized role=status to the short matched-count line and gave the table wrapper y-only bounded scrolling. Read DataTable, StatusBadge, Button, Textarea and parser for empty/invalid/valid/unmatched, 375px and 768px; source only, no runtime/CI.

**Files changed:** `src/components/tpo/tpo-academic-import-preview.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 39 — `src/components/ui/date-range-picker.tsx`

**Reachability:** Code search for `DateRangePicker` found the definition and a legacy form audit, but no route import; this is currently a dormant shared field combination.

**Problems found (0):** No unsafe layout or interaction defect discovered in source. Two properly associated labels, shared DateInput calendar controls and legacy form tokens already use one column at 375px and aligned two-column fields at 768px. It derives start/end bounds from existing min/max restrictions, marks required fields, preserves controlled values and per-field native validation, and shows the invalid order as one full-row accessible message, without extra cards, actions or popovers beyond the audited DateInput. A speculative rewrite would risk changing protected form/ARIA semantics.

**Fixed:** No source change necessary. Reviewed DateInput's five modes/mobile sheet, focus/dismiss, native events, error bounds, external per-input overrides, disabled/required, 375px and 768px by source only; no runtime/CI.

**Files changed:** `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md` (audit-only).

## Surface 40 — `src/components/ui/long-text.tsx`

**Reachability:** GitHub code search for `LongText` finds the primitive and tests/coverage ledger but no page import; presently dormant. Inspected `safeDisplayText` and existing uses referenced in tests.

**Problems found (0):** This text primitive already uses `min-w-0`, `max-w-full`, `break-words`, `overflow-wrap:anywhere`, safe unknown-value conversion, bidirectional `dir=auto`, and inherited typography/number glyphs. It adds neither redundant decoration nor interactive behavior. At 375px and 768px it wraps unbroken student/provider labels without forcing parent overflow; empty/non-finite data falls back to the existing em dash. A speculative change could alter the title tooltip, text semantics, or the safe fallback behavior.

**Fixed:** No source mutation necessary. Retained `data-slot`, title, fallback, responsive wrapping, aria-independent semantics and legacy inherited tokens; source-level audit only (no browser/CI).

**Files changed:** `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md` (audit only).

## Surface 41 — `src/components/ui/permission-action.tsx`

**Reachability:** Code search for `PermissionAction` identified the exported implementation, UX-PLAYBOOK and authorization/overlay unit test but no live production page import. This is a policy-sensitive reusable primitive, not a live overlay.

**Problems found (0):** Source review found no safely correctable UI defect. Authorized children render without extra wrapper or chrome. Denied states follow the audited A2-05 rule: caller fallback if provided, privacy-scoped hide-sensitive as opt-in, otherwise a readable persistent reason with `role=note` in one modest legacy-token-bordered strip. Its min-width, long-message wrapping and typography remain usable at 375px and 768px. No duplicate button, modal, incorrect density or unguarded API mutation.

**Fixed:** No source mutation; retained `can(context, permission, resource)` as the central permission decision, denial wording and cross-tenant safety, `data-slot` and fallback precedence. Inspected UX-PLAYBOOK §19.4 and the matching authorization test by source; no runtime or CI.

**Files changed:** `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md` (audit-only).

## Surface 42 — `src/app/(authenticated)/teacher/error.tsx`

**Problems found (5):** Nested full-screen public branded frame inside the already-authenticated AppShell white canvas; duplicated PageHeader/full-screen main landmark; oversized centered error card competing with legacy page continuity; retry/home actions landed far below the normal faculty page heading; 375px and 768px fallback inherited public-screen grid instead of existing responsive canvas gutter.

**Fixed:** Passed `insideShell` to the already-shared `GracefulErrorBoundary`, so faculty route failures appear as a single alert with one PageHeader and concise copy on the existing white canvas, with a full-width mobile Try again primary and Go to home secondary action. Preserved route's `error`/`reset` props, stale-chunk one-time reload, reference copy, telemetry/privacy, original wording and destination. Reviewed `teacher/layout.tsx`, nearest authenticated layout's AppShell/PageCanvas, `teacher/loading.tsx`, `GracefulErrorBoundary`, `GracefulScreen` and `GracefulPageLoading`; source checked 375px, 768px, failure/retry/reference, no browser/CI.

**Files changed:** `src/app/(authenticated)/teacher/error.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 43 — `src/app/(authenticated)/admin/layout.tsx`

**Problems found (5):** Legacy group tabs touched the page heading without a consistent gutter; missing shared separation between navigation and content; no `min-w-0` guard for wider tab groups; responsive page header spacing depended on individual children; and print tab spacing could leave an unwanted gutter.

**Fixed:** Preserved request-context permission gating and redirect, all grouped tab routes and labels, and children. Grouped the existing tabs and page body in one width-safe non-card container with legacy 16px phone / 24px desktop vertical spacing and no print gap. When the tab model returns null, only the content child renders and no extra margin is produced. Reviewed authenticated AppShell/PageCanvas, group routing, shared Tabs/ScrollCue, admin error/loading/not-found states, 375px and 768px by source. No runtime or CI.

**Files changed:** `src/app/(authenticated)/admin/layout.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Surface 44 — `src/app/(authenticated)/hr/error.tsx`

**Problems found (0):** Shared HR error boundary already has a single in-canvas recovery region, keeps `homeHref="/hr"` and `insideShell`, and delegates sensitive exception masking, client-error reference logging, stale-chunk recovery, readable failure text, Try again and Go to home to the audited `GracefulErrorBoundary`. No separate card or duplicate public layout, no cramped controls. The shared buttons are 44px and full width at 375px and compact 36px at 768px.

**Fixed:** No source mutation necessary. Checked `hr/layout.tsx`'s recruiter authorization redirect, `hr/loading.tsx` directory skeleton/retry state, `hr/not-found.tsx` recovery link, authenticated shell's PageCanvas, shared GracefulErrorBoundary/ErrorState for failure, refresh, offline request reporting and focus. All routes, wording and privacy unchanged. Source only, no runtime/CI.

**Files changed:** `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md` (audit-only).

## Surface 45 — `src/app/(authenticated)/teach/layout.tsx`

**Problems found (7):** Alternate faculty route had no route-content skip target unlike its sibling `/teacher`; no explicit min-width guard for long tables/teaching controls; no focus target for keyboard/assistive bypass; inconsistent faculty layout hierarchy; `/teach/error.tsx` nested a full-screen public error frame inside authenticated AppShell; its error recovery had duplicate brand/footer/canvas chrome; and its 375px/768px failure actions sat outside the one continuous legacy page surface.

**Fixed:** Copied the already-audited faculty content skip-target structure from `/teacher/layout.tsx` into `/teach/layout.tsx`, preserving route permission gating and redirect, children, all IDs on children, and one single authenticated PageCanvas. Kept the skip link focus-only with 44px phone target and safe-area positioning, and wrapped route content in `min-w-0`/scroll-margin. Harmonized the sibling `/teach/error.tsx` by opting into `GracefulErrorBoundary insideShell` (same labels, reset, default destination, stale-chunk reload/reference/privacy); loading and not-found already use the correct in-canvas elements and destinations. Read nearest auth/teacher/teach layouts and GracefulErrorBoundary, GracefulPageLoading, PageHeader, Tabs, AppShell for large content, loading/error/404, keyboard focus, 375px and 768px. Source only, no runtime/CI.

**Files changed:** `src/app/(authenticated)/teach/layout.tsx`; `src/app/(authenticated)/teach/error.tsx`; `docs/orchestrator/queues/clone/lane-19-polish.md`; `docs/audit/ux/polish-lane-19.md`.

## Polish2 surface 1 — `src/components/courses/admin-course-display-editor.tsx`

**Problems found (9):** The core introduction and takeaways competed with advanced raw HTML and thumbnail fields; technical migration copy took prime visual space; no unsaved/unchanged indication; Save remained clickable for unchanged data; optional thumbnail HTTPS guidance only came after a server failure; full-height helper paragraphs increased scanning time; form labels and long URLs lacked consistent min-width guards; pending inputs could be edited while saving; narrow mobile editing crowded the action.

**Fixed:** Preserved the DB05 gating, rich HTML sanitization copy, 500/20,000/15,000 limits, takeaway normalization, PUT payload/version, toast feedback and refresh. Kept Introduction and Takeaways in the first scan path, moved advanced HTML and thumbnail into the shared keyboard disclosure (open for existing advanced content), used shared Input/Textarea/StatusBadge/Button, validated HTTPS inline, made dirty state explicit and disabled unchanged/busy/invalid saves. Aligned a single full-width 44px phone CTA with a small status and 36px desktop controls; reviewed disabled, optional empty values, stored advanced fields, success/failure toast, focus, 375px and 768px by source. No code execution or CI.

**Files changed:** `src/components/courses/admin-course-display-editor.tsx`; `docs/orchestrator/queues/clone/lane-19-polish2.md`; `docs/audit/ux/polish-lane-19.md`.

## Polish2 surface 2 — `src/components/courses/faculty-live-class-editor.tsx`

**Problems found (11):** Two-column time-picker fieldsets squeezed the date/12-hour select grid at tablet width; no explicit pending guard on editable controls; empty lesson and session selects looked like blank pickers; validation, success and server errors landed after the CTA; confirmation lacked a summary of the exact title/time; changing inputs left a stale validation message; 375px confirm button was narrow; the main form lacked one aligned content rail; field label and helper spacing were inconsistent; HTTPS URL field lacked immediate invalid styling; success copy competed with the next edit form.

**Fixed:** Read ConfirmDialog, FacultyIstQuarterHourPicker and its IST model, Alert, Button, Input, Select and the mutation/validation modules. Kept the CREATE/EDIT/CANCEL model, selections, preloads, 15-minute validation, POST route, optimistic token, reset-after-create and refresh. Grouped Action/Lesson, Title/URL and full-width stacked IST pickers on the same responsive grid; blocked edits while pending, improved empty choices, cleared stale errors as fields change, placed notices before the one CTA, added a concise confirmation summary and responsive 44px primary/danger action. Checked create/edit/cancel, missing choices, invalid HTTPS/time, busy/failure/success, 375px and 768px by source; no runtime or CI.

**Files changed:** `src/components/courses/faculty-live-class-editor.tsx`; `docs/orchestrator/queues/clone/lane-19-polish2.md`; `docs/audit/ux/polish-lane-19.md`.

## Polish2 surface 3 — `src/app/login/page.tsx`

**Problems found (7):** The page is an intentional re-export of the shared branded OTP entry; its primary heading and step panel had no keyboard skip target. Auth failure/OTP errors could push focus navigation through the full branded header; 375px code resend controls inherited a legacy 36px override, beneath the 44px phone target; footer links had small tap areas; session-expired/tenant error strips left excess spacing before the form; college branding could crowd the column; generic route loading/error needed checking against the same sign-in shell.

**Fixed:** Kept the re-export to preserve host-based branding, OTP policy, tenant-safe routing, login metadata, original legacy SVG, all login API behavior and session security. Added one focus-only sign-in skip control and target in shared root page, tightened the single auth-card notice spacing, and restored 44px mobile tap targets for resend/alternate actions and footer links in the scoped login shell CSS. Read LoginForm's email/phone, OTP, second-factor, resend, lockout, restore, error and busy paths; reviewed `login/loading.tsx`, `login/error.tsx`, absent optional route files, root layout and public error/loading components. Checked 375px/768px by source only; no execution/CI. Existing `login/page.tsx` re-export remains the same by design.

**Files changed:** `src/app/page.tsx`; `src/app/login-shell.module.css`; `docs/orchestrator/queues/clone/lane-19-polish2.md`; `docs/audit/ux/polish-lane-19.md`.

## Polish2 surface 4 — `src/components/placements/tpo-round-result-entry-form.tsx`

**Problems found (10):** Stage CTA overrode shared Button paint with duplicate local teal classes; success/error feedback and narrow action columns broke the content rail; default 2-row note was cramped; form field errors did not highlight the invalid input; HOLD rank lacked contextual feedback; confirming displayed only an abstract warning and omitted the result and actual candidate-visible message; background fields stayed editable during submission; no loading indicator on the action; 375px CTA shape was inconsistent; long confirmation feedback had no wrapping guard.

**Fixed:** Preserved PASS/FAIL/HOLD/ABSENT semantics, server schema and rank rules, expectedCurrentResultId optimistic write, authenticated POST path, audited staging confirmation, refresh and single-submit behavior. Applied shared controls and legacy gap tokens, made the note readable, showed field validity via Input/Textarea, added short internal/visible feedback context, moved inline notices directly before one primary footer, used Button loading and stable full-width mobile layout. Confirmation now previews outcome/rank and exact note in a wrapped definition list; success remains non-editable. Reviewed mutation schema and ConfirmDialog for invalid rank/note, confirm/cancel, stale version, request failure/success, 375px and 768px, source only; no CI.

**Files changed:** `src/components/placements/tpo-round-result-entry-form.tsx`; `docs/orchestrator/queues/clone/lane-19-polish2.md`; `docs/audit/ux/polish-lane-19.md`.

## Polish2 surface 5 — `src/components/tpo/tpo-topbar-new-menu.tsx`

**Problems found (8):** The global + New dropdown used a narrow anchored panel on 375px instead of the shared mobile action sheet; long company-scoped names could make menu items wrap in cramped columns; menu anchors had hand-rolled paint and loose vertical geometry unlike the shared menu; navigation had no menuitem roles for keyboard roster; follow-up and quick links had inconsistent hover/height treatments; the content width wasn't tablet-safe; the trigger lacked a clear responsive panel mode; and extra spacing hid the primary create paths.

**Fixed:** Kept query-derived scoped company links, exact destinations and wording, recruiter/drive actions, follow-up modal, separator, dropdown close/focus semantics, and existing TPO permission scope. Enabled the shared Dropdown mobileSheet (full-width phone bottom sheet, anchored desktop), aligned quick links to legacy menu geometry/tokens, made labels wrap safely and exposed native menuitem semantics. Reviewed shared Dropdown navigation, Escape/arrow/outside dismissal, MenuSeparator and Follow-up Dialog/ConfirmDialog including draft protection and async errors, 375px and 768px by source only. No package or runtime work.

**Files changed:** `src/components/tpo/tpo-topbar-new-menu.tsx`; `docs/orchestrator/queues/clone/lane-19-polish2.md`; `docs/audit/ux/polish-lane-19.md`.

## Polish2 surface 6 — `src/components/courses/learner-course-workspace.tsx`

**Problems found (14):** Three different lesson-item detail articles each nested their own bordered card inside the shared Dialog; dialog itself repeated a Close footer beside the standard close button; video completion percentage was printed twice; two scheduled-state messages added inset card decoration; full-width resource open/download links cramped at 375px; hand-rolled breakdown details duplicated shared Disclosure styling; five badges competed in every lesson header; empty filtered views gave no one-click recovery; whole lesson list read as rounded cards stacked in a larger canvas; metadata and focus outlines had inconsistent gutters; saved assignment/quiz interactions needed width guards; mobile lesson index could be visually buried; live/ended items should remain distinguishable with compact notices; and the long description/grade/media states had to remain legible without extra chrome.

**Fixed:** Read item Dialog and nested resource, quiz, submission, player, progress, stat, tab and retry components along with relevant model gates. Preserved all role/read-only flags, item IDs, routes, permissions, submission and quiz actions, progress saves, media players, valid/invalid external links, date/IST labels, focused-item opening and route filters. Removed the three nested detail-card borders/padding and redundant item Dialog footer; used a single hairline lesson-row grouping, moved four category counts from badge clutter into the expanded lesson body, collapsed progress breakdown with shared keyboard Disclosure, removed duplicate watched text, flattened live schedule notices, made resource controls full-width on mobile, and added Show all recovery in a truly empty filter. Reviewed no learning path, warning/retry, focused missing item, scheduled/ended, submitted/unsubmitted, video/live/link/media errors and mobile 375/tablet 768 by source only. No CI/browser execution.

**Files changed:** `src/components/courses/learner-course-workspace.tsx`; `src/components/courses/learner-roadmap-item-dialog.tsx`; `docs/orchestrator/queues/clone/lane-19-polish2.md`; `docs/audit/ux/polish-lane-19.md`.
