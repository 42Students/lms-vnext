# Work packet: edit src/components/tpo/recruiter-lead-detail-workspace.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md

## G2-11-019-029  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:490-508`
- Fix: Legacy Invite/Resend invite opens InviteModal with actual send; vNext creates link and manual copy/email draft, automatic delivery unavailable.

## G2-11-019-047  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:348-352`
- Fix: Legacy could invite an unjoined lead with email but no explicitly linked companyRelationship; vNext disabled when companyRelationshipId absent.

## G2-11-019-059  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:490-549`
- Fix: Legacy InviteModal dispatches actual send invitation, vNext explicitly no automatic email delivery and provides mailto/copy. Owner must approve deviation.

## G2-11-019-077  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-207`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:419-432`
- Fix: Company contextual Team talk URL omitted and linked-account prerequisite added; restore topic link.

## G2-11-019-079  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:205-205`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:490-549`
- Fix: Direct Send Invite parity not available: explicit auto email unavailable message, manual link only.

## G2-11-019-030  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:180-182`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:399-411`
- Fix: Legacy separate PanelNotFound / PanelError with Retry / DetailSkeleton; vNext single This recruiter isn’t in Engage error area and Loading recruiter details… text.

## G2-11-019-031  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:157-161`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:300-325`
- Fix: Legacy No answer call auto schedules tomorrow10AM followup and warns if failed; vNext no answer service creates 2-day followup and error handling may differ.

## G2-11-019-032  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:123-129`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:218-255`
- Fix: Legacy mutation error toast from actual backend message, vNext maps status 409/422/503 into specific inline errors.

## G2-11-019-033  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:228-229`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:467-475`
- Fix: Legacy company list errors not separated; vNext Company drive details could not be loaded and remains visible after main detail loads.

## G2-11-019-035  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:160-161`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:357-369`
- Fix: Legacy failed automatic followup after No answer says The call is logged, but ... tomorrow; vNext auto-followup transaction and may not communicate failure.

## G2-11-019-036  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`
- vNext now: `src/components/tpo/recruiter-lead-detail-workspace.tsx:503-508`
- Fix: Legacy Invite success via modal, vNext Invitation created. Copy the message... notice and no auto delivery.
