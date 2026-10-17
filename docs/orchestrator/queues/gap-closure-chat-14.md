# Gap-closure queue chat-14 (reassigned rebalance)

Follow docs/orchestrator/briefs/gap-closure-lane.md exactly. These OPEN gaps are yours now (page groups: recruiter/home-drives, recruiter/calendar-messages-profile). Look each ID up in docs/audit/gap-register.md for the legacy behaviour, implement with exact legacy wording, add tests named with the gap ID and an acceptance note in docs/audit/acceptance/<account>-<page>-verification.md. Push to chatgpt/chat-14-b.

- REC-calendar-messages-profile-12 (S3) — DONE
- REC-calendar-messages-profile-16 (S3) — DONE
- REC-calendar-messages-profile-23 (S3) — DONE
- REC-calendar-messages-profile-24 (S3) — OPEN
- REC-calendar-messages-profile-25 (S2) — DONE
- REC-calendar-messages-profile-27 (S3) — DONE
- REC-calendar-messages-profile-28 (S3) — DONE
- REC-calendar-messages-profile-37 (S4) — NOT-A-GAP
- REC-calendar-messages-profile-42 (S4) — DONE
- REC-calendar-messages-profile-47 (S4) — DONE
- REC-calendar-messages-profile-48 (S4) — DONE
- REC-calendar-messages-profile-R01 (S2) — OPEN
- REC-calendar-messages-profile-R03 (S3) — DONE
- REC-home-drives-11 (S4) — DONE
- REC-home-drives-16 (S3) — DONE
- REC-home-drives-27 (S3) — DONE
- REC-home-drives-30 (S3) — DONE
- REC-home-drives-31 (S3) — DONE
- REC-home-drives-32 (S4) — DONE
- REC-home-drives-33 (S2) — OPEN
- REC-home-drives-34 (S3) — DONE
- REC-home-drives-38 (S1) — OPEN
- REC-home-drives-41 (S3) — DONE
- REC-home-drives-45 (S3) — OPEN
- REC-home-drives-46 (S3) — DONE
- REC-home-drives-47 (S3) — DONE
- REC-home-drives-50 (S3) — DONE
- REC-home-drives-52 (S4) — DONE
- REC-home-drives-53 (S4) — DONE
- REC-home-drives-54 (S4) — DONE
- REC-home-drives-R03 (S3) — DONE
- REC-home-drives-R07 (S4) — NOT-A-GAP

## Outstanding dependencies and unfinished work
- Needs shell: REC-calendar-messages-profile-24 — college logo/name header and mobile recruiter footer belong to chat-9's shared shell; do not edit `src/components/shell` in this lane.
- REC-calendar-messages-profile-R01 — provider-backed unread-mail digest and Reply-To inbound routing still need full delivery and authorized token ingestion; preserve allowlist-only sending outside production.
- REC-home-drives-33 — trusted-domain / approval-off formal-request auto-approval, company listing and audit policy are not yet wired; requests persist as pending and notify TPO.
- REC-home-drives-38 — scoped roll/email and verified 10th/12th/UG academic percentages now honor college share defaults. Branch, phone, skill match, resume/GitHub/portfolio, per-share snapshots and signed-document access remain incomplete (S1).
- REC-home-drives-45 — current stage tabs cover shared/active/withdrawn, not all legacy review stages; keep shortlist-only privacy policy.
- REC-home-drives-46 — DONE: inline editor and legacy toasts were present; now adds staged/applied counts and TPO-confirmed slot totals from 0116.
- REC-home-drives-52 — DONE: separate authorized selection history from 0115 distinguishes selected, verified-awaiting-release and cancelled selections from issued offers; the SQL offer table does not support a REVOKED issued-offer status, so never pretend that selection cancellation revokes an offer.
- REC-home-drives-41 — implementation and proposed SQL are on the lane branch; numbered migration registration and runtime verification remain with the orchestrator.
- Tests authored, not run locally: the orchestrator must run unit suite, typecheck, lint, and migration integration tests after merge.
