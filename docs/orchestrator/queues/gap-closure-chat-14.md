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
- REC-calendar-messages-profile-R01 (S2) — BLOCKED (provider + proposed migration)
- REC-calendar-messages-profile-R03 (S3) — DONE
- REC-home-drives-11 (S4) — DONE
- REC-home-drives-16 (S3) — DONE
- REC-home-drives-27 (S3) — DONE
- REC-home-drives-30 (S3) — DONE
- REC-home-drives-31 (S3) — DONE
- REC-home-drives-32 (S4) — DONE
- REC-home-drives-33 (S2) — DONE
- REC-home-drives-34 (S3) — DONE
- REC-home-drives-38 (S1) — DONE (runtime private storage/scanner verification pending)
- REC-home-drives-41 (S3) — DONE
- REC-home-drives-45 (S3) — DONE
- REC-home-drives-46 (S3) — DONE
- REC-home-drives-47 (S3) — DONE
- REC-home-drives-50 (S3) — DONE
- REC-home-drives-52 (S4) — DONE
- REC-home-drives-53 (S4) — DONE
- REC-home-drives-54 (S4) — DONE
- REC-home-drives-R03 (S3) — DONE
- REC-home-drives-R07 (S4) — NOT-A-GAP

## Outstanding dependencies and unfinished work
- Needs shell: REC-calendar-messages-profile-24 — `src/modules/placements/recruiter-shell-navigation-model.ts` and `tests/unit/recruiter-chat14-shell-handoff.test.ts` provide the exact five-item, college-scoped functional contract (including fail-closed branding); chat-9 must add the header logo/college name and mobile footer to shared shell after the audited UX playbook. No shell edits in chat-14.
- REC-calendar-messages-profile-R01 — CODE COMPLETE, DEPLOYMENT BLOCKED: HMAC-signed inbound gateway, stable per-thread Reply-To, quoted-email stripping, persistent dedupe, 15m/2m/45m/6h digest worker, templated ZeptoMail adapter and origin-protected routes are built. Proposed bridge SQL awaits numbered migration and provider template, inbound gateway, routing domain and secrets. Feature flag defaults OFF; the RECRUITER_MESSAGE_REPLY_TOKEN_SECRET must be provisioned, and nonproduction allowlist stays enforced.
- REC-home-drives-33 — DONE: policy is persisted in registered placement_tpo_college_settings and placement_tpo_trusted_domains; verified matching domains or approval-off create a DRAFT using the same atomic TPO job writer, with TPO/recruiter audit notices. Unsafe or unconfigurable requests remain in the TPO review queue.
- REC-home-drives-38 — DONE: college-share-authorized applicant fields and consented skills/HTTPS links; resume now uses a same-origin POST, repeat authorization, active shortlisted application, CLEAN unrevoked receipt, privileged scanner R2 metadata and 2-minute private signed grant. No raw object key is rendered. Runtime scanner/R2 environment is still an external deployment prerequisite. No fabricated skill-match percentage or per-share snapshots.
- REC-home-drives-45 — DONE: legacy stage filters and counts derive from authoritative APPLIED rounds, offers and joining history while preserving placement-cell shortlist visibility.
- REC-home-drives-46 — DONE: inline editor and legacy toasts were present; now adds staged/applied counts and TPO-confirmed slot totals from 0116.
- REC-home-drives-52 — DONE: separate authorized selection history from 0115 distinguishes selected, verified-awaiting-release and cancelled selections from issued offers; the SQL offer table does not support a REVOKED issued-offer status, so never pretend that selection cancellation revokes an offer.
- REC-home-drives-41 — implementation and proposed SQL are on the lane branch; numbered migration registration and runtime verification remain with the orchestrator.
- Typecheck report refreshed 2026-10-18 01:15: only 11 main errors remain globally, and the chat-14 recruiter subset (undefined autoReason/approvedJobId) is repaired on this branch. The branch has not received an independently executed CI typecheck.
- Five UNCONFIRMED decisions REC-calendar-messages-profile-46, REC-home-drives-09, -19, -44, -R02 are documented in both recruiter acceptance files and regression-tested; no implicit login acceptance, uncapped private export, or auto-apply of private placement outcomes.
- Tests authored, not run locally: the orchestrator must run unit suite, typecheck, lint, and migration integration tests after merge.
