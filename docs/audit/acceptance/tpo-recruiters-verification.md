# TPO Recruiters – chat-2 round 6

| Gap | Status | Evidence |
| --- | --- | --- |
| TPO-recruiters-38 | DONE (source, tests not run) | `src/modules/placements/tpo-recruiter-lead-policy.ts` excludes common private-email providers including icloud/protonmail and capitalizes inferred employer first label, named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`. |

| TPO-recruiters-39 | PARTIAL — OPEN | `src/components/tpo/recruiter-leads-workspace.tsx` restores concise view count and retained Add recruiter lead action; named test `tests/unit/chat2-tpo-recruiter-leads-copy.test.ts`. Other landing page sections remain. |
| TPO-recruiters-40 | PARTIAL — OPEN | `src/components/tpo/recruiter-lead-detail-workspace.tsx` now uses "Edit contact details" and "Save" with existing recruiter leads back link; named test in same file. |
| TPO-recruiters-43 | DONE (source, tests not run) | Table and board show designation and "Unnamed contact" fallback without hiding recruiter actions; named test in same file. |

| TPO-recruiters-07 | PARTIAL — OPEN | Engage Needs doing now uses persisted Follow-ups due, No next step, Gone quiet and Unassigned counts, hides zero chips, shows Nothing right now, and links to active recruiter access; named `tests/unit/chat2-tpo-recruiter-needs.test.ts`. Toggle persistence and other legacy counts remain. |
| TPO-recruiters-39 | DONE (source) | Legacy first-run empty message and count/add action; named `tests/unit/chat2-tpo-recruiter-needs.test.ts`. |

| TPO-recruiters-41 | DONE (source, tests not run) | `tpo-bulk-lead-stage-model.ts` accepts confirmed NEW and keeps derived recruiter stages separate. `tpo-bulk-lead-stage-service.ts` clears Not Now fields, records row audit and retains existing five-minute undo. UI exposes Restore to New. Named `tests/unit/chat2-tpo-recruiter-bulk-new.test.ts`. |

| TPO-recruiters-42 | DONE (source, not run) | Last successful leads and companies snapshots survive errors, with separate Retry warnings. Named `tests/unit/chat2-tpo-recruiter-stale-refresh.test.ts`. |

| TPO-recruiters-24 | DONE (source, not run) | Allowed source labels include imported leads and Zod rejects invalid source with meaningful choices, named `tests/unit/chat2-tpo-lead-modal-source.test.ts`. |
| TPO-recruiters-30 | PARTIAL — OPEN | Edit modal uses field-specific friendly conflict/validation messages and legacy labels; duplicate peer link pending. Named test. |
| TPO-recruiters-36 | PARTIAL — OPEN | Edit and Not now dialogs now trap Tab and close on Escape without unguarded action; board mobile actions/layout still pending. Named test. |

| TPO-recruiters-22 | DONE (source, not run) | Verified existing dual email/phone preflight and explicit link to the named existing lead with disabled duplicate create, named `tests/unit/chat2-tpo-recruiter-existing-contacts.test.ts`. |
| TPO-recruiters-R06 | DONE (source, not run) | Unsubscribed/Not Now invite panel shows the exact legacy warning and disables inviting opted-out people, named test in same file. |

| TPO-recruiters-R02 | DONE (source verified, unrun) | Companies rendered independently of empty lead view, grouped and filtered against actual companies. Named regression in `tests/unit/chat2-tpo-engage-companies-independent.test.ts`. |

| TPO-recruiters-07 | DONE (source; not run) | Exact nonzero Needs doing chips (follow-ups due, no next step, gone quiet, unassigned), collapse toggle, empty sentence, working filter and recruiter-access count; `tests/unit/chat2-tpo-recruiters-needs-toggle.test.ts`. |

| TPO-recruiters-R01 | DONE (source; tests unrun) | Companies tab has inline persisted communication selector, legacy defaults derived from drive/recruiter evidence, search/filter, alias tooltip, Add contact shortcut and CSV. `tests/unit/chat2-engage-company-communication.test.ts`. |

## Chat-2 follow-up — exact copy and legacy inference

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-recruiters-38 | DONE (source; tests unrun) | `src/modules/placements/tpo-recruiter-lead-policy.ts` infers a capitalised first domain label (Acme, Foo-bar) and refuses consumer mail hosts as legacy expects. `tests/unit/tpo-recruiter-lead-policy.test.ts` **infers company only from a non-free work email**, plus `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts` **TPO-recruiters-38**. |
| TPO-recruiters-40 | PARTIAL — OPEN | Detail edit dialog uses legacy **Edit contact details** and **Save** wording without changing server validation; `src/components/tpo/recruiter-lead-detail-workspace.tsx`; `tests/unit/chat2-tpo-recruiter-leads-copy.test.ts` **TPO-recruiters-40 restores edit-action heading and legacy Save label**. Broader detail action wording remains to verify. |

Tests were authored but not run in this builder session.

## Chat-2 continuation — exact detail wording

| TPO-recruiters-40 | DONE (source; tests not run) | `src/components/tpo/recruiter-lead-detail-workspace.tsx` uses **← Recruiter leads**, **Edit contact details**, **Save**, **Not now**, and **Log activity**; `tests/unit/chat2-tpo-recruiter-leads-copy.test.ts` **TPO-recruiters-40 restores edit-action heading and legacy Save label** (also asserts the modal/section wording). |


## Chat-2 UNCONFIRMED decision — 2026-10-17
| ID | Decision | Evidence |
| --- | --- | --- |
| TPO-recruiters-34 | NOT-A-GAP (least privilege) — recruiter lead changes stay behind an active TPO role and persisted `placements.manage`; college administrator membership alone must not silently grant access to all recruiter-contact mutations. College Admin has its own college-scoped placement administration. | `src/app/(authenticated)/tpo/recruiters/page.tsx`, `src/modules/placements/tpo-bulk-lead-stage-service.ts`; `tests/unit/chat2-unconfirmed-recruiter-company-decisions.test.ts` **TPO-recruiters-34 requires an active TPO role…**. |


## Chat-2 OPEN-gap source follow-up
| ID | Status | Evidence |
| --- | --- | --- |
| TPO-recruiters-07 | DONE (source, tests unrun) | The Engage Needs doing strip uses derived Follow-ups due, No next step, Gone quiet, Unassigned counts; zero chips hide, toggle works and the recruiter-access link is factual. `src/components/tpo/recruiter-leads-workspace.tsx`, named **TPO-recruiters-07 provides the actual counted Needs doing chips and zero state** in `tests/unit/chat2-engage-open-gap-decisions.test.ts`. |
| TPO-recruiters-30 | DONE (source, tests unrun) | Validated duplicate-contact conflict now attempts the scoped same-college contact lookup and links to the existing named lead, while preserving draft fields, legacy labels and friendly errors. `src/components/tpo/recruiter-lead-detail-workspace.tsx`, named **TPO-recruiters-30 links a scoped detected duplicate and preserves contact form details** in same test. |
| TPO-recruiters-36 | PARTIAL — OPEN | Board is horizontally scrollable, edit modal traps keyboard focus, stage cards expose a native Move/Actions menu; accessible table selection on narrow phones is still incomplete. Named **TPO-recruiters-36 has horizontally reachable stages…** in same test, not full closure. |


## Chat-2 remaining Engage audit event baseline
| ID | Status | Evidence |
| --- | --- | --- |
| TPO-recruiters-R05 | PARTIAL — OPEN | A college-scoped immutable `PLACEMENTS_RECRUITER_BULK_STAGE` event records changed rows, action and undo metadata; `tests/unit/chat2-inbox-notification-partials.test.ts` named **TPO-recruiters-R05**. Full legacy per-action audit nomenclature/actor reasons and invites/import events still pending. |


## Chat-2 gap-closure continuation (2026-10-18): immutable audit additions

| ID | Evidence and status |
| --- | --- |
| TPO-recruiters-R05 | **PARTIAL / OPEN.** `tpo-crm-service.ts` now emits immutable `activityEvents` in the same transaction for lead-created, contact-edited, explicit Contacted/Not now stage and implicit stage changes after a call. `tpo-recruiter-invite-service.ts` emits an accurate invite-link-created event with `delivery: NOT_SENT` (not a fabricated invite email). `tpo-audit-model.ts` maps event names to user-friendly legacy Audit Log labels. Tests `tests/unit/chat2-engage-immutable-audit.test.ts`. Bulk stage run already has `PLACEMENTS_RECRUITER_BULK_STAGE`. Owner assignment, imports, actual emailed invites and complete bulk undo events remain unverified. |
| TPO-recruiters-17 | **PARTIAL / BLOCKED on outbound provider.** Explicit invite issuance is now audited as a link, not e-mail. Day-4 reminder function and eligibility policy exist but have no verified scheduler/provider. Must not auto-send, mark as mailed or claim email side effects until messaging adapter and provider credentials are configured. Regression test above asserts no fabricated `RECRUITER_LEADS_INVITED_BY_EMAIL` event. |
| TPO-recruiters-07 / 30 / 36 | **Prior work retained.** Needs doing counts and duplicate-contact link source-verified; responsive board partly keyboard accessible; mobile table selection remains OPEN. `tests/unit/chat2-engage-open-gap-decisions.test.ts`. |
| TPO-recruiters-34 | **Intentional restricted permission.** Mutations require explicit scoped placement permission, not merely being a college user. No silent widening during UX freeze. |

No e-mail was sent and no CI tests were executed by this builder.

## Chat-4 final sprint — 2026-10-18

The following 18 gaps were assigned as FIXED-ON-MAIN in `docs/orchestrator/queues/final-sprint.md`. The implementation was inspected against each ID. The named source/model tests are authored but **not run**. `DONE — source verified` is not end-to-end sign-off; `PARTIAL` retains outstanding acceptance instead of overstating parity.

| Gap ID | Decision / status | Implementation evidence and outstanding work |
| --- | --- | --- |
| TPO-recruiters-05 | DONE — safer manual-stage board parity verified | The board deliberately permits drag/drop only for NEW→CONTACTED. Other stages are derived from persisted invitation, access, and drive facts and must not be manually overwritten. Keyboard-usable Move to… / Actions and guarded stage controls provide equivalent access; column caps and scroll are retained. Named `TPO-recruiters-05` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`; source reviewed, tests not executed. |
| TPO-recruiters-06 | DONE — source verified | Recruiters view recognizes campaigns and renders Emails; table/board/companies count-bearing views exist. Named `TPO-recruiters-06` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`. |
| TPO-recruiters-10 | DONE — source verified | Recruiter detail renders company metrics, persisted drives and added date; links resolve within TPO scope. Named `TPO-recruiters-10` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`. |
| TPO-recruiters-11 | DONE — explicit actions accepted | Invite/Resend, company-scoped Create drive, Team talk, Edit, Mark contacted and Not now are directly reachable. Explicit buttons replace the hidden More menu to improve keyboard discoverability, with opt-out and eligibility checks. Named `TPO-recruiters-11` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`; source reviewed, tests not executed. |
| TPO-recruiters-15 | DONE — per-row bulk outcomes verified | Bulk owner/stage commands expose individual ineligible or unchanged outcomes and their reasons, resolve saved owner names, and offer Send an email to selected without pretending emails were sent. Server-side selection and permissions remain authoritative. Named `TPO-recruiters-15` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`; source reviewed, tests not executed. |
| TPO-recruiters-16 | DONE — source verified | Inline stage and owner edit controls POST expected values to scoped bulk endpoints with Not now reason. Named `TPO-recruiters-16` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`. |
| TPO-recruiters-18 | DONE — source verified | Saved view creation, pin cap of five, update, delete, filter and persisted column choices are wired. Named `TPO-recruiters-18` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`. |
| TPO-recruiters-20 | DONE — source verified | Column chooser, persisted columns, sortable Last activity/Next follow-up and display choices are wired. Named `TPO-recruiters-20` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`. |
| TPO-recruiters-21 | PARTIAL — source verified | Company-required add, known-company suggestions, future follow-up and discard confirmation exist; duplicate conflict open-link confirmation needs browser check. Named `TPO-recruiters-21` test in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`. |
| TPO-recruiters-25 | DONE — intentional safer decision | Attention uses last activity, suppresses No next step for RECRUITED and never marks a mere sent invitation UNVERIFIED without verified state. Named `TPO-recruiters-25` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-26 | PARTIAL — source verified | Typed interaction and five call outcomes implemented; legacy automatic follow-up for No answer still needs confirmation. Named `TPO-recruiters-26` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-27 | DONE — source verified | Overdue indication, future date validation and quick follow-up shortcuts implemented. Named `TPO-recruiters-27` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-28 | DONE — source verified | System vs user timeline styling, readable Call outcome and empty timeline copy present. Named `TPO-recruiters-28` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-29 | PARTIAL — source verified | NotFound, Retry and loading recovery present; complete draft-navigation discard coverage still needs browser acceptance. Named `TPO-recruiters-29` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-31 | DONE — source verified | Not now reason required; revisit date rendered in IST locale. Named `TPO-recruiters-31` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-32 | DONE — source verified | Deep-link q, due, view campaigns, add and company prefill are interpreted. Named `TPO-recruiters-32` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-33 | DONE — source verified | Unsubscribed warning and server/UI invitation opt-out guards present. Named `TPO-recruiters-33` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |
| TPO-recruiters-37 | PARTIAL — source verified | Board has native Move menu; dialogs trap focus and support Escape; comprehensive accessibility browser test remains. Named `TPO-recruiters-37` test in `tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts`. |

Source implementations: `src/app/(authenticated)/tpo/recruiters/page.tsx`, `src/components/tpo/recruiter-leads-workspace.tsx`, `recruiter-lead-detail-workspace.tsx`, `recruiter-inline-stage.tsx`, `recruiter-inline-owner.tsx`, `recruiter-saved-view-controls.tsx`, `recruiter-roster-display-controls.tsx`, `src/modules/placements/tpo-recruiter-attention-model.ts`, and `/tpo/recruiters/[leadId]` error/loading boundaries. No UI restyling was introduced for this verification batch.

**Chat-4 final sprint acceptance, batch 1 (TPO-recruiters-05, -06, -10, -11, -15).** Reviewed source contracts and the five named assertions in `tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts`. Derived recruiter stages are not manually draggable: this is an intentional data-integrity rule, not an unresolved missing action. No page restyling. Tests await CI execution.
