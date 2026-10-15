# Logic and DB-parity fix backlog (from area audits, 2026-10-16)

Source audits: auth/OTP (agent a0684e66...), projects (aa0bc25b...), placements (af4e4a95...). More area audits will be appended by the NSRIT discovery agent (db-parity-audit.md). Priority: S1 wrong results or data loss; S2 behaviour differs from legacy; S3 minor; S4 improvement. Owner lanes: builders (ChatGPT lanes) take non-protected app logic; Claude agents take protected paths (auth, storage, schema/migrations).

## A. PLACEMENTS (lanes: chat-2 TPO side, chat-5 learner side, Claude agent for schema)
S1
- P-S1-01 Placement rules stored but never enforced (`placement_college_rules`: max_held_offers, uplift_pct, min_response_hours, counts_as_placed_at). Enforce in application-service.ts and offer-service.ts.
- P-S1-02 Debarment never enforced: check in applyToPlacementJob, learner-job-service, issuePlacementOffer, drive-day bulk add.
- P-S1-03 Cohort/program targeting not applied: use isPlacementJobTargetCohort in the learner job list and apply gate.
- P-S1-04 Apply gate lacks finished-batch, registration-choice (CHOSE_OTHER, REGISTER_FIRST), held-offer checks (batch-participation-service canSelfApply/batchFinished exist but are unused).
- P-S1-05 Held-offer rule: apply and offer-release blocked when held >= maxHeld and not dream and ctc < best*(100+uplift)/100.
- P-S1-06 Accept cascade: ACCEPT must withdraw other applications ("placed elsewhere") and decline other offers, with an explicit cascade/event id (undoable).
- P-S1-07 Offer expiry sweep: add EXPIRED status, scheduled job (every 15 min), application effects; exclude EXPIRED from placement_offers_active_application_uq (needs migration).
- P-S1-08 Drive counting for count-based debarments: count at publishPlacementJob once per job (no application needed).
S2
- P-S2-01 verified-evidence-only mode; SELF evidence must not equal VERIFIED when requireVerifiedEvidence.
- P-S2-02 minPctThroughout rule (lowest of 10th/12th/UG).
- P-S2-03 diploma/lateral derivation: lateral = flag OR (diploma and no 12th).
- P-S2-04 section (class) targeting.
- P-S2-05 Dream/internship exemptions (isDream on jobs; INTERNSHIP does not count as placed).
- P-S2-06 min response window: default and enforce expiresAt >= now + minResponseHours (skip Sunday per legacy minimumRespondBy but in IST).
- P-S2-07 offer status set: EXPIRED (+ SELECTED/release split if needed).
- P-S2-08 counts_as_placed_at honoured in placed-count queries/reports.
- P-S2-09 waitlist promotion action.
- P-S2-10 application stage derivation after round results (fail -> rejected, hold -> waitlisted, offer -> OFFERED/HIRED) in one place.
- P-S2-11 withdraw allowed from any open stage, re-apply via status history (D2/D7: block withdraw when an offer is ISSUED/ACCEPTED or cascade).
- P-S2-12 job CANCELLED state that withdraws live offers; close/archive must not leave actionable offers (D11).
- P-S2-13 season: one ACTIVE per college is stricter than legacy (decide; drop unique index or document).
- P-S2-14 interview slot student assignment table (unique slot+application) + clash check; BOOK needs an applicant; CANCEL releases seats (D13).
S3/defects
- D3 pass tx into evaluatePlacementEligibility; D4 float rounding in scaleHundredths; D5 offer accept expiry boundary (>=); D8 job status guard in issuePlacementOffer; D9/D10 publish/archive TOCTOU and status guards; D12 round COMPLETE/SCHEDULE time checks; D14 debarment untilDate+untilDrives; D15 overrides on closed jobs; D16 enrollment limit(1) without ORDER BY.
Data-load notes: ctc_lpa DECIMAL(10,2) lakh -> annual_ctc_inr integer rupees (x100000); percent precision 2 decimals; reason length caps; legacy free-text statuses -> vNext CHECK sets; ids -> legacy-id-map.

## B. PROJECTS (lane: chat-11)
S1
- PR-S1-01 Closeout dead end: completeMentorProject requires ACTIVE but last release ship already sets COMPLETED -> closeout can never succeed. Decide one COMPLETED path.
- PR-S1-02 createProjectSubmissionDraft must reject when the latest submission is APPROVED.
S2
- PR-S2-01 sprint_id NOT NULL blocks closing a sprint with open tasks: backlog/carry-over (carried_over_from_sprint_id) or documented policy.
- PR-S2-02 PATCH task status lets any mentor/admin set or revert DONE without review: restrict to TODO/IN_PROGRESS/BLOCKED; add activity event + expectedUpdatedAt.
- PR-S2-03 task assignee: add assignee_membership_id; submitProjectTask only by assignee (mentor any).
- PR-S2-04 task fields: blocker_reason, due_date, estimate_points, task_type, comments (promote project-audit-staged.ts after review; its FK needs a unique (project_id,id)).
- PR-S2-05 admin readiness override with audit event.
- PR-S2-06 release ship requires >=1 sprint; decide auto-COMPLETE on last release.
- PR-S2-07 final delivery: LOCK/REOPEN, attachments metadata, delivery event log.
- PR-S2-08 member role kinds (MENTOR/CO_MENTOR/OBSERVER) with can_mutate; read-only reviewer/QA roles.
- PR-S2-09 sole-mentor guards (cannot end last primary mentor while ACTIVE; mentor required before ACTIVE).
- PR-S2-10 restoreProjectInstance (un-archive) with mentor check.
- PR-S2-11 resource visibility column + role filtering (mentor-only resources).
- PR-S2-12 consistent authorization for the same operation across lifecycle-service vs mentor-* services (pick one policy).
- PR-S2-13 meetings: stop hard-coding Asia/Kolkata on update, store/convert with meeting.timeZone; future-time + organizer-overlap checks on request/schedule.
- PR-S2-14 task status write: load inside transaction; template revise row lock + expectedVersion; archive check-then-update transaction.
S3
- progress % cap at 99 unless all done; task reorder with deferred constraint; sprint dates/started_by/completed_by; BLOCKED workspace status mapping; TO_DO -> TODO mapping on import; slug lower-case collision check; template rollback; unpublish leaves assignments; add member to ARCHIVED project; dual-role (ADMIN + LEARNER) access.
Data-load notes: map IN_PROGRESS/READY/BLOCKED -> ACTIVE (keep blocker text); template_key limit 64 vs legacy 120; legacy timestamps are zone-less (assume IST after verifying the old DB server zone).

## C. AUTH (Claude agent: protected paths)
S2
- A-S2-01 (L1) platform host (no tenant): user with only SUSPENDED/ENDED memberships gets a session -> require an ACTIVE membership, recruiter grant or system role (ACCOUNT_SUSPENDED / NO_ACCOUNT_FOR_DOMAIN).
- A-S2-02 (L2) ACTIVE membership at inactive college/org accepted at login -> join colleges/organizations status in listMemberships and verify route.
- A-S2-03 token/session invalidation: revoke all sessions on platform disable, membership suspend/end, phone/email change.
- A-S2-04 (L7) identity model: one user per phone vs legacy multiple accounts per phone (AccountChoice): migration must collapse without merging different people.
- A-S2-05 account-verification flows (learner_acct_verification/faculty_acct_verification) have no vNext equivalent: confirm whether still live.
S3
- L3 check strong/second code before reserveVerification; L4 map reserveVerification false to OTP_EXPIRED/INVALID_ATTEMPT; L5 create session inside the consume transaction and revoke previous cookie; L6 unknown-IP handling; L9 e2e-identity must also require APP_ENV=development; send limit counts only unused/failed attempts; resend_attempts cap; idempotent verify (double-click); code expiry from DB clock; idle session timeout and per-user session cap; delete stale db01-auth-attempts.staged.ts.
S4 keep (vNext better): CSPRNG OTP, HMAC code storage, constant-time compare, DB-time expiry, stricter test-OTP, super-admin two factors.

## D. Pending from discovery agent (db-parity-audit.md): attendance, marks/grades, progress, quizzes, assignments, access/visibility, notifications, reports/exports, schema parity. Append here when received.

## E. TPO FEATURES, RECRUITER CRM, PROFILE VERIFICATION (audit a89e5e1a...; lanes: chat-2 TPO, chat-9 college/verification, Claude agent for security/schema)
URGENT SECURITY (Claude agent, fix first)
- T-SEC-01 src/modules/placements/tpo-recruiter-grant-write-service.ts:46 uses ilike(users.email, input.email): '_' and '%' act as wildcards -> wrong user can receive recruiter access. Use eq(lower(users.email), lower(email)). Add a regression test with '_' and '%'.
S1
- T-S1-01 Recruiter grants never lapse: placement_recruiter_college_grants has no valid_until/capabilities/verification/revoke_reason; recruiterAccessMonths setting unused. Add columns (migration), enforce in loadActiveRecruiterGrant.
- T-S1-02 Lead stage wrong/never computed: deriveTpoRecruiterLeadStage has no callers; tpo-company-memory-service.ts leadStage reimplements without RECRUITED and the 'own drives' rule. Make it call the policy function.
- T-S1-03 Recruiter invite accept flow absent (OTP 6 digits, 10 min expiry, 5 wrong tries lock, 5 sends/hour per link, 300/hour shared link; hash sha256(tokenHash:code) -> prefer HMAC; table recruiter_invite_code). Accept must consume the token and grant access in one transaction.
- T-S1-04 Held-offer / uplift rule counting VERIFIED external offers not enforced (same as P-S1-05).
S2
- T-S2-01 lead chips OVERDUE/NO_NEXT_STEP/QUIET(14d from createdAt)/BOUNCED/UNVERIFIED not ported (tpo-lead-health-model.ts only).
- T-S2-02 add-lead phone validation: normalise first, 8-10 digits in zod, return null for empty, map DB 23514 to a validation error; checkTpoLeadContact must not query with ''.
- T-S2-03 invite reminder job (day 4, rotate hash only, keep inviteSentAt) and invite preview must record inviteClickedAt (stops reminders).
- T-S2-04 campaign unsubscribe through the campaign recipient token; email campaigns (500 recipients cap, skip NO_EMAIL/UNSUBSCRIBED, EMAIL activity, company EMAILED): tables placement_tpo_email_campaigns + recipients.
- T-S2-05 share link: decide scope (legacy: code gate, columns, max_stage, shortlist_by, phone only SHORTLISTED, 7-day expiry, 90-day retention, ZIP, lockout after 10 wrong codes/hour; vNext live path company-share is token-only with 2-day default). Add CODE_FAILED event if legacy behaviour required.
- T-S2-06 team threads: kinds EVERYONE/DRIVE/COMPANY/STUDENT/TOPIC, members, mentions, asks, decisions, private, follow/mute (vNext is 2-person only).
- T-S2-07 announcements: audience kinds (PLACEMENTS/BATCHES/BRANCHES/DRIVE), send-at, show-until, read tracking, remind-unread (1h gap), 30s undo; fix preview counting all active memberships.
- T-S2-08 public placements page: writer + live 12-month aggregates, hide any figure under 5, median/highest CTC, about text, TPO toggle.
- T-S2-09 verification: parseAcademicSnapshot throws on duplicate level or empty grade (legacy keeps latest endYear, skips blank) -> Verify fails permanently; delete stale profileVerificationAcademicMarks rows for absent levels; re-check eligibility after publish.
- T-S2-10 verification evidence strictness: legacy needs (Aadhaar+doc) OR (PAN+doc), marks+marksheet only for the 3 key education entries; vNext requires evidence for every entry (decide).
S3/S4 (do after): free-mail domain list shared (LEGACY_FREE_MAIL_DOMAINS only 4); import default source IMPORT; bulk Not-now requires reason; NEW bulk action; saved view columns (pinned, last_used_at, updated_at, unique lower(name)); job preferences fields (exam_slot_preference, pap_interest, specific_role_preference); saved job check cost; withdraw action for UPDATE_PENDING; salted hash of Aadhaar/PAN in snapshot (last-four masking cannot detect changes); clear send-back note on next verify.
Data-load notes: legacy soft delete is_deleted TINYINT -> vNext deletedAt/status; tpo_saved_view scope LEADS -> RECRUITER_LEADS rename (legacy V193 already RECRUITER_LEADS); external_placement ctc_lpa numeric(10,2) kept; profile_verification snapshots hold document IDs not URLs.
