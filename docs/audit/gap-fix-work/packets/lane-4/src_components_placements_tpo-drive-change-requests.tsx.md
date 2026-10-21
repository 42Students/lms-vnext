# Work packet: edit src/components/placements/tpo-drive-change-requests.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy `Discuss` action quotes a request into shared drive Discussion, if handler provided. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:125-133`
- vNext now: vNext comments stay inside an individual change request; no `Discuss` link to main drive Discussion. `src/components/placements/tpo-drive-change-requests.tsx:89-113`
- Fix: Link each request to drive Discussion with request ID/context and preserve main timeline.

## G2-5-023-007  [P1] GAP  facet F03  effort L
- Legacy: Legacy has 11 selectable fields: role title, description, location, job type, mode, deadline, CTC, stipend, CGPA, branches, other. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:29-34`
- vNext now: vNext offers 6 broader fields: deadline, pay, eligibility, location, rounds, other. `src/components/placements/tpo-drive-change-requests.tsx:17-20,62-65`
- Fix: Represent all eleven legacy fields explicitly with compatible typed requests; treat rounds as new.

## G2-5-023-010  [P1] GAP  facet F03  effort M
- Legacy: Legacy exposes one-click Withdraw, conditional Accept or Answer, Decline and Discuss. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:126-134`
- vNext now: vNext exposes Reply, Accept, Answer and Decline simultaneously on recipient rows, and Withdraw only to original creator. `src/components/placements/tpo-drive-change-requests.tsx:98-111`
- Fix: Constrain recipient action to Accept only for PROPOSE and Answer only for ASK; restore Discuss.

## G2-5-023-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy list includes `currentValue`, `answerValue`, `replyText`, `fieldLabel`, `createdByName`, `createdAt`, `resolvedAt`, `direction`, `kind`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83`
- vNext now: vNext stores/list projects `proposedValue`, `reason`, decisionNote, proposerParty, timestamps; no currentValue/answerValue/replyText/createdByName. `src/modules/placements/tpo-drive-change-request-service.ts:82-96`, `src/components/placements/tpo-drive-change-requests.tsx:14-16`
- Fix: Add immutable before-value, distinct answer, decline, author display and resolved timestamp projections.

## G2-5-023-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy ASK hides proposed input; OTHER hides mode and requires note; normal note is optional. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:185-193`
- vNext now: vNext requires proposedValue length>=2 AND reason length>=3 for every mode/field. `src/modules/placements/tpo-drive-change-request-model.ts:2-9`, `src/components/placements/tpo-drive-change-requests.tsx:67-76`
- Fix: Make ASK/OTHER text required in correct conditional field; make note optional for non-OTHER.

## G2-5-023-019  [P1] GAP  facet F06  effort L
- Legacy: Legacy deadline DatePicker with time and disabled past dates; mode/job type Select; description five-row textarea; location/title maxlength255. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:56-67`
- vNext now: vNext uses generic 3-row textarea for every value, no date/list/number-specific input. `src/components/placements/tpo-drive-change-requests.tsx:62-72`
- Fix: Add typed field editors, local→UTC conversion, lengths and input masks.

## G2-5-023-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy answers use special DatePicker/Mode/Job type selection and Decline max1000; answer max2000. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:196-214`
- vNext now: vNext single free-text note >=3 for Accept, Answer, Decline and Withdraw (max2000). `src/components/placements/tpo-drive-change-requests.tsx:94-107`, `src/modules/placements/tpo-drive-change-request-model.ts:6-9`
- Fix: Use typed Answer editor and separate decline rationale; allow Accept without mandatory note.

## G2-5-023-029  [P1] GAP  facet F08  effort M
- Legacy: Legacy success for Accept `Accepted and applied` / `Applied. Students who applied were told.`; for answer `Answered`, decline `Declined`, withdraw `Withdrawn`. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:80-82,125-132,199-204`
- vNext now: vNext generic `Change request accepted/answered/declined/withdrawn.` and no immediate drive mutation. `src/components/placements/tpo-drive-change-requests.tsx:39-46`
- Fix: After implementing application side effects, use accurate action-specific status and applicant notification copy.

## G2-5-023-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy exact errors: `Pick what should change`, `Say what should change`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:102-107`
- vNext now: vNext Zod generic validation with `Could not save change request.`; UI omits field-level details. `src/modules/placements/tpo-drive-change-request-model.ts:3-5`, `src/components/placements/tpo-drive-change-requests.tsx:35-51`
- Fix: Show exact field-specific errors under controls, preserving legacy wording.

## G2-5-023-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy shows load error `Couldn't load the change requests`, toast backend error, and a `Retry` button. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:97-113,160-164`
- vNext now: vNext throws on load instead of inline retry, and mutation strips server reason to generic notice. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:15-17,23-25`, `src/components/placements/tpo-drive-change-requests.tsx:53-55`
- Fix: Add inline fetch failure/retry and surface safe server errors.

## G2-5-023-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy success on create: `Sent. The drive stays in review while they answer.` `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:17-26,108-115`
- vNext now: vNext generic `Change request open.` `src/components/placements/tpo-drive-change-requests.tsx:39-50`
- Fix: Use same college/company success strings for create.

## G2-5-023-030  [P3] GAP  facet F08  effort S
- Legacy: Legacy Ant Design `message.success/error` toasts follow mutation then reload and invoke onChanged. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:108-115`
- vNext now: vNext persistent InlineNotice and router refresh, no legacy toast lifecycle. `src/components/placements/tpo-drive-change-requests.tsx:24-25,46-51`
- Fix: Map toast position/duration and reload hooks to shared notification mechanism.
