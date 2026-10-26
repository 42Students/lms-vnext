# Recruiter prototype — 27 October 2026 continuation ledger

Design oracle: original user-provided 56-screen bundle at ChatGPT Library /LMS Prototype References/42LMS-prototype-56-screens.zip (screens 31–44). Functional oracle: 42Students/lms2-fe branch lms-dev-2026. Implementation: 42Students/lms-vnext main.

Rules: exact authored prototype first, legacy dev behavior second, vNext source/services/CI third. Never substitute generic screenshots. Preserve authorization, tenant isolation, consent, persistence and any safer features. Do not mark visually VERIFIED without authenticated browser evidence and 1440px same-state screenshot inspection.

| # | Prototype | vNext | Status / next check |
|---|---|---|---|
| 31 | Today | /hr/home | CODE CHECKED, VISUAL OPEN. Original and legacy RecruiterToday.jsx reviewed. 360px rail corrected; persisted Later and source-oriented E2E present. Full browser comparison open. |
| 32 | Drives | /hr/drives | CODE CHECKED, VISUAL OPEN. Original and legacy recruiter/drives/index.js reviewed. Sent-back requests now distinguished from placement-cell waiting. Compact source group layout vs advanced vNext workspace remains to compare. |
| 33 | Request a drive, hire again, edit | /hr/drives/new | IMPLEMENTED / UNVERIFIED. Salary, eligibility, saved drafts, TPO decisions and round presets need end-to-end review. |
| 34 | Drive overview | /recruiter/drives/[jobId]?tab=overview | IMPLEMENTED / UNVERIFIED. Scoped funnel and drive facts to confirm. |
| 35 | Applicants focused review | /recruiter/drives/[jobId]?tab=applicants | IMPLEMENTED / UNVERIFIED. Shared-only candidates, consent, notes and ratings. |
| 36 | Rounds, slots, results | /recruiter/drives/[jobId]?tab=rounds | IMPLEMENTED / UNVERIFIED. Persisted scheduled slots, confirmations and result writes. |
| 37 | Offers and joining | /recruiter/drives/[jobId]?tab=offers | IMPLEMENTED / UNVERIFIED. Selection and joining lifecycle. |
| 38 | Talk, asks, change requests | /recruiter/drives/[jobId]?tab=discussion | IMPLEMENTED / UNVERIFIED. TPO conversation, change authorization, replies. |
| 39 | Calendar | /hr/calendar | IMPLEMENTED / UNVERIFIED. Week change, ICS, IST. |
| 40 | Messages | /hr/conversations | IMPLEMENTED / UNVERIFIED. Two-pane inbox, search, thread and sends. |
| 41 | Company & Team | /hr/company | IMPLEMENTED / UNVERIFIED. Verified company, access requests, invitations. |
| 42 | Search, bell, profile, college picker | authenticated shell, /hr/profile, /hr/notifications | IMPLEMENTED / UNVERIFIED. Audit actual overlays and states. |
| 43 | Public invitation and sign-in | /recruiter-invite/[token], /login | IMPLEMENTED / UNVERIFIED. OTP, authenticated consent, expiry. |
| 44 | Public shared applicants | /company-share | IMPLEMENTED / UNVERIFIED. Token, revocation and permitted learner fields. |

## Implementation record

1. Recruiter Today original screen 31 uses right column max 360px; vNext was capped at 310px. Corrected CSS and added authenticated desktop E2E assertion in tests/e2e/recruiter-today-later.spec.ts.
2. Recruiter Drives original screen 32 groups urgent work and completed drives. Legacy dev distinguishes recruiter SENT_BACK work from placement-cell waiting. Added recruiterRequestAttentionCounts to src/modules/placements/recruiter-request-list-model.ts, used this truthful count in hr/drives/page.tsx, with unit coverage in tests/unit/recruiter-request-list-model.test.ts.
3. Removed a stale user-facing warning that claimed placement-cell approvals were unavailable despite the persisted decision lifecycle. Approved drafts require placement-cell publication before students can access them.

## Acceptance boundaries

- Screens 31 and 32 were reviewed across all three sources; neither has been called pixel-perfect, because the current running vNext has not been captured in the same state.
- Other screens are mapped but not yet exhaustively re-audited in this continuation. Existing E2E coverage in recruiter-prototype-screen-matrix.spec.ts and recruiter-prototype-functional-acceptance.spec.ts requires seeded authenticated fixtures.
- The static prototype's sample 64 applicants/58 confirmations and employer names are illustrative, never fake production data.
- Preserve private scanned JD/resume storage requirements; do not shortcut privacy/authorization to imitate prototype controls.
- CI may be cancelled by concurrent main commits. Record an exact completed run against a verified SHA before using a green status.
