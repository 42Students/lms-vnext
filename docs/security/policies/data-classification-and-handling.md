# Data classification and handling rules (SEC-10-005, SEC-10-008, SEC-22-001, SEC-22-002)

Status: written 2026-11-08, needs the owner's approval. It applies the table-level inventory in `docs/security/data-inventory.md` (96 of 280 tables hold personal or sensitive columns) and the role scopes enforced by the code (`docs/security/role-matrix-baseline.json`).

## Classes

| Class | What it covers | Where it lives | Rules |
|---|---|---|---|
| **Restricted** | Identity documents and marksheets (private storage objects), government and roll numbers, contact details (phone, email, parent contacts), one-time-code digests, session digests, integration tokens, encrypted outbound payloads | `profile_private_document_receipts`, `identity_*`, `attendance_parent_contacts`, `outbound_messages`, `inbound_mail_messages`, `users` contact columns | Never in logs, URLs, browser storage, bug reports or exports without step-up. Private bucket only, signed links of at most 5 minutes, every link issue audited (`file.link_issued`). Contact values appear only to the person, their college's authorised staff, and a recruiter with an active grant. |
| **Confidential** | Grades, attendance, project and quiz attempts, placement applications, offers, eligibility decisions, recruiter notes | course, attendance, project and placement tables | College-scoped by row-level security. Readable only by the owner learner and by staff roles the role matrix gives that route. Exports need a fresh sign-in (15 minutes) and are audited (`api.export`). |
| **Internal** | Course content, schedules, announcements, college configuration, module access rules | course, academic and announcement tables | College-scoped. Readable by members of the college according to role. |
| **Public** | Published placement outcomes, marketing pages, the privacy policy, tenant branding | public routes in `docs/security/unauth-baseline.json` | Only the routes in the unauthenticated baseline answer without a session. |

## Handling rules by role

| Role | May read | May change | Never |
|---|---|---|---|
| Learner | Own profile, enrolments, submissions, grades, own placement records | Own profile and submissions | Another learner's records (probe: 144 requests, none returned) |
| Faculty | Learners and assessments of the sections they teach | Attendance, grades, content for those sections (persisted assignment re-checked inside the write) | Other sections, placement data, admin settings |
| Mentor | Assigned projects and their learners | Reviews, tasks, meetings of those projects | Teaching records, placement data |
| TPO | Placement data of their college | Drives, rounds, offers, notices | Other colleges, course grades beyond placement eligibility |
| College Admin | Operational data of their college | People, academics, courses, placements settings (step-up on role, permission, user, export, import and settings changes) | Other colleges, platform settings |
| Recruiter | Candidates a college granted for a company | Own drive requests and notes | Candidates without an ACTIVE, VERIFIED, unexpired grant |
| Super Admin | Platform settings; one selected college at a time (scope expires after 4 hours, audited) | Tenant setup, platform roles (step-up) | Acting as a platform admin while holding a selected membership (the membership wins) |

## Minimisation and response fields

New routes return the fields the screen needs, never whole rows. Reviewers check this in the pull request (`docs/security/policies/secure-development-standard.md`). The route layer never returns internal error text: `apiErrorResponse` maps unknown errors to a generic message.

## Test and demo data

Seeded accounts use `.test` emails and `9100061xxx` phone numbers. Whether the NSRIT data on dev is real people is an open owner question (OWNER-ACTIONS 16); until answered, dev is treated as production-grade for that data.

## Processors

Exotel (SMS), ZeptoMail (email), Cloudflare R2 (files), Google (calendar, YouTube iframe), Telegram (operational alerts, no personal data), Google Cloud (hosting, database). Contracts and data-processing terms are an owner and legal item (OWNER-ACTIONS 17, SEC-22-009).
