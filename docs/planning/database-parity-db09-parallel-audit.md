# DB09 parallel audit: TPO and recruiter operations (2026-10-10)

**Scope:** source-backed initial gap assessment; **NOT schema implementation, not verified field parity**.  
**Branch:** db09-tpo-recruiter-ops-2026 (isolated from db-parity-2026 at c489b2569dd2d2742da2ee17ed313a26853dc4da).  
**Coordination:** [issue #5](https://github.com/42Students/lms-vnext/issues/5).  
**Legacy oracle:** 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5 (prod-2026). Current legacy FE remains to be frozen and walked per user workflow.  
**vNext schema source:** 42Students/lms-vnext@c489b2569dd2d2742da2ee17ed313a26853dc4da.  
**Inventory:** 31 legacy **table candidates**, 279 persisted **field candidates** in docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json. This is not a live database count, and *zero* fields have verified semantic mappings.

## Coordination and ownership boundary

- **DB03**, another chat: groups/electives, group rules, group-backed roster; do not change its 0037 migration or related module.
- **DB04**, another chat: learner/faculty verification, document privacy and marks provenance; DB09 references verification only as a consumed entitlement/evidence contract.
- **DB08**, another chat: placement eligibility, batch lifecycle, registrations, job application/round outcomes, offers, joining and external placement. In DB09 inventory, **job_round** and **student_request** are DB08 implementation-owned; this chat only audits TPO-specific consumer/producer interfaces.
- **DB10** anticipated shared infrastructure: notification outbox/email suppression implementation should be coordinated there. DB09 records required delivery semantics but will not independently implement a competing outbox.
- **DB09 owned:** CRM lead/activity/follow-up, recruiter-private notes/notification reads, college placement policy and company-visible-column settings (DB08 consumes placement policy), secure recruiter sharing, TPO↔HR threads/messages, TPO team/settings/preferences, saved views, student notes, TPO audit/bell/read receipts; scheduling slots and reschedule workflow at the boundary with DB08 rounds.
- Never edit the shared Drizzle migration journal or assign a global migration sequence until branches are reconciled. No production legacy DB access or migration of old data.

## Direct source findings (evidence, not inferred from UI)

1. **Lead funnel has persisted lifecycle state.** Legacy V161 creates tpo_lead, lead_activity and follow_up. Lead stage NEW/CONTACTED/NOT_NOW is manually persisted; invited/joined/drive/recruited states are derived from workflow facts, not arbitrary stored stage strings. Invite token hashes, sent/clicked/bounced/unsubscribed timestamps and follow-up ownership/due/completion are separate concepts. The DB09 field ledger uses *recruiter_lead* / *recruiter_lead_activity* labels after historic source normalization; reconcile final DDL and renames before implementation.
2. **College policies are not equivalent to a job eligibility filter.** Legacy V162 college_placement_rules stores counts_as_placed_at (SELECTED/OFFER_RELEASED/OFFER_ACCEPTED semantics require review), max_held_offers, uplift_pct, min_response_hours and version; college_what_companies_see stores exact-versus-banded marks and visibility switches. vNext has placement_job_eligibility_policies but that is job/candidate-specific, not a complete replacement for either college-level policy row.
3. **Share links are a security workflow.** Legacy V165 tpo_share_link stores hashed link token, recipient email, optional hashed email code with expiration, selected columns, maximum reveal stage, shortlist deadline, expiry and revocation. tpo_share_event records CREATED/OPENED/DOWNLOADED_LIST/DOWNLOADED_ZIP/REVOKED. The current vNext placement schemas inspected contain no dedicated share-link/event table; whether an alternative service exists still needs API and end-to-end verification. Never store plaintext share tokens or OTPs.
4. **Messaging is not a notification substitute.** V165 tpo_message_thread contains college/recruiter/(optional) job scope and last-message timestamp. tpo_message persists sender, body, read receipt and created time. Generic in_app_notifications do not by themselves supply private two-way conversations and per-message visibility.
5. **Drive-day scheduling needs more than a round.** V165 round_slot persists start/end, room/panel, capacity, proposed_by and proposed/confirmed status; round_assignment persists student-specific slot and confirmation; reschedule_request retains reason, requested times, decision/reply; round_attendance retains precise attendance states and marker role. vNext has placement_job_rounds, placement_round_attendance and placement_drive_day_coordinator_assignments, so **partial candidate equivalents exist**; capacity, proposals, student confirmation and reschedule lifecycle still require exact producer/consumer matching.
6. **Operational preferences and notes are durable.** V165 creates tpo_college_settings (templates, SMS cap, trusted domains, prep thresholds, notify switches), tpo_user_prefs, tpo_saved_view (scope/owner/filters), tpo_student_note and tpo_team_member (role plus department). A permissions string or a dashboard read does not prove these persisted user jobs.
7. **Notification read states differ.** V184 added per-reader tpo_bell_read because shared tpo_bell.read_at incorrectly marked all users read. V176 hr_notification_read stores recruiter-college read-through time for derived HR feed. vNext activity_events + in_app_notifications provides user-level reads; explicitly validate actor/college mapping, legacy read-through semantics, derived feeds, and duplicate/event delivery before considering replacement.
8. **Private recruiter applicant notes have a privacy boundary.** V177 hr_applicant_note contains rating 1–5 and note limited to the authoring recruiter. No TPO, student or other recruiter may read it. The DB09 ledger calls the candidate recruiter_applicant_note; do not blindly equate names or move private notes to a shared TPO note feed.
9. **General audit is a candidate, not automatic parity.** Legacy V165 tpo_audit_log captures TPO/HR/SYSTEM/STUDENT actor, action, entity and detail. vNext activity_events captures college/module/actor/subject/metadata and may be a valid redesign **if** every TPO writer emits immutable useful events and authorization/read filtering is demonstrated.
10. **Current vNext partial foundations are real.** Placement schemas already include placement_companies, placement_company_relationships, placement_recruiter_profiles and placement_recruiter_college_grants; placements TPO operations service currently exposes a read-only operations aggregator; recruiter-service supports listing/granting/revoking grants and listing recruiter jobs. They do not alone close leads, messages, share links, notes or TPO settings.

## Per-table candidate reconciliation (all 31; no verified mappings)

| Legacy inventory candidate | Preliminary vNext candidate / disposition | Owning integration |
| --- | --- | --- |
| college_placement_rules | None in checked placement schema; new college rules/config candidate | DB09 → DB08 policy consumer |
| college_what_companies_see | None in checked placement schema; explicit visibility config required | DB09 secure sharing |
| company | placement_companies candidate (field parity unproven) | DB09 |
| drive_group | No dedicated candidate; cross-college recruiter drive grouping needs workflow check | DB09 / DB08 jobs |
| email_suppression | No dedicated candidate; coordinate shared sender infrastructure | DB10 dependency |
| follow_up | No dedicated candidate; CRM follow-up workflow | DB09 |
| industry_company | placement_companies + placement_company_relationships candidates | DB09 |
| job_round | placement_job_rounds candidate | DB08-owned round |
| notification_outbox | No dedicated candidate; delay/undo/retry semantics need central sender | DB10 dependency |
| prep_assignment | No dedicated candidate; assigned prep coursework workflow | DB09 / courses consumer |
| recruiter_applicant_note | No private recruiter note table found in checked schemas | DB09 |
| recruiter_lead | No dedicated candidate; validate V161 rename/history | DB09 |
| recruiter_lead_activity | No dedicated candidate; validate V161 rename/history | DB09 |
| recruiter_notification_read | in_app_notifications candidate for user reads; HR read-through is separate | DB09 |
| reschedule_request | No dedicated candidate; slot/reschedule workflow | DB09 / DB08 round |
| round_assignment | No dedicated candidate; per-applicant slot and confirmation | DB09 / DB08 round |
| round_slot | No dedicated candidate; capacity and proposed/confirmed lifecycle | DB09 / DB08 round |
| student_request | placement_learner_requests candidate | DB08-owned requests |
| tpo_audit_log | activity_events candidate, but writer/filter parity unproven | DB09 / DB10 audit conventions |
| tpo_bell | in_app_notifications + activity_events candidates | DB09 notifications |
| tpo_bell_read | in_app_notifications.read_at candidate, scoped recipient/read parity required | DB09 notifications |
| tpo_college_settings | No dedicated candidate; templates/trusted domains/SMS and prep config | DB09 |
| tpo_coordinator_assignment | placement_drive_day_coordinator_assignments candidate | DB09/DB08 drive-day |
| tpo_message | No dedicated candidate; two-way private message | DB09 |
| tpo_message_thread | No dedicated candidate; private general/drive thread | DB09 |
| tpo_saved_view | No dedicated candidate; user-filter/scope persistence | DB09 |
| tpo_share_event | No dedicated candidate; immutable share-access events | DB09 |
| tpo_share_link | No dedicated candidate; hashed, expiring recipient-limited share | DB09 |
| tpo_student_note | No dedicated candidate; placement-cell-only note | DB09 |
| tpo_team_member | Membership permissions candidate; department-restricted coordinator state unproven | DB09 |
| tpo_user_prefs | No dedicated candidate; faculty-specific notices config | DB09 |

**Important:** “No dedicated candidate” means not found in the specific source schema files read here, **not proof that the live behavior is absent**. Every field remains UNVERIFIED pending producer/consumer and Postgres probes; see the companion JSON ledger.

## Implementation order (owned DB09 slices only)

**DB09-A — College controls + CRM kernel:** field-wise contract for policy/version, company visibility, leads, activities and follow-ups. Build scoped unique/FK constraints; records must belong to the same college; invites are hashed and stage changes are source-derived. Transactional create/edit/completion and de-duplication with negative cross-college and duplicate lead tests.

**DB09-B — Private recruiter collaboration:** grants are existing; add private recruiter applicant notes, TPO↔HR threads/message read receipts, and secure share links/events. Link expiry/revocation, recipient verification, field allowlist, stage ceiling, and strict tenant scope are mandatory before endpoints/UI. Test another recruiter, student, faculty and tenant cannot read private notes or share data.

**DB09-C — Day-of-drive & operations:** implement round slots/capacity, assignment, confirmations, reschedule requests, TPO team/dept restrictions, saved views and college templates. Integrate with DB08 round statuses and DB10 outbox (no duplicate implementation). Preserve slot and follow-up concurrency; abort whole transaction on capacity violation.

**DB09-D — Evidence/release:** pin fresh legacy FE/BE heads and enumerate every API and UI producer/consumer; execute disposable PostgreSQL migration replay, Drizzle checks, DB integration tests, permission denials, event read-state tests, retries/idempotency, index/query plans, and browser checks. No domain may be marked VERIFIED until all 279 fields are individually classified or approved redesigned/retired.

## Specific adversarial tests to create/execute

- Forge an otherwise valid recruiter grant against another college's company/job; deny before any data return.
- Revoke a share link while an applicant ZIP/list is being fetched; deny further access, record only safe audit metadata.
- Replay a one-time emailed share code; second use must fail; expiry/shortlist deadline and column/stage redaction must never be widened by client input.
- Confirm two applicants into a capacity=1 slot concurrently; exactly one succeeds.
- Try to read HR applicant note as another recruiter, TPO, superadmin-by-default, or learner; deny unless a separately approved break-glass path is designed (not assumed).
- Send duplicate lead invites with concurrent requests; enforce idempotency, unsubscribe/suppression and audit.
- Mark one TPO bell read; another teammate remains unread, including the V184 compatibility nuance.
- Claim the same notification outbox job from two workers; only one send; ensure undo cancels not-yet-sent messages.
- Attempt a saved view referencing a second college's lead or sharing private visibility defaults; deny.
- Attempt forged faculty/TPO actor type and cross-college thread member; deny at authorization and persistence boundaries.

## Quality/evidence ledger

- **Inventoried:** 31 tables / 279 fields (pre-existing source candidate ledger; checked structure and source migrations).
- **Verified field semantics:** 0 / 279. **Reviewed retirements:** 0.
- **Executed PostgreSQL migrations/integration tests:** 0; no database environment used.
- **Code changes to application/schema:** 0. This audit is a non-overlapping coordination and requirements deliverable.
- **Pending:** full source exact column mapping, legacy frontend surface checks, all producer/consumer handlers, live disposable DB assertions, final parity signature.

The companion JSON tracks every source-derived field without falsely treating name-based matches as verified.