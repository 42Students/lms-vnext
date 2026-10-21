# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l11-u020-tpo-recruiters.md

16 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u020-tpo-recruiters.md

## G2-11-020-010  [P1] GAP  facet F03  effort M
- Legacy: Recruiters with access shown if recruiter-access API succeeds, count ACTIVE&&!expired (index.js:237-239,522).
- vNext now: Count recruiterUserId in roster, always link /tpo/settings/recruiters (recruiter-leads-workspace.tsx:726-729).
- Fix: Count only active nonexpired access grants from access service; match link /tpo/settings?tab=recruiters.

## G2-11-020-012  [P1] GAP  facet F04  effort M
- Legacy: Status derived LEAD/INVITED/JOINED from recruiterId and inviteStatus (index.js:74-76,430-433).
- vNext now: Joined/Unsubscribed/Not joined, no Invited visible status (recruiter-leads-workspace.tsx:74-76).
- Fix: Derive exact LEAD/INVITED/JOINED statuses and status label/badge.

## G2-11-020-025  [P1] GAP  facet F05  effort M
- Legacy: Status filter LEAD, INVITED, JOINED (index.js:74-83).
- vNext now: Status filter ALL, JOINED, UNSUBSCRIBED, NOT_JOINED (recruiter-leads-workspace.tsx:774-779).
- Fix: Match exact status buckets, keep unsubscribed as separate opt-in extra filter.

## G2-11-020-028  [P1] GAP  facet F05  effort L
- Legacy: Board allowed drop actions Contacted, Not now, Invite, Create drive (index.js:476-487,560-575).
- vNext now: Only CONTACTED drop accepts; other move paths inline or external (recruiter-leads-workspace.tsx:1059-1071,1098-1118).
- Fix: Restore the four allowed drop outcomes and locked hints, with confirmation.

## G2-11-020-037  [P1] GAP  facet F06  effort M
- Legacy: Follow-up datetime D MMM, h:mm A with optional About text (index.js:653-656).
- vNext now: Date only with time fixed 09:00 IST; note disabled until date (recruiter-leads-workspace.tsx:623-625,1163-1174).
- Fix: Support optional time selection; preserve selected wall time and timezone.

## G2-11-020-046  [P1] GAP  facet F09  effort L
- Legacy: InviteModal opens per contact; email send/resend based on mail status (index.js:311-321,473,687).
- vNext now: Creates one-time invite link with sendEmail:false and copy dialog (recruiter-leads-workspace.tsx:513-538,880-890).
- Fix: Provide email invite/resend flow and consent-safe fallback, retain one-time link optional.

## G2-11-020-050  [P1] GAP  facet F11  effort M
- Legacy: Owner choices only self, TPO/admin accounts and placement team; excludes other faculty (index.js:221-236).
- vNext now: Client list appears derived ownerName from lead rows (recruiter-leads-workspace.tsx:781-789).
- Fix: Scope owner editor choices to authorized staff from team membership, not lead-only values.

## G2-11-020-052  [P1] GAP  facet F12  effort M
- Legacy: Stages facts INVITED/JOINED/DRIVE_PLANNED/RECRUITED; manual NEW/CONTACTED/NOT_NOW only (index.js:131-132,435-440).
- vNext now: Same stage list but local board restricts drag only NEW→CONTACTED (recruiter-leads-workspace.tsx:1059-1085).
- Fix: Preserve stage policy plus all legacy permitted manual actions, lock others.

## G2-11-020-054  [P1] GAP  facet F12  effort L
- Legacy: Email invite skip joined, unsubscribed, missing email, mail disabled (index.js:308-321).
- vNext now: Invite requires emailNorm and companyRelationshipId; sends no email (recruiter-leads-workspace.tsx:513-530).
- Fix: Add mail-template availability check and approved send action, maintain opt-out.

## G2-11-020-059  [P1] GAP  facet F15  effort L
- Legacy: CampaignComposer and InviteModal send emails with unsubscribe, if emailLive (index.js:308-321,628-629,687).
- vNext now: Campaign link to separate page; Invite link explicitly no email (recruiter-leads-workspace.tsx:907-912,513-530).
- Fix: Cross-check campaign and invitation delivery templates/recipients; restore send paths when mail on.

## G2-11-020-064  [P1] GAP  facet F20  effort M
- Legacy: Dirty add beforeunload and routeChangeStart confirmation Discard unsaved recruiter lead (index.js:158-177).
- vNext now: Dirty only close dialog confirmation; route-level beforeunload not visible (recruiter-leads-workspace.tsx:575-584,1196-1213).
- Fix: Protect unsaved draft on browser tab close and route navigation.

## G2-11-020-038  [P2] GAP  facet F07  effort S
- Legacy: Email or phone required error Add an email or a phone (index.js:644).
- vNext now: Aggregate Enter a name and at least one contact method (recruiter-leads-workspace.tsx:586-593).
- Fix: Provide field-level exact error next to contact fields.

## G2-11-020-039  [P2] GAP  facet F07  effort S
- Legacy: Company is required (index.js:647).
- vNext now: Company is required. for length<2 (recruiter-leads-workspace.tsx:594-597).
- Fix: Match punctuation and explain intentional min2 if kept.

## G2-11-020-040  [P2] GAP  facet F07  effort M
- Legacy: Duplicate modal 'This recruiter already exists' Open (index.js:386-390).
- vNext now: Inline 'Contact already exists' and link, different submit error (recruiter-leads-workspace.tsx:601-616,1141-1143).
- Fix: Restore dialog copy and Open existing record action.

## G2-11-020-041  [P2] GAP  facet F08  effort S
- Legacy: Created with follow-up toast 'Recruiter lead added, with a follow-up on your calendar'; normal 'Recruiter lead added' (index.js:398-406).
- vNext now: Always shows Recruiter lead added status regardless of follow-up (recruiter-leads-workspace.tsx:629-655).
- Fix: Distinguish with-followup success wording.

## G2-11-020-043  [P2] GAP  facet F08  effort S
- Legacy: Company communication optimistic rollback toast Couldn't save (index.js:605-614).
- vNext now: Rollback with persistent error 'Couldn't save. Retry this company status.' (recruiter-leads-workspace.tsx:375-389).
- Fix: Match literal feedback or document persistent replacement.
