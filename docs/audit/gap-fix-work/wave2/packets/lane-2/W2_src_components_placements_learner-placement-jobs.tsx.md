# Work packet (wave 2): edit src/components/placements/learner-placement-jobs.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md, docs/audit/gap2/lane-19/apply-to-job-request.md

## G2-14-005-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy jobs cards have colored accent rail+48px company avatar+fixed three-fact column+heart action; vNext full-width border-bottom item rows with separate action sections — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:153-269`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:520-540`; `src/components/placements/learner-save-drive-button.tsx:30-37`
- Fix: Use exact legacy four-column card, accent, avatar and compact facts grid

## G2-14-005-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy CTC raw `ctcRange` fallback Not disclosed; vNext formatted numeric INR LPA min-max range — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:220-227`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:114-132`
- Fix: Honor legacy raw compensation display including ranges after schema mapping

## G2-14-005-017  [P2] GAP  facet F04  effort S
- Legacy: Legacy Deadline labels Closes today/tomorrow/in 3d/7d, Closed D MMM YYYY, No deadline set; vNext DateTime en-IN and urgency component — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:71-83,229-236`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:134-140`
- Fix: Use exact urgency label and tone thresholds from legacy

## G2-14-005-019  [P2] GAP  facet F04  effort S
- Legacy: Legacy Posted {relative age} via formatPostedAgo; vNext Intl static Posted D MMM YYYY — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:144-145,215-215`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:494-501`
- Fix: Show legacy relative posted time and update calendar unit appropriately

## G2-14-005-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy badges include job type, actual application stage, Not open to you/Applications closed; vNext statuses based on eligibility and application — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:165-174,425-430`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:286-382`
- Fix: Keep precise stage chip mapping (shortlisted/interview/offered) on card

## G2-14-005-022  [P2] GAP  facet F04  effort S
- Legacy: Legacy blocked reason from visibilityReason plus `Open it to see its rules ...`; vNext failed/missing eligibility criteria with links — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:195-202`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:368-382`
- Fix: Preserve reason/CTA copy and show detailed criteria in secondary area

## G2-14-005-057  [P2] GAP  facet F12  effort S
- Legacy: Legacy urgency at local today/tomorrow ≤3/≤7; vNext uses server timestamp snapshot and urgency helper — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:71-83`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:98-106`; `src/components/placements/learner-placement-jobs.tsx:134-140`
- Fix: Make threshold calendar aware and copy exact badges

## G2-14-005-061  [P2] GAP  facet F13  effort S
- Legacy: Legacy no open jobs with empty illustration and line No open jobs right now, secondary college cell text; vNext new EmptyState and dashboard link — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:920-932`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:245-252`; `src/components/placements/learner-placement-jobs.tsx:511-517`
- Fix: Match no-open heading, SVG, subtitle and spacing

## G2-14-005-068  [P2] GAP  facet F16  effort M
- Legacy: Legacy desktop fixed card facts 3 aligned slots; vNext text cards responsive flex at lg and embedded apply controls — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:218-269`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:520-540`
- Fix: Restore 3-slot desktop facts column, switch to stacked mobile

## G2-14-005-075  [P2] GAP  facet F18  effort S
- Legacy: Legacy error No open jobs right now, vNext No live opportunities yet — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:920-932`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:511-517`
- Fix: Use exact empty headline

## G2-15-005-064  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Back to drives`, `Placements`, `Drives`, `Apply now`, `Withdraw this application` (JobDetailContent.jsx:749-767,888-900,1000-1010)
- vNext now: VNext breadcrumbs `My Placements` + `Drives`, button `Apply to this role`, `Ask to withdraw` (learner-placement-job-detail.tsx:46-50; learner-placement-jobs.tsx:286-300,394-405)
- Fix: Map exact old labels where same action, explicitly label approval request when workflow differs

## G2-19-021-045  [P2] GAP  facet F20  effort M
- Legacy: Old client status reconciliation runs after lost network response. `docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:598-615`
- vNext now: vNext server idempotence is present but client error toast is immediate. `src/modules/placements/application-service.ts:808-818` `src/components/placements/learner-placement-jobs.tsx:232-239`
- Fix: Reconcile client state with server after ambiguous response.
