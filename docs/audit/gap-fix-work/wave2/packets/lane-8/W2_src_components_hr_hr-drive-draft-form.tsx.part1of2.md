# Work packet (wave 2): edit src/components/hr/hr-drive-draft-form.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md

## G2-11-004-007  [P2] GAP  facet F02  effort S
- Legacy: Separate Cards titled Role and work, Pay, Rounds, Eligibility `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:360`
- vNext now: Border-bottom sections; combines compensation and eligibility `src/components/hr/hr-drive-draft-form.tsx:272`
- Fix: Use four Cards with exact headings/order

## G2-11-004-008  [P2] GAP  facet F02  effort S
- Legacy: Preview Card titled What students will see on right `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:424`
- vNext now: Preview titled What students will see · local preview and collapsed until clicked `src/components/hr/hr-drive-draft-form.tsx:460`
- Fix: Render live preview Card with legacy heading

## G2-11-004-009  [P2] GAP  facet F02  effort S
- Legacy: Second primary Send in preview aside plus full-width bottom Send on mobile `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:436`
- vNext now: One Send button beside preview tools `src/components/hr/hr-drive-draft-form.tsx:467`
- Fix: Place legacy two reachable submit controls with identical busy state

## G2-11-004-011  [P2] GAP  facet F03  effort S
- Legacy: Rounds presets are small buttons in compact Card `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:390`
- vNext now: Presets are regular secondary Buttons in expanded block `src/components/hr/hr-drive-draft-form.tsx:407`
- Fix: Clone control scale/wrap

## G2-11-004-012  [P2] GAP  facet F03  effort S
- Legacy: Round action exact Add a round `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:402`
- vNext now: New action text Add round `src/components/hr/hr-drive-draft-form.tsx:404`
- Fix: Rename to Add a round

## G2-11-004-015  [P2] GAP  facet F03  effort S
- Legacy: Start over action on restored draft alert `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:341`
- vNext now: Restore and Clear actions separate `src/components/hr/hr-drive-draft-form.tsx:483`
- Fix: Retain Start over in restored banner

## G2-11-004-016  [P2] GAP  facet F04  effort S
- Legacy: Role title label and placeholder e.g. Software Engineer `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:361`
- vNext now: Role title input max200, no placeholder `src/components/hr/hr-drive-draft-form.tsx:277`
- Fix: Restore placeholder and required cue

## G2-11-004-017  [P2] GAP  facet F04  effort S
- Legacy: Description (optional), TextArea rows4 `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:362`
- vNext now: Job description, Textarea rows5 max5000 `src/components/hr/hr-drive-draft-form.tsx:281`
- Fix: Match label, rows4 and optional wording

## G2-11-004-021  [P2] GAP  facet F04  effort S
- Legacy: Location (optional) no explicit max `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:366`
- vNext now: Location max180 without optional in label `src/components/hr/hr-drive-draft-form.tsx:285`
- Fix: Match optional label, document max cap

## G2-11-004-022  [P2] GAP  facet F04  effort S
- Legacy: Pay Card isolated from Eligibility `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:371`
- vNext now: Compensation and eligibility merged section `src/components/hr/hr-drive-draft-form.tsx:329`
- Fix: Split into Pay and Eligibility

## G2-11-004-023  [P2] GAP  facet F04  effort S
- Legacy: CTC (LPA) or CTC after the internship (LPA, optional) `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:373`
- vNext now: CTC (LPA) after the internship (optional) `src/components/hr/hr-drive-draft-form.tsx:332`
- Fix: Exact conditional label

## G2-11-004-026  [P2] GAP  facet F04  effort S
- Legacy: Eligibility helper: Leave these blank to include every registered student `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:406`
- vNext now: Compensation/eligibility submission explainer `src/components/hr/hr-drive-draft-form.tsx:391`
- Fix: Restore legacy helper and empty defaults

## G2-11-004-027  [P2] GAP  facet F05  effort S
- Legacy: Branches tags Select with allowClear, comma token separators, All branches placeholder `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:408`
- vNext now: Comma-delimited Input with datalist of branches `src/components/hr/hr-drive-draft-form.tsx:373`
- Fix: Use tag-select and exact placeholder

## G2-11-004-029  [P2] GAP  facet F05  effort S
- Legacy: Passing year suggestions current calendar year and next two `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:411`
- vNext now: No date-derived suggestion dropdown `src/components/hr/hr-drive-draft-form.tsx:386`
- Fix: Restore three-year suggestions

## G2-11-004-030  [P2] GAP  facet F05  effort S
- Legacy: Minimum CGPA InputNumber min0/max10/step0.1 `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:414`
- vNext now: Minimum CGPA 0–10 text decimal `src/components/hr/hr-drive-draft-form.tsx:361`
- Fix: Use numeric up/down increments/field behavior

## G2-11-004-031  [P2] GAP  facet F05  effort S
- Legacy: Round kind labels Company talk, Test, Vendor test, Group discussion, Interview `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:397`
- vNext now: Raw upper-case kind enum with underscores replaced by spaces `src/components/hr/hr-drive-draft-form.tsx:425`
- Fix: Map five human-readable labels exactly

## G2-11-004-032  [P2] GAP  facet F05  effort S
- Legacy: Round name max100, Round N name placeholder `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:398`
- vNext now: Name max120, no placeholder `src/components/hr/hr-drive-draft-form.tsx:430`
- Fix: Cap100 and show dynamic placeholder

## G2-11-004-033  [P2] GAP  facet F05  effort S
- Legacy: Rows arranged Select width170, flexible Input and Remove `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:397`
- vNext now: Rows become responsive 2-3 column grid with reorder/duplicate `src/components/hr/hr-drive-draft-form.tsx:417`
- Fix: Clone input widths/inline layout

## G2-11-004-034  [P2] GAP  facet F05  effort S
- Legacy: Live preview shows company, mode, location, type, CTC, stipend, CGPA, branches, years `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:425`
- vNext now: Preview only when manually opened, different field groupings `src/components/hr/hr-drive-draft-form.tsx:503`
- Fix: Show legacy fields live in same order

## G2-11-004-059  [P2] GAP  facet F09  effort S
- Legacy: Discard copy The role, eligibility and round changes on this screen will be cleared `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:204`
- vNext now: Consequence Leave without these changes? `src/components/hr/hr-drive-draft-form.tsx:249`
- Fix: Match explanatory modal text

## G2-11-004-061  [P2] GAP  facet F09  effort S
- Legacy: Leaving edited request asks Leave without these changes? `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:224`
- vNext now: Pending leave uses generic ConfirmActionDialog and click interception `src/components/hr/hr-drive-draft-form.tsx:68`
- Fix: Restore mode-sensitive discard consequence

## G2-11-004-062  [P2] GAP  facet F09  effort S
- Legacy: Restored draft alert has Start over action `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:341`
- vNext now: Restore notice only; separate Clear action `src/components/hr/hr-drive-draft-form.tsx:94`
- Fix: Put Start over alongside restored alert

## G2-11-004-063  [P2] MISSING  facet F09  effort S
- Legacy: Unsaved changes orange Tag on edit mode `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:354`
- vNext now: No matching tag in visible form `src/components/hr/hr-drive-draft-form.tsx:67`
- Fix: Add edit-only dirty-state tag

## G2-11-004-065  [P2] GAP  facet F10  effort S
- Legacy: Edited request calls resubmitDriveRequest with request id and body `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:264`
- vNext now: PATCH request with action EDIT/RESUBMIT and expectedUpdatedAt `src/components/hr/hr-drive-draft-form.tsx:190`
- Fix: Preserve edit/resend lifecycle semantics

## G2-11-004-083  [P2] GAP  facet F13  effort S
- Legacy: SubmitError alert Drive request was not sent, closable `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:342`
- vNext now: Notice in form with distinct unverified receipt copy `src/components/hr/hr-drive-draft-form.tsx:225`
- Fix: Restore closable alert headline, accessible focus

## G2-11-004-088  [P2] GAP  facet F15  effort S
- Legacy: Toasts announce submission and approval `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:279`
- vNext now: SessionStorage flash feedback surfaced on drives page `src/components/hr/hr-drive-draft-form.tsx:209`
- Fix: Ensure same role-page confirmation to user

## G2-11-004-091  [P2] GAP  facet F16  effort M
- Legacy: Form + review aside at desktop, form stacked mobile `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:356`
- vNext now: Form itself responsive 2/3 column without aside `src/components/hr/hr-drive-draft-form.tsx:272`
- Fix: Match desktop sidebar and mobile order

## G2-11-004-092  [P2] GAP  facet F16  effort S
- Legacy: Role location/mode two-column field-grid `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:365`
- vNext now: Title+description full width, rest md two cols `src/components/hr/hr-drive-draft-form.tsx:274`
- Fix: Clone grid values and gaps

## G2-11-004-093  [P2] GAP  facet F16  effort S
- Legacy: Rounds layout flex-wrap, compact inputs `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:390`
- vNext now: Grid at 768 and >=992, extra reorder actions `src/components/hr/hr-drive-draft-form.tsx:417`
- Fix: Match compact row wrap breakpoints

## G2-11-004-095  [P2] GAP  facet F17  effort S
- Legacy: Form.Item labels provide accessible error association `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:358`
- vNext now: Wrapping labels but validation issues separate Alert `src/components/hr/hr-drive-draft-form.tsx:275`
- Fix: Add aria-describedby and invalid field focus

## G2-11-004-097  [P2] GAP  facet F17  effort S
- Legacy: Bottom Ant Button loading+disabled when busy `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:419`
- vNext now: VNext disabled when schema invalid/submitting; busy spinner not apparent `src/components/hr/hr-drive-draft-form.tsx:467`
- Fix: Show busy loading and preserve keyboard focus

## G2-11-004-100  [P2] GAP  facet F18  effort S
- Legacy: Section exact Pay `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:371`
- vNext now: Compensation and eligibility combined `src/components/hr/hr-drive-draft-form.tsx:329`
- Fix: Restore Pay

## G2-11-004-101  [P2] GAP  facet F18  effort S
- Legacy: Section exact Rounds `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:390`
- vNext now: Hiring rounds `src/components/hr/hr-drive-draft-form.tsx:398`
- Fix: Rename Rounds

## G2-11-004-102  [P2] GAP  facet F18  effort S
- Legacy: Section exact Eligibility `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:405`
- vNext now: No separate Eligibility heading `src/components/hr/hr-drive-draft-form.tsx:329`
- Fix: Separate Eligibility

## G2-11-004-103  [P2] GAP  facet F18  effort S
- Legacy: Section What students will see `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:425`
- vNext now: What students will see · local preview `src/components/hr/hr-drive-draft-form.tsx:460`
- Fix: Exact heading

## G2-11-004-104  [P2] GAP  facet F18  effort S
- Legacy: Role title placeholder e.g. Software Engineer `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:361`
- vNext now: No placeholder `src/components/hr/hr-drive-draft-form.tsx:277`
- Fix: Restore

## G2-11-004-105  [P2] GAP  facet F18  effort S
- Legacy: Branches placeholder All branches `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:408`
- vNext now: e.g. CSE, ECE, Mechanical `src/components/hr/hr-drive-draft-form.tsx:375`
- Fix: Exact placeholder

## G2-11-004-106  [P2] GAP  facet F18  effort S
- Legacy: Passing year Any year, e.g. 2027 `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:410`
- vNext now: YYYY `src/components/hr/hr-drive-draft-form.tsx:387`
- Fix: Multi-year select and placeholder

## G2-11-004-116  [P2] GAP  facet F21  effort S
- Legacy: Approved/request success toast immediately after POST `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:279`
- vNext now: Message persisted for next-page feedback `src/components/hr/hr-drive-draft-form.tsx:209`
- Fix: Show on same page before navigation

## G2-11-004-125  [P2] GAP  facet F23  effort S
- Legacy: Restored banner Start over `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:341`
- vNext now: Manual Restore saved draft and separate Clear `src/components/hr/hr-drive-draft-form.tsx:482`
- Fix: Reinstate in-banner state/reset
