# Work packet (wave 2): edit src/components/tpo/recruiter-lead-detail-workspace.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md

## G2-11-019-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:203-208`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:419-432`
- Fix: Legacy Invite, Create drive, Team talk and More in top header; vNext Invite and More dropdown contains Create drive / Team talk only when recruiter linked.

## G2-11-019-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:205-207`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:424-426`
- Fix: Legacy Team talk links to company contextual /tpo/messages?tab=team&about=COMPANY:slug; vNext Team talk links plain /tpo/messages if user linked, loses company context.

## G2-11-019-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:186-214`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:414-453`
- Fix: Legacy header name/company/stage/invite/owner Facts and left/right cards; vNext PageHeader plus border summary grid and no cards.

## G2-11-019-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:216-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:455-561`
- Fix: Legacy always-expanded Contact and Company Cards side-by-side/stacked, vNext Company collapsed Disclosure before Contact section.

## G2-11-019-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:232-260`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:563-667`
- Fix: Legacy Log an interaction Card right column, Follow-ups and Timeline separate cards; vNext Log activity and Timeline combined plus full-width Follow-ups.

## G2-11-019-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:266-323`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:669-752`
- Fix: Legacy separate Edit, Not now and Add follow-up modals; vNext Edit and Not now Dialog but Add follow-up inline.

## G2-11-019-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:195-198`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:436-442`
- Fix: Legacy Stage/Invite/Owner shown as Facts with StageTag and Invite status Tag; vNext summary text lines, includes Added and Last login.

## G2-11-019-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-208`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:419-432`
- Fix: Legacy top-level Team talk button always for company, vNext More only if recruiter account joined and generic Messages link.

## G2-11-019-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:225-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:455-477`
- Fix: Legacy Company Card displays linked company name and all drives with status tag; vNext collapsed summary only first5 drives, applied/offers and link to Company Memory.

## G2-11-019-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:239-245`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:563-597`
- Fix: Legacy Call/Email/Meeting/Note button bar and Call outcomes Connected/No answer/Call back/Not interested; vNext Call adds Busy/Wrong number and changes Call back wording.

## G2-11-019-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:249-255`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:622-667`
- Fix: Legacy Follow-ups Card header Add modal action, Done button; vNext inline date/time quick choices+Mark done.

## G2-11-019-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:257-260`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:598-618`
- Fix: Legacy Timeline Ant Timeline color blue/gray per event; vNext ordered list grouped by date and no timeline connector.

## G2-11-019-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:191-200`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:436-442`
- Fix: Legacy invite status `recruiterActivity` text and StageTag, vNext direct status map with OPENED/BOUNCED/JOINED; compare exact words.

## G2-11-019-019  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:256-260`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:600-618`
- Fix: Legacy Timeline renders event outcome in lower-case normalized string, vNext activity event type title cased with enum outcome raw.

## G2-11-019-020  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:226-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:458-466`
- Fix: Legacy company drives list includes every drive status; vNext only top 5 and stats applied/offers.

## G2-11-019-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:249-255`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:622-633`
- Fix: Legacy follow-up quick presets Tomorrow/Friday/Next Monday, vNext Tomorrow/In 3 days/In a week.

## G2-11-019-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:281-284`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:635-643`
- Fix: Legacy Ant DatePicker display ddd D MMM, h:mm A and time picker defaults10AM, vNext datetime-local ISO local value; match IST and labels.

## G2-11-019-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:257-260`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:598-618`
- Fix: Legacy timeline order from server, vNext activities list query sorted desc; check first-newest and day grouping.

## G2-11-019-024  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:225-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:461-465`
- Fix: Legacy no company drives shows No drives yet; vNext limited top5 with stats and no exact empty when 0.

## G2-11-019-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:305-316`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:669-695`
- Fix: Legacy Edit fields Name required, Email format and email-or-phone required, Company required, source configurable; vNext form HTML Name required, other fields and source list, server validation differently.

## G2-11-019-026  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:267-284`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:622-645`
- Fix: Legacy Follow-up optional note, required dueAt and quick presets in modal, vNext same fields inline with max500 Note and future-date check.

## G2-11-019-027  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:319-323`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:698-713`
- Fix: Legacy Not now reason length>=2, optional revisit; vNext requires nonempty reason and max255, different min.

## G2-11-019-028  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:242-245`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:576-594`
- Fix: Legacy note placeholder Write a note vs What was said? (optional), logNote max unspecified in FE; vNext Notes max2000 and separate outcome required.

## G2-11-019-037  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:266-285`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:622-646`
- Fix: Legacy Add a follow-up AsyncModal, vNext inline always-visible form.

## G2-11-019-038  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:286-318`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:669-696`
- Fix: Legacy Edit contact details Ant Modal and discard prompt; vNext Dialog plus explicit ConfirmDialog for CLOSE_EDIT/SAVE_EDIT.

## G2-11-019-039  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:319-323`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:698-715`
- Fix: Legacy Not now AsyncModal and Cancel discard; vNext Dialog + confirmations for Mark Not now and Cancel.

## G2-11-019-040  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:203-208`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:422-432`
- Fix: Legacy More Dropdown with Edit details/Not now/Add follow-up; vNext dropdown hides Add follow-up because inline.

## G2-11-019-041  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:98-106`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:160-186`
- Fix: Legacy single getRecruiterLeadPage aggregates lead/drives/follow-ups/timeline; vNext 3 GET calls for lead/activity/followups and separate company detail fetch.

## G2-11-019-045  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:225-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:205-216`
- Fix: Legacy company drives included in initial lead-page response; vNext separate async company detail can fail while lead loads.

## G2-11-019-049  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:207-207`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:426-426`
- Fix: Legacy team-company conversation link accessible even before recruiter account links; vNext Team talk only after recruiterUserId, misses company contextual route.

## G2-11-019-050  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:29-34`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:626-633`
- Fix: Legacy Tomorrow/Friday/Next Monday quick followup date to local10AM, vNext +1/+3/+7 days to JS Date local10AM, week-relative differs.

## G2-11-019-052  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:34-34`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:576-586`
- Fix: Legacy CALL outcomes Connected/No answer/Call back/Not interested; vNext Connected/No answer/Busy/Wrong number/Not interested.

## G2-11-019-054  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:180-182`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:401-411`
- Fix: Legacy error vs notfound distinct titles, vNext combined conditional phase/error with one heading.

## G2-11-019-055  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:225-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:458-475`
- Fix: Legacy No drives yet Company Card, vNext Company summary loading/error/capped list and no exact empty list.

## G2-11-019-061  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:216-232`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:478-620`
- Fix: Legacy 2-column Row/Col contact/company vs log/timeline cards; vNext company Disclosure full-width and Contact/Log grid, followups below. Compare at375/768/1280.

## G2-11-019-062  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:266-323`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:669-715`
- Fix: Legacy modal overlay 520? Ant default, vNext shared Dialog width responsive/full touch controls, pixel differences.

## G2-11-019-063  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:258-260`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:598-618`
- Fix: Legacy Timeline decorative dots and colored statuses, vNext semantic ordered list grouped by day; compare ARIA announcements and focus.

## G2-11-019-068  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:98-106`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:160-186`
- Fix: Legacy single hub GET aggregates page (avoids three requests), vNext lead/activity/followup parallel then company fourth call.

## G2-11-019-069  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:226-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:461-466`
- Fix: Legacy company associated drive list full count, vNext first5 and memory stats. Pagination needed if many.

## G2-11-019-071  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:72-86`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:143-153`
- Fix: Legacy confirms any unsaved interaction/follow-up/edit before leaving; vNext confirmLeave only editing/notNow, inline log/followup drafts may be lost.
