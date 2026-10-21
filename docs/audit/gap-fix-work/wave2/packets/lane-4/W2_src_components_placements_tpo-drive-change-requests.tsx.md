# Work packet (wave 2): edit src/components/placements/tpo-drive-change-requests.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy card order: title/action, error/empty, then `Company requests` followed by `Institutional requests (yours)` (college side). `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:160-168`
- vNext now: vNext order: inline notices, expandable composer, one unsplit chronological list. `src/components/placements/tpo-drive-change-requests.tsx:53-80`
- Fix: Render two directional sections with exact legacy headings and order.

## G2-5-023-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy list row shows field/tag, previous→proposed, note/answer/decline, author/time, trailing actions. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:136-156`
- vNext now: vNext row shows field/mode/status, proposed/question text, reason, decision and nested discussion, without old/new comparison. `src/components/placements/tpo-drive-change-requests.tsx:81-114`
- Fix: Add old-to-new comparison, actor and timestamp and move actions to row affordance.

## G2-5-023-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy OPEN tag text `Waiting`; REPLIED tag displays `Declined`, with antd tag tones. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:70-70,136-139`
- vNext now: vNext renders raw `OPEN`/`DECLINED` labels in status badges. `src/components/placements/tpo-drive-change-requests.tsx:83-85`
- Fix: Use legacy human-readable status labels, including Waiting.

## G2-5-023-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy button is `Request a change`; list title is `Change requests`. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:160-165`
- vNext now: vNext composer header `Suggest a change or ask the company` and `Change requests · N`. `src/components/placements/tpo-drive-change-requests.tsx:56-79`
- Fix: Match legacy labels and preserve count elsewhere if desired.

## G2-5-023-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy formats deadline in viewer local time, mode as words, CTC `LPA`, stipend `₹… a month`, HTML description as plain text, creator date `D MMM YYYY, h:mm A`. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:45-54,140-153`
- vNext now: vNext uses raw proposed value and uppercase machine field; author and creation date absent. `src/components/placements/tpo-drive-change-requests.tsx:83-93`
- Fix: Implement per-field formatting and creator/date on each request.

## G2-5-023-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy splits lists by direction into two sections with independent row actions. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:118-120,165-166`
- vNext now: vNext one undivided list with shared action renderer. `src/components/placements/tpo-drive-change-requests.tsx:78-114`
- Fix: Restore incoming/outgoing grouping, retaining creation order within group.

## G2-5-023-017  [P2] GAP  facet F06  effort M
- Legacy: Legacy create modal: field initially blank and mandatory; kind starts PROPOSE and appears only once a non-OTHER field selected. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:168-193`
- vNext now: vNext inline composer defaults to DEADLINE and SUGGEST, displays type regardless of field. `src/components/placements/tpo-drive-change-requests.tsx:19-21,56-76`
- Fix: Start with unselected field and show typed input/mode conditionally.

## G2-5-023-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy request owner on either side can withdraw an open request. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:126-127`
- vNext now: vNext only creatorUserId can withdraw, even if another TPO/team member belongs to the proposer side. `src/modules/placements/tpo-drive-change-request-service.ts:133-136`, `src/components/placements/tpo-drive-change-requests.tsx:108-111`
- Fix: Decide whether side-level or creator-level ownership is intended; retain legacy team capability if required.

## G2-5-023-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy `Request a change` AsyncModal includes conditional field picker, radio kind, value and note; cancel callback resets modal. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:168-194`
- vNext now: vNext Disclosure inline form, no modal nor openAsk deep trigger. `src/components/placements/tpo-drive-change-requests.tsx:56-77`
- Fix: Restore legacy modal and external trigger/openAsk state.

## G2-5-023-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy Answer/Decline AsyncModal with heading, value picker/textarea and conditional max/disabled rules. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:196-214`
- vNext now: vNext inline text box and three-button ConfirmDialog (Accept/Decline/Withdraw only). `src/components/placements/tpo-drive-change-requests.tsx:89-124`
- Fix: Use dedicated Answer/Decline modal with typed value, pre-submit UX.

## G2-5-023-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy loading card spinner, failed load inline alert/retry, empty sides-specific guidance. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:84-105,160-164`
- vNext now: vNext server-rendered page with generic thrown error; empty `No change requests for this drive.` `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:15-25`, `src/components/placements/tpo-drive-change-requests.tsx:79-80`
- Fix: Add loading/error/retry/empty states with original side-specific copy.

## G2-5-023-048  [P2] GAP  facet F13  effort M
- Legacy: Legacy save errors show `That didn't work` with backend reason and remain editable. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:108-115`
- vNext now: vNext generic `Could not save change request.` and clears only on success; network and session failure share one notice. `src/components/placements/tpo-drive-change-requests.tsx:26-51`
- Fix: Distinguish offline/session/validation/conflict and preserve entered data.

## G2-5-023-049  [P2] GAP  facet F14  effort M
- Legacy: Legacy change-request unit contains no export/import/download/upload controls; invite includes copy mailto fallback. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:160-218`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:39-121`
- vNext now: vNext request page no upload/export; no mail fallback on this page. `src/components/placements/tpo-drive-change-requests.tsx:53-125`
- Fix: No export/import parity work; restore invitation letter copy/mailto as an integration.

## G2-5-023-054  [P2] GAP  facet F18  effort S
- Legacy: Legacy headings/copy: `Company requests`, `Institutional requests (yours)`, `Request a change`, `What should change`, `How`, `New value`. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:16-26,168-192`
- vNext now: vNext headings/copy: `Suggest a change or ask the company`, `Request type`, `Field`, `Change or question`, `Why is this needed?`. `src/components/placements/tpo-drive-change-requests.tsx:56-79`
- Fix: Copy legacy labels verbatim in equivalent UI surfaces.

## G2-5-023-055  [P2] GAP  facet F18  effort S
- Legacy: Legacy empty strings explain 'drive stays where it is', and OPEN label is `Waiting`. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:19-25,70-70,163-164`
- vNext now: vNext empty generic and raw OPEN machine label. `src/components/placements/tpo-drive-change-requests.tsx:80-85`
- Fix: Use side-aware instructional empty states and Waiting badge.
