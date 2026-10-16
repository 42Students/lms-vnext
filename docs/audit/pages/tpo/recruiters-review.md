# Round R review: TPO / recruiters (Engage)

Reviewer for Round A file `docs/audit/pages/tpo/recruiters.md` (TPO-recruiters-01..43). Legacy read: `_hr-tpo-fe` (lms-dev-2026) `pages/tpo/recruiters/index.js`, `[recruiterLeadId].js`, `InviteModal.js`, `ImportPreviewModal.js`, `recruiterLeadStages.js`, `recruiterLeadBoardRules.js`, `recruiterActivity.js`, shared `TpoDataTable`, `GridWorkspace`, `gridExport`, `ActionsWindow`, `BulkAction`, `Campaigns`; backend `42LMS-BACKEND/lms` `TpoRecruiterLeadController`, `TpoRecruiterLeadService`, `TpoRecruiterLeadsHubService`, `TpoHubController` (recruiter-leads-hub, views, mail-status, bulk-record). vNext read on current main: `recruiter-leads-workspace.tsx`, `recruiter-lead-detail-workspace.tsx`, `recruiter-bulk-*-controls.tsx`, `recruiter-lead-csv-import.tsx`, `tpo-crm-service.ts`, `tpo-crm-validation.ts`, `tpo-recruiter-*` models and invite service, bulk owner/stage services, lead API routes.

## 1. Summary

Round A gaps: 43. Verdicts: CONFIRMED 42, WRONG 0, SEVERITY-CHANGE 1 (TPO-recruiters-05). MISSED: 6 (TPO-recruiters-R01..R06). Discrepancy rate = (6 + 0 + 1) / (43 + 6) = 7/49 = 14.3%.

Round A was thorough: my independent audit (46 raw candidate gaps) mapped almost entirely onto its rows, including the board derived-stage bug (04), the chip-rule differences (25), the never-called reminder (17) and the unreachable email invite (12). What it missed is mostly on the Companies tab, which it treated as another agent's area.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| TPO-recruiters-01 | CONFIRMED | vNext table has 7 columns (workspace:434). Legacy IDX:418-474. |
| TPO-recruiters-02 | CONFIRMED | `tpoLeadView` carries no owner name, activity, follow-up, drives (tpo-crm-service.ts). |
| TPO-recruiters-03 | CONFIRMED | Only Stage select plus Needs-doing buttons exist. |
| TPO-recruiters-04 | CONFIRMED | Re-verified: header count `x.stage`, cards `x.manualStage` (workspace:465,467). Real bug, keep S1. |
| TPO-recruiters-05 | SEVERITY-CHANGE | S1 to S2. The data bug that hides cards is 04. Drag/drop, hints and Move menu are convenience: Invite, Create drive, Mark contacted and Not now are reachable elsewhere (detail page, bulk panels). |
| TPO-recruiters-06 | CONFIRMED | Part of the Emails/tab gap sits with the campaigns agent; Companies count is ours (see also R01). |
| TPO-recruiters-07 | CONFIRMED | Also note "Not contacted" and "All contacts" have no legacy counterpart; "Follow-ups due" is a link away, not a filter (legacy filters in place). |
| TPO-recruiters-08 | CONFIRMED | Header comment of `deriveOwnRecruiterLeadStage` agrees (relationship-only evidence). Not traced to every call site; see UNCONFIRMED U4. |
| TPO-recruiters-09 | CONFIRMED | Detail shows `manualStage` (detail:290). |
| TPO-recruiters-10 | CONFIRMED | |
| TPO-recruiters-11 | CONFIRMED | Mark contacted on detail is an improvement over legacy (legacy detail has no such button). |
| TPO-recruiters-12 | CONFIRMED | `invite/route.ts` returns 503 for `sendEmail: true`; invite blocked for NOT_NOW by `canIssueRecruiterInvite`. |
| TPO-recruiters-13 | CONFIRMED | |
| TPO-recruiters-14 | CONFIRMED | |
| TPO-recruiters-15 | CONFIRMED | |
| TPO-recruiters-16 | CONFIRMED | |
| TPO-recruiters-17 | CONFIRMED | grep of `src` and `scripts`: `remindTpoRecruiterInvite` and `canRemindRecruiterInvite` have no caller outside the service/policy. |
| TPO-recruiters-18 | CONFIRMED | No `views` route under `src/app/api/placements/tpo`. |
| TPO-recruiters-19 | CONFIRMED | Severity S1 is defensible (daily TPO use), S2 would also be fair. |
| TPO-recruiters-20 | CONFIRMED | |
| TPO-recruiters-21 | CONFIRMED | |
| TPO-recruiters-22 | CONFIRMED | Legacy checks both email and phone before create (IDX:386-392); vNext check button tests email first, phone never when both are typed. |
| TPO-recruiters-23 | CONFIRMED | Verified legacy cap 5000 (`tpoFiles.js:108`) and `HEADER_ALIASES` (company, companyname, organisation...). Legacy commit also reports `skippedAlreadyThere`. |
| TPO-recruiters-24 | CONFIRMED | |
| TPO-recruiters-25 | CONFIRMED | |
| TPO-recruiters-26 | CONFIRMED | Legacy controller rejects WHATSAPP (`LOGGABLE_ACTIVITY`), vNext offers it. |
| TPO-recruiters-27 | CONFIRMED | |
| TPO-recruiters-28 | CONFIRMED | |
| TPO-recruiters-29 | CONFIRMED | |
| TPO-recruiters-30 | CONFIRMED | |
| TPO-recruiters-31 | CONFIRMED | Legacy detail path needs a 2-character reason (`reason.trim().length < 2`), bulk path "Say why". |
| TPO-recruiters-32 | CONFIRMED | |
| TPO-recruiters-33 | CONFIRMED | Server does refuse invites for unsubscribed leads (`canIssueRecruiterInvite`), but the UI offers the button and the error is generic; see R06 for the wrong copy. |
| TPO-recruiters-34 | CONFIRMED | Legacy inventory header says `/api/v1/tpo/**` allows TPO admin or college admin and PORTAL_GUESTS (ADMIN, FACULTY) reach the portal. Likely real gap; stays S3 until confirmed (U2). |
| TPO-recruiters-35 | CONFIRMED | Environment gate, not a code gap; resolve by U1 then close or raise. |
| TPO-recruiters-36 | CONFIRMED | |
| TPO-recruiters-37 | CONFIRMED | |
| TPO-recruiters-38 | CONFIRMED | Nuance: legacy server `addRecruiterLead` also uppercases the domain label when a client sends no company (older API clients); the legacy UI and import path capitalise (`Acme`) client side and in `companyFromEmail`. The free-mail part is correct. |
| TPO-recruiters-39 | CONFIRMED | |
| TPO-recruiters-40 | CONFIRMED | |
| TPO-recruiters-41 | CONFIRMED | |
| TPO-recruiters-42 | CONFIRMED | |
| TPO-recruiters-43 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-recruiters-R01 | Companies view is much thinner than legacy: no Communication status (Not contacted, Emailed, Replied, Meeting set, Not interested) with inline Select, saved through `PUT /companies/communication` into `tpo_company_outreach` with a derived default (Replied when drives or joined/planned/recruited people, Emailed when invited/contacted, Not interested when all Not now); no People column or "Add a contact" shortcut that opens Add with the company prefilled; no search, no filter panel (Communication, Contact, Drives that ran, Students placed, Typed more than one way), no export; "also N other spellings" tooltip becomes plain text; tab label has no count; companies error is a full-width replace instead of a warning alert. vNext instead adds an Accepted-offer drives column and the text "Pending placement-policy verification" for students placed. | MISSING-FIELD | S2 | IDX:106-118,590-621; HUB:302-323 (derivedCommunication, setCommunication); HC `PUT /companies/communication` | recruiter-leads-workspace.tsx:388-428 (columns Company, Contacts, Drives run, Accepted-offer drives, Students placed); no communication field in `CompanySummary` (:35-46) |
| TPO-recruiters-R02 | Companies tab is unreachable whenever the lead list is empty or the lead filters match nothing. The `visible.length === 0` branch is evaluated before the `view === "companies"` branch, so a college whose companies come only from drives sees "No recruiter leads yet. Add your first contact." and no Companies. The Stage select, Needs-doing buttons and search also silently narrow the Board and Table but their state stays active while on Companies. Legacy Companies lists every company from drives and leads independent of the leads table filters (`companies` built from `facts.jobs` too). | STATE | S2 | HUB:276-281 (companies include drive-only companies); IDX:591-621 | recruiter-leads-workspace.tsx:366-370 (empty branch first), 195-202 |
| TPO-recruiters-R03 | Bulk owner and bulk stage in vNext refuse joined and unsubscribed leads ("Joined or unsubscribed lead is protected"; stage panel lists only `!recruiterUserId && !unsubscribedAt`). Legacy only skips leads that already have that owner (owner) or are already parked/recruited (Not now) or not NEW (Mark contacted); joined recruiters can be assigned an owner and an unsubscribed contact can be parked. Result: joined recruiters cannot be reassigned to another TPO in bulk. | VALIDATION | S3 | IDX:293-307 (skip rules); HUB:133-154 (assignOwner/setStage have no joined/unsubscribed filter) | tpo-bulk-lead-owner-model.ts:42-44; recruiter-bulk-stage-controls.tsx:35-39 |
| TPO-recruiters-R04 | No success feedback for single actions: legacy toasts "Recruiter lead added" / "Recruiter lead added, with a follow-up on your calendar" (and a warning if the follow-up could not be saved), "Owner set", "{name}: {stage}", "{name} marked contacted", "Saved", import "{n} recruiter leads added. Open one to invite them.", "Import saved". vNext add/edit/mark contacted/not now close the dialog or refetch silently; only import shows a result table. Failure texts also differ ("Could not add the recruiter lead", "Could not set the owner", "Could not change the stage"). | COPY | S3 | IDX:402,443,461,481,695; DET:295; ImportPreviewModal.js:112 | recruiter-leads-workspace.tsx:268-272; detail-workspace.tsx:182-192,223-231 |
| TPO-recruiters-R05 | Tenant audit-log events for Engage actions are absent: legacy writes `RECRUITER_LEADS_OWNER_SET`, `RECRUITER_LEADS_STAGE_SET`, `RECRUITER_LEADS_RESTORED`, `RECRUITER_LEADS_IMPORTED`, `RECRUITER_LEADS_INVITED_BY_EMAIL` and a `BULK_RUN` / `BULK_UNDONE` line per bulk run to the TPO audit log (visible on `/tpo/audit`). vNext records only per-lead NOTE rows in the lead's own timeline; no matching event codes found in the TPO audit model. Confirm against `/tpo/audit` (U3). | SIDE-EFFECT | S3 | HUB:140,152,183,238; HC:111-128,155-176 | tpo-bulk-lead-stage-service.ts:74 (NOTE per lead only); no `RECRUITER_LEADS_*` in tpo-audit-model.ts |
| TPO-recruiters-R06 | Detail invite panel gives the wrong reason for unsubscribed leads: when not joined it says "Invites are paused while this lead is marked Not now." even if the block is `unsubscribedAt`. Legacy shows the info alert "This person said they are not hiring from your college this season or unsubscribed." and disables Invite. Related to 33 but a separate copy defect. | COPY | S4 | DET:213; InviteModal | recruiter-lead-detail-workspace.tsx:350-355; tpo-recruiter-invite-policy.ts:57-64 |

## 4. WRONG and SEVERITY-CHANGE details

- TPO-recruiters-05: S1 to S2. The blocking defect (cards missing from every derived-stage column) is recorded in 04 at S1 and fixing it restores a usable board. The remaining items in 05 (drag/drop with locked-column hints, `Move to...` menu, card meta, 5/50 caps, filtered-view alert, horizontal scroll) improve ergonomics; each action it exposes has another path (detail page buttons, bulk panels). Keep 05 as a parity item, not a workflow blocker.
- No WRONG verdicts. Candidate false gaps checked: Mark contacted on detail exists only in vNext (improvement); the vNext import already shows per-row validity before commit (Round A 23 correctly limits itself to the missing duplicate/To fix groups); vNext does infer the company from a work email on create (server side, Round A 38 covers the casing and free-mail list).

## 5. UNCONFIRMED items and how to confirm (batch for the live dev-site check)

| # | Item | How to confirm |
|---|---|---|
| U1 | `DB09_TPO_API_READY` set to `DB09_VERIFIED` on dev (TPO-recruiters-35). | Sign in as TPO, open `/tpo/recruiters`: list vs "awaiting database verification"; or GET `/api/placements/tpo/leads?collegeId=...`. |
| U2 | Can college admin or placement-cell faculty use Engage in legacy (34)? Does vNext let them (page needs role TPO, APIs need `placements.manage`)? | Legacy `src/config/roles.js` PORTAL_GUESTS and `TpoAccessGuard`; live: open `/tpo/recruiters` with a COLLEGE_ADMIN test account. |
| U3 | Whether Engage writes any entry visible on `/tpo/audit` (R05). | Run bulk owner and an import on dev, then open `/tpo/audit` and the lead timeline. |
| U4 | Stage derivation for leads without `companyRelationshipId` (08): does a manually added lead whose company has a published drive reach Drive planned / Recruited? | Dev DB: add a lead for an existing drive company, load list, compare `stage` with legacy rule (same company key, drive created after lead, or own recruiter). |
| U5 | Board: a Joined / Invited lead shows a count but no card (04). | Live: create an invited lead, switch to Board. |
| U6 | Companies tab with zero leads but drive-only companies (R02). | Dev tenant with drives and no leads; open View: Companies. |
| U7 | Whether any scheduler outside `src` sends the day-4 reminder (17). | Check cron/worker config; grep found no caller in `src` or `scripts`. |
| U8 | Legacy `FilterPanel`, `HeaderFilter`, `SavedViewsManager`, `viewMemory` internals (Round A also read these only through callers). | Read the four files before writing the saved-view and filter fix briefs. |
