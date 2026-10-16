# TPO / Placement eligibility and batch pages: Round R review (legacy `/tpo/batches`, `/tpo/batches/[batchId]`; vNext `/tpo/batches/*`)
Reviewed: 2026-10-16 by Round R agent (independent re-audit done before opening `batches.md`).

## 1. Summary
Round A gaps reviewed: 65. CONFIRMED 62 (some with notes), WRONG 2, SEVERITY-CHANGE 1, MISSED 6.
Discrepancy rate = (MISSED 6 + WRONG 2 + SEVERITY-CHANGE 1) / (65 + 6) = 9 / 71 = **12.7%** (below the 15% re-audit threshold).
Round A is thorough and accurate on the legacy side. The two WRONG rows (TPO-batches-18, -19) are stale: Invite and deadline move/reopen were built on main (commits 4f11d84ac, 4a3a280ed, 36a18df6c) after the audit was written. The MISSED items are fine-grained (invite edge cases, notification wording, import commit semantics).

Sources used: legacy `_hr-tpo-fe` at lms-dev-2026 (`pages/tpo/batches/index.js`, `[batchId].js`, `components/tpo/batches/*`, `ImportPreviewModal.js`, `StudentActions.jsx`, `ReasonPicker.jsx`, `tpoFiles.js`, `GridWorkspace.jsx`, `BatchesService.js`), legacy backend `42LMS-BACKEND/lms` at `lms-dev-2026` (`TpoBatchesController`, `PlacementEligibilityService`, `BatchRegistrationService`, `TpoTeamAccessFilter`), vNext `src/app/(authenticated)/tpo/batches/**`, `src/components/tpo/tpo-batch-*`, `src/modules/placements/*batch*`.

## 2. Round A gap verdicts
| Round A gap ID | Verdict | Note |
|---|---|---|
| TPO-batches-01 | CONFIRMED | Card has no counts or decision bar (`page.tsx` cards show name, program, state, deadline and a static sentence). |
| TPO-batches-02 | CONFIRMED | No journey numbers; `listTpoBatches` reads no learner data at all. |
| TPO-batches-03 | CONFIRMED | Planning/Invited/Finished vs In placements/Not started/Finished. |
| TPO-batches-04 | CONFIRMED | KPI strip counts batches by lifecycle, not working-set student numbers. |
| TPO-batches-05 | CONFIRMED | |
| TPO-batches-06 | CONFIRMED | |
| TPO-batches-07 | CONFIRMED | |
| TPO-batches-08 | CONFIRMED | `tpoBatchNextAction` returns only Review and invite / Monitor batch / Review history. |
| TPO-batches-09 | CONFIRMED | |
| TPO-batches-10 | CONFIRMED | |
| TPO-batches-11 | CONFIRMED | |
| TPO-batches-12 | CONFIRMED | |
| TPO-batches-13 | CONFIRMED | |
| TPO-batches-14 | CONFIRMED | |
| TPO-batches-15 | CONFIRMED | Still UNCONFIRMED whether the banner shows on dev; see section 5. |
| TPO-batches-16 | CONFIRMED | |
| TPO-batches-17 | CONFIRMED | |
| TPO-batches-18 | WRONG | Stale. `TpoBatchInvitationControl` and `POST /api/placements/tpo/batches/[batchId]/invitation` exist: date picker, end of day IST, future-only (`registrationDeadlineAtEndOfDay`), "Invite N", counts eligible not-yet-chosen students, legacy toast text, finished / no deadline / past deadline / nobody eligible errors, `BATCH_INVITED` activity event and in-app notifications (`batch-participation-service.ts:608-662`). Residual differences are TPO-batches-R01 to R03 and R05. |
| TPO-batches-19 | WRONG | Stale. `PATCH .../invitation` moves or clears the deadline ("Deadline moved" / "Deadline removed"); "Reopen and tell them" after expiry notifies unchosen eligible learners in app (`upsertPlacementBatchSettings` `reopenAndTell`, lines 470-520). Residual: R05. |
| TPO-batches-20 | CONFIRMED | No Remind anywhere; `reminder-prep` and `nudge-prep` are read-only drafts (checked all three prep pages). |
| TPO-batches-21 | CONFIRMED | Partly narrowed by the new invite control (it carries "Invite N eligible students to register" and "Registration is open/closed" with Move / Reopen), but there are still no decide / no-students / all-registered states, no Remind, and no "continue on Students" link. Stays S2. |
| TPO-batches-22 | CONFIRMED | SECTION scope exists in the service (`scopeType` enum); the cohort decision route says it never touches it; no UI. |
| TPO-batches-23 | CONFIRMED | |
| TPO-batches-24 | CONFIRMED | |
| TPO-batches-25 | CONFIRMED | |
| TPO-batches-26 | CONFIRMED | `planTpoBatchLifecycle` throws `BATCH_INVITATION_REQUIRED` when finishing a never-invited batch. |
| TPO-batches-27 | CONFIRMED | |
| TPO-batches-28 | CONFIRMED | |
| TPO-batches-29 | CONFIRMED | |
| TPO-batches-30 | CONFIRMED | |
| TPO-batches-31 | CONFIRMED | Import requires `studentCode` = membership UUID (`eligibilityImportRowSchema`). |
| TPO-batches-32 | CONFIRMED | |
| TPO-batches-33 | CONFIRMED | `getTpoBatchStudents` limit 26, offset (page-1)*25. |
| TPO-batches-34 | CONFIRMED | |
| TPO-batches-35 | CONFIRMED | |
| TPO-batches-36 | CONFIRMED | |
| TPO-batches-37 | CONFIRMED | |
| TPO-batches-38 | CONFIRMED | |
| TPO-batches-39 | CONFIRMED | |
| TPO-batches-40 | CONFIRMED | |
| TPO-batches-41 | CONFIRMED | History reads `scopeType = COHORT` only (`listTpoBatchHistory`). |
| TPO-batches-42 | CONFIRMED | `tpo-participation-service.ts` writes only an `activity_events` row (line 313), no `placement_eligibility_events` row. |
| TPO-batches-43 | CONFIRMED | |
| TPO-batches-44 | CONFIRMED | |
| TPO-batches-45 | CONFIRMED | |
| TPO-batches-46 | CONFIRMED | |
| TPO-batches-47 | CONFIRMED | |
| TPO-batches-48 | CONFIRMED | Inline decision still enabled for a finished batch; the legacy backend does not check either. |
| TPO-batches-49 | CONFIRMED | |
| TPO-batches-50 | CONFIRMED | |
| TPO-batches-51 | CONFIRMED | |
| TPO-batches-52 | CONFIRMED | |
| TPO-batches-53 | CONFIRMED | Rules page shows deadline, invited, finished and the batch decision only; no override editor. |
| TPO-batches-54 | CONFIRMED | `rulesOverride` is carried through the upserts unchanged and never read by a rules resolver. |
| TPO-batches-55 | CONFIRMED | |
| TPO-batches-56 | CONFIRMED | |
| TPO-batches-57 | CONFIRMED | `tpoBatchDecisionSchema` reason is `min(3).max(500)` while the control caps at 200. |
| TPO-batches-58 | CONFIRMED | |
| TPO-batches-59 | CONFIRMED | |
| TPO-batches-60 | CONFIRMED | |
| TPO-batches-61 | CONFIRMED | |
| TPO-batches-62 | CONFIRMED | |
| TPO-batches-63 | SEVERITY-CHANGE | S2 to S3. Part of it is now false: invite and reopen write the `BATCH_INVITED` / `BATCH_REGISTRATION_REOPENED` activity events and `in_app_notifications` rows (`batch-participation-service.ts:496-520,636-662`). What remains (REGISTRATION_REMINDER / BATCH_REMINDED, bulk-run audit) duplicates TPO-batches-20, -32, -44. Notification content is TPO-batches-R03. |
| TPO-batches-64 | CONFIRMED | Evidence upgraded, no longer UNCONFIRMED on the legacy side: `TpoTeamAccessFilter.java:21-56` lets ROLE_TPO, ROLE_ADMIN, ROLE_SUPER_ADMIN and faculty added as TPO admins on Settings > Team through. vNext `requireTpoBatchActor` demands a persisted active `TPO` membership role. Whether vNext Team maps TPO admins to the `TPO` role is still to be checked (section 5). |
| TPO-batches-65 | CONFIRMED | |

## 3. MISSED gaps
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| TPO-batches-R01 | Invite is refused when every eligible student has already chosen or applied. Legacy still opens registration in that case (sets the deadline and `invitedAt`, notifies nobody, toast "Deadline set to D MMM"); it refuses only when nobody in the batch is eligible. In vNext `invitable === 0` disables the Invite button ("No eligible students remain to invite.") and the service throws `NO_ELIGIBLE_STUDENTS`; the `EVERYONE_REGISTERED` message in the control is never produced. Knock-on: such a batch can never get `invitedAt`, so "Mark finished" stays disabled (finish needs `invitedAt`). | VALIDATION | S3 | `BatchRegistrationService.java:110-115,118`; `[batchId].js:214-216` | `tpo-batch-invitation-service.ts:35-36`; `tpo-batch-invitation-control.tsx:15-24,31-33,127`; `tpo-batch-lifecycle-model.ts:10` |
| TPO-batches-R02 | Invite is not atomic. `inviteTpoBatch` runs `upsertPlacementBatchSettings` (transaction 1, writes the deadline) and then `markPlacementBatchInvited` (transaction 2, sets `invitedAt`, writes event and notifications). If the second fails (stale version, DB error) the deadline is saved but the batch is not invited, and the TPO sees "Could not invite this batch." Legacy `invite` is one `@Transactional` method. | SIDE-EFFECT | S3 | `BatchRegistrationService.java:104-125` | `tpo-batch-invitation-service.ts:39-49` |
| TPO-batches-R03 | Notification content is generic. Legacy REGISTRATION_OPEN carries the deadline date and batch name (`Map.of("deadline", when, "batch", name)`). vNext rows say "Your placement cell has invited you to register for placements." and on reopen "...before the new deadline" with no date and no batch name. A student cannot tell which deadline applies. Wording is exact-copy scope (decision 13). | COPY | S3 | `BatchRegistrationService.java:119-122`; `StudentActions.jsx:25` | `batch-participation-service.ts:507-516,653-658` |
| TPO-batches-R04 | Import commit rules and row messages differ. Legacy blocks Confirm while any row is unusable (modal: "N row(s) need attention before you can confirm. Pick a suggestion or skip the row."; the server also refuses: "N row(s) can't be used. Fix or remove them first."), so nothing is silently dropped. vNext asks "Apply N matched eligibility decisions? M rows will be skipped." and saves the matched ones. Row reasons also differ: legacy "Roll number is missing", "Roll number appears twice", "No student with this roll number", "Decision must be Eligible, Ineligible or Not decided", "Ineligible needs a reason"; vNext "Duplicate student ID", "Not an active learner in this batch", "Ineligible reason required". | VALIDATION | S3 | `PlacementEligibilityService.java:299-304,323-324`; `ImportPreviewModal.js:172,198-201` | `tpo-batch-eligibility-import.tsx:39,44-46`; `tpo-eligibility-import-model.ts:34-43` |
| TPO-batches-R05 | Move-deadline controls: legacy date picker disables past days and disables "Move" when the picked date equals the current deadline (`sameDeadline`). vNext uses a bare `type=date` input that accepts past dates (the server answers "The registration deadline has to be in the future" after a round trip), keeps Move enabled with an unchanged date (extra write and version bump), and adds a "Clear deadline" button with no confirm. | VALIDATION | S4 | `BatchTop.jsx:218-219,252,260` | `tpo-batch-invitation-control.tsx:78-107` |
| TPO-batches-R06 | Extra non-legacy surfaces advertise a "draft only" flow now that real Invite exists: `invitation-prep` ("Manual draft only: no ... invitation event or outbound message is created"), `reminder-prep`, `nudge-prep`, two overview links, and a "Registration choices" block with internal text ("Registration choices come from DB08 records ..."). Legacy has none of these; the wording is internal and contradicts the live Invite control. | COPY | S4 | `BatchTop.jsx:209-274` (invite and remind are inline actions) | `[batchId]/page.tsx:57-76`; `invitation-prep/page.tsx:14-15`; `nudge-prep/page.tsx` |

## 4. WRONG and SEVERITY-CHANGE details
- **TPO-batches-18 (WRONG, stale).** Built after the audit: `src/components/tpo/tpo-batch-invitation-control.tsx` (POST), `src/app/api/placements/tpo/batches/[batchId]/invitation/route.ts` (POST invite, PATCH deadline), `tpo-batch-invitation-service.ts`, `tpo-batch-invitation-model.ts` (IST end of day; `formatTpoBatchInviteSuccess` toast "Invited N student(s) to register by D MMM", same as legacy). Mark CLOSED by commit 36a18df6c with R01 to R03 and R05 as residuals. The claim that "Mark finished stays disabled because nothing sets invitedAt" no longer holds except in the R01 case.
- **TPO-batches-19 (WRONG, stale).** PATCH on the same route and the Move / "Reopen and tell them" / "Clear deadline" buttons plus the reopen notification exist (commit 4a3a280ed). Toasts "Deadline moved" / "Deadline removed" match legacy `moveDeadline`.
- **TPO-batches-63 (SEVERITY-CHANGE S2 to S3).** See the table; invite and reopen events and in-app rows now exist, the rest duplicates -20, -32, -44.

## 5. UNCONFIRMED items and how to confirm (for the live check on dev)
1. **Lifecycle storage registered on dev** (A15/A18): open `/tpo/batches` as a dev TPO; if "Placement batch lifecycle migration is pending" shows, none of the invite work is usable. Same for `placement_eligibility_events`.
2. **Invite end to end on dev**: invite with a future date, a past date, no eligible students, all eligible already registered (R01) and a finished batch; check toast text, `activity_events` BATCH_INVITED, `in_app_notifications` rows and the learner-facing text (R03). Then Move to a past date (R05) and "Reopen and tell them" after expiry.
3. **R02 partial failure**: force a stale `expectedVersion` (two tabs, invite in one, then the other) and inspect `registration_deadline` vs `invited_at`.
4. **College admin and TPO team access** (A64): legacy `TpoTeamAccessFilter` admits ADMIN and TPO-admin faculty. On dev, log in as a college admin and as a faculty added in vNext Settings > Team and open `/tpo/batches`; check whether they hold a `TPO` membership role.
5. **Module flag**: legacy `PlacementAccessFilter` gates `/api/v1/tpo/**` on `module.placements.enabled`. Confirm vNext `/tpo/batches` and the batch APIs deny when the college's Placements module is off (not visible in `requireTpoBatchActor`; may be inside `requirePlacementManageScope`).
6. **Archived or deleted programs, departments and cohorts**: legacy `collegeBatches` filters `is_deleted` on program and department; `listTpoBatches` has no deleted or `cohorts.status` filter. Check a dev college with an archived cohort.
7. **Roster definition**: vNext counts only ACTIVE memberships with `platformStatus ACTIVE`; legacy counts every non-deleted learner of the class. Compare per-batch counts on a college with a suspended learner (matters once TPO-batches-01 is built).
8. **Legacy Excel/CSV export layout** and the exact legacy `REGISTRATION_OPEN` outbox template text: belong to the TPO Students audit and the messaging module; confirm on the running legacy stack or the template file.
