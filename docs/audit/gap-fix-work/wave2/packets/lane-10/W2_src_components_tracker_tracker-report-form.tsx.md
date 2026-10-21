# Work packet (wave 2): edit src/components/tracker/tracker-report-form.tsx

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md, docs/audit/gap2/lane-19/bug-tracker-access-entity.md

## G2-16-002-005  [P2] GAP  facet F02  effort M
- Legacy: `index.js:194-246`: standalone tracker shell, h1 header outside form card; success uses dedicated success card.
- vNext now: `tracker/page.tsx:24-34`; `tracker-report-form.tsx:116-137`: app PageHeader and divider section, no original standalone card.
- Fix: Reproduce report wrap, standalone heading and single form card/success card look while retaining shared visual tokens.

## G2-16-002-006  [P2] GAP  facet F02  effort M
- Legacy: `index.js:261-320`: 3-up context row, one cascader, issueType/severity row, description, auto similar results, screenshots, evidence.
- vNext now: `tracker-report-form.tsx:142-245`: context grid, three separate location selects, issueType/severity, description, evidence disclosure, manual similar disclosure; screenshots absent.
- Fix: Restore exact sections and order; use one searchable hierarchy and insert screenshots before evidence.

## G2-16-002-007  [P2] GAP  facet F02  effort S
- Legacy: `index.js:246-260,330-333`: draft banner above form, submit errors near top, submit footer contains three instructions.
- vNext now: `tracker-report-form.tsx:138-141,246-251`: restored banner at top, form error near end, abbreviated footer.
- Fix: Move error feedback to form top, restore full footer instructions and draft-status hierarchy.

## G2-16-002-008  [P2] GAP  facet F03  effort M
- Legacy: `index.js:197-236`: success card has checkmark ✓, eyebrow, publicId heading, screenshot count, retry, View issue, Report another.
- vNext now: `tracker-report-form.tsx:116-132`: badge and smaller h2 with ID, link and reset, no checkmark/attachment feedback.
- Fix: Match success state symbol/heading hierarchy and attachment progress/partial success actions.

## G2-16-002-009  [P2] GAP  facet F03  effort M
- Legacy: `index.js:263-298`: reporter, account and issue-type Ant Selects use `showSearch`, environment simple select.
- vNext now: `tracker-report-form.tsx:143-200`: native selects without search on all dropdowns.
- Fix: Add searchable select for reporter, account and issue type; retain native semantics and keyboard.

## G2-16-002-011  [P2] GAP  facet F03  effort S
- Legacy: `index.js:309-315`: description shows live character counter and grows 5–10 rows.
- vNext now: `tracker-report-form.tsx:204-209`: fixed rows=6 and text helper `Up to 4000 characters`.
- Fix: Use autosize 5–10 and show live count `n/4000`.

## G2-16-002-012  [P2] GAP  facet F03  effort S
- Legacy: `index.js:321-328`: evidence link always visible with helper.
- vNext now: `tracker-report-form.tsx:210-218`: enclosed in default-closed `Optional evidence link` details.
- Fix: Keep evidence row expanded by default; remove extra disclosure where parity required.

## G2-16-002-020  [P2] GAP  facet F05  effort S
- Legacy: `SimilarIssuesPanel.jsx:58-74`: existing issue rows show publicId, status, location; open new tab.
- vNext now: `tracker-report-form.tsx:235-243`: link opens same tab and includes truncated description rather than location.
- Fix: Recreate publicId/status/location row and new-tab action, respecting approved privacy controls.

## G2-16-002-021  [P2] GAP  facet F05  effort M
- Legacy: `index.js:279-285`: single searchable cascader hierarchy page→screen→section, responsive tags.
- vNext now: `tracker-report-form.tsx:162-190`: separate native page/screen/section selects; no hierarchy-wide search.
- Fix: Use searchable dependent Cascader with responsive selections and exact full pathname mapping.

## G2-16-002-024  [P2] GAP  facet F06  effort M
- Legacy: `index.js:42-63,83-95`: remembers last reporter/account/environment in separate key and retains them after `Report another`.
- vNext now: `tracker-report-form.tsx:25-28,126-130`: all three reset to blank; no separate context key.
- Fix: Store limited recent context separately and retain trio on report reset while clearing issue-specific fields.

## G2-16-002-028  [P2] GAP  facet F06  effort S
- Legacy: `index.js:301-315`: required text 1–4000, autosize 5–10, character count.
- vNext now: `tracker-report-form.tsx:204-209`; `report-input-model.ts:17-18`: required, 4000 max, six-row textarea.
- Fix: Restore auto-resize and counter, keep same max.

## G2-16-002-030  [P2] GAP  facet F06  effort S
- Legacy: `index.js:112-122,330-333`: on form submit saves latest text draft before request so failed POST retains edit.
- vNext now: `tracker-report-form.tsx:57-93`; `use-form-draft.ts:62-82`: dirty draft flushed at pagehide; 500ms timer may not have persisted before POST but state stays.
- Fix: Flush draft synchronously at submit start, retain on API failure and clear only on successful created record.

## G2-16-002-047  [P2] MISSING  facet F10  effort S
- Legacy: `index.js:141-148`; `bugTrackerAttachments.js:3`: records recent reporter/account/environment localStorage on success.
- vNext now: `tracker-report-form.tsx:85-87`: clears draft without separate recent context.
- Fix: Persist three non-sensitive recent selections to compatibility key.

## G2-16-002-056  [P2] GAP  facet F12  effort S
- Legacy: `SimilarIssuesPanel.jsx:6-10,23-36`: 15-char threshold, 60-char snippet, 500ms debounce.
- vNext now: `tracker-report-form.tsx:95-101`: >=3-char manually entered query and no debounce.
- Fix: Match thresholds and derive query from typed description.

## G2-16-002-058  [P2] GAP  facet F13  effort S
- Legacy: `SimilarIssuesPanel.jsx:32-55`: while querying show `Checking for similar reports…`; zero results hides panel.
- vNext now: `tracker-report-form.tsx:95-107,219-245`: button loading and explicit no-match message.
- Fix: Restore passive loading copy and invisible empty panel.

## G2-16-002-063  [P2] GAP  facet F14  effort S
- Legacy: `index.js:321-328`: optional evidence URL always displayed, accepts HTTP/HTTPS, max1000.
- vNext now: `tracker-report-form.tsx:210-218`; `report-input-model.ts:19`: HTTP/HTTPS max1000 but disclosure collapsed.
- Fix: Show evidence directly with exact helper and max field error.

## G2-16-002-065  [P2] GAP  facet F15  effort S
- Legacy: `index.js:197-219`: user notified in-page after create/attachment actions.
- vNext now: `tracker-report-form.tsx:116-132`: in-page success, no attachment notification.
- Fix: Restore attachment status feedback in success page only.

## G2-16-002-066  [P2] GAP  facet F16  effort S
- Legacy: `index.js:261-276`: Ant `<Col xs={24} md={8}>` shows three equal context columns at md width (768+).
- vNext now: `tracker-report-form.tsx:142-160`: grid shows two columns 768–991, three only >=992.
- Fix: Set 3 context columns from 768px as old Ant Grid or document approved responsive redesign.

## G2-16-002-067  [P2] GAP  facet F16  effort M
- Legacy: `index.js:279-285`: single Cascader responsive tags; wraps on mobile; `ScreenshotPicker.jsx:65-101` dropzone supports touch.
- vNext now: `tracker-report-form.tsx:162-190`: three separate stacked dependent selects; no touch dropzone.
- Fix: Use compact cascader on phone and responsive screenshot dropzone touch targets.

## G2-16-002-069  [P2] MISSING  facet F17  effort M
- Legacy: `ScreenshotPicker.jsx:52-56,66-72,88-119`: dropzone keyboard Enter/Space, role button/aria-disabled, image alt/removal label.
- vNext now: `tracker-report-form.tsx:135-254`: screenshot interaction entirely absent.
- Fix: Restore accessible dropzone keyboard, alt preview, remove button, focus-visible and disabled.

## G2-16-002-078  [P2] GAP  facet F19  effort M
- Legacy: `SimilarIssuesPanel.jsx:30-52`: debounced/abortable search, stale result suppressed, max five.
- vNext now: `tracker-report-form.tsx:95-107`: manual fetch; no AbortController/request sequence and may race if keyword changes.
- Fix: Implement abort/sequence guard and 500ms debounce, preserving result cap.

## G2-16-002-079  [P2] GAP  facet F19  effort S
- Legacy: `PublicBugTrackerController.java:37-46`; `BugTrackerService.java:83-99`: search <=100, default 20, createdAt DESC.
- vNext now: `tracker-report-form.tsx:99-102`: requests limit five with sort newest via admin listing model.
- Fix: Make typed suggestion endpoint accept legacy snippet/page size five and deterministic newest sort.

## G2-16-002-081  [P2] GAP  facet F20  effort S
- Legacy: `SimilarIssuesPanel.jsx:30-53`: AbortController and requestRef guard ignores stale queries.
- vNext now: `tracker-report-form.tsx:95-107`: state mutations can show prior query's results if multiple async checks complete out of order.
- Fix: Add request sequence or abort and clear result when keyword changes.

## G2-16-002-016  [P3] GAP  facet F04  effort S
- Legacy: `index.js:200-201`: success ID is h1, standalone under `Issue reported`.
- vNext now: `tracker-report-form.tsx:118-120`: ID h2, status badge rather than eyebrow.
- Fix: Match heading semantics and eyebrow presentation.

## G2-16-002-022  [P3] GAP  facet F05  effort S
- Legacy: `SimilarIssuesPanel.jsx:55`: no similar results means panel hidden.
- vNext now: `tracker-report-form.tsx:219-243`: visible collapsed disclosure and empty/search instructions even with no results.
- Fix: Hide panel until related search is active or results/loading exist.

## G2-16-002-029  [P3] GAP  facet F06  effort S
- Legacy: `index.js:321-328`: evidenceLink optional url 1000 max with required hidden no extra condition.
- vNext now: `tracker-report-form.tsx:210-218`; `report-input-model.ts:19`: same optional http(s) URL max1000, collapsed by default.
- Fix: Match always-visible optional field and helper.

## G2-16-002-073  [P3] GAP  facet F18  effort S
- Legacy: `index.js:324`: helper `Optional — use this for a screen recording, Drive file, or other useful http/https link.`.
- vNext now: `tracker-report-form.tsx:214-216`: lengthy warning `Optional — add a shareable HTTP/HTTPS evidence link ...`.
- Fix: Match concise helper and place separate privacy guidance where required.

## G2-16-002-074  [P3] GAP  facet F18  effort S
- Legacy: `index.js:330-332`: footer complete draft/paste/shortcut message.
- vNext now: `tracker-report-form.tsx:247-251`: keyboard hint only.
- Fix: Restore `Draft saves automatically · Paste screenshots anywhere · Ctrl/⌘ + Enter to submit`.

## G2-19-020-049  [P3] GAP  facet F18  effort S
- Legacy: Old bug tracker draft key 42tracker_report_draft_v1 and severity NOT_SURE default. `docs/legacy-source/frontend/src/pages/tracker/index.js:17-25` `docs/legacy-source/frontend/src/pages/tracker/index.js:47-64`
- vNext now: vNext key tracker-issue-report and severity NOT_SURE default. `src/components/tracker/tracker-report-form.tsx:24-28`
- Fix: Document persisted draft transition and preserve severity wording.

## G2-19-020-050  [P3] GAP  facet F18  effort S
- Legacy: Old issue reporter rejection copy exactly Select a valid reporter. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:45-49`
- vNext now: vNext generic friendly error for create failure, with validation messages from Zod. `src/components/tracker/tracker-report-form.tsx:68-90`
- Fix: Keep explicit actionable reporter error under new identity policy.
