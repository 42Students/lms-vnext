# Gap-closure queue chat-14 (reassigned rebalance)

Follow docs/orchestrator/briefs/gap-closure-lane.md exactly. These OPEN gaps are yours now (page groups: recruiter/home-drives, recruiter/calendar-messages-profile). Look each ID up in docs/audit/gap-register.md for the legacy behaviour, implement with exact legacy wording, add tests named with the gap ID and an acceptance note in docs/audit/acceptance/<account>-<page>-verification.md. Push to chatgpt/chat-14-b.

- REC-calendar-messages-profile-12 (S3) — DONE
- REC-calendar-messages-profile-16 (S3) — OPEN
- REC-calendar-messages-profile-23 (S3) — DONE
- REC-calendar-messages-profile-24 (S3) — OPEN
- REC-calendar-messages-profile-25 (S2) — DONE
- REC-calendar-messages-profile-27 (S3) — DONE
- REC-calendar-messages-profile-28 (S3) — DONE
- REC-calendar-messages-profile-37 (S4) — NOT-A-GAP
- REC-calendar-messages-profile-42 (S4) — DONE
- REC-calendar-messages-profile-47 (S4) — DONE
- REC-calendar-messages-profile-48 (S4) — DONE
- REC-calendar-messages-profile-R01 (S2) — BLOCKED
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
- REC-home-drives-46 (S3) — OPEN
- REC-home-drives-47 (S3) — OPEN
- REC-home-drives-50 (S3) — DONE
- REC-home-drives-52 (S4) — OPEN
- REC-home-drives-53 (S4) — DONE
- REC-home-drives-54 (S4) — DONE
- REC-home-drives-R03 (S3) — OPEN
- REC-home-drives-R07 (S4) — NOT-A-GAP

## Chat-14 closure ledger (authored, pending orchestrator tests)

Statuses count: 20 DONE, 2 NOT-A-GAP, 1 BLOCKED (provider email), 9 OPEN (including shell handoff).

All DONE rows have code and named tests in `tests/unit/recruiter-chat14-round1.test.ts`, `-round2.test.ts`, `-round3.test.ts`, with detailed evidence in the two recruiter acceptance files. The 9 OPEN gaps are intentionally not declared closed until the remaining authentic DB, permission and legacy workflows are implemented. Tests are authored but **not run** by this lane. The chat-14 core GR-31 global scan still has other-lane unguarded mutations documented separately. No numbered migration added; private rating SQL is proposed only.
