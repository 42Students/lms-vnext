# Work packet (wave 2): edit src/hooks/use-form-draft.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-025  [P2] GAP  facet F06  effort S
- Legacy: `index.js:17,70-80`: draft key `42tracker_report_draft_v1` saved after 250ms; empty drafts removed.
- vNext now: `use-form-draft.ts:19-26,53-59`: key `lms:draft:tracker-issue-report`, 500ms and saves any dirty draft.
- Fix: Restore legacy draft key/compat migration, 250ms debounce, and omit blank draft values.

## G2-16-002-030  [P2] GAP  facet F06  effort S
- Legacy: `index.js:112-122,330-333`: on form submit saves latest text draft before request so failed POST retains edit.
- vNext now: `tracker-report-form.tsx:57-93`; `use-form-draft.ts:62-82`: dirty draft flushed at pagehide; 500ms timer may not have persisted before POST but state stays.
- Fix: Flush draft synchronously at submit start, retain on API failure and clear only on successful created record.

## G2-16-002-054  [P3] GAP  facet F12  effort S
- Legacy: `index.js:19-26`: only meaningful drafts restored, severity NOT_SURE alone not enough.
- vNext now: `use-form-draft.ts:35-46`: restores any JSON object saved under key, independent of meaningful-content test.
- Fix: Add legacy meaningful-draft check, not merely object existence.

## G2-16-002-077  [P3] GAP  facet F19  effort S
- Legacy: `index.js:70-80`: changes save draft after 250ms; recent context persisted and only nonblank data kept.
- vNext now: `use-form-draft.ts:53-59`: 500ms debounce and any dirty object saved.
- Fix: Change to same 250ms and meaningful-draft predicate or record performance decision.
