# Owner decisions: resolved (2026-10-17)

Owner instruction: "for vnext we will be doing the better approach, take all those calls by yourself, and do the best recommended." Claude decides every item in `owner-decisions.md`. Rules that stay fixed: exact legacy wording for UI strings, never touch production, messaging allowlist-only outside production, no AI features, never print secrets.

Principle: vNext keeps its intentional improvements (archive instead of delete, optimistic-version stamps, season scoping, capped CSV) and legacy behaviour is restored only where it is also the better design.

## Security-sensitive
| ID | Decision |
|---|---|
| OD-07 | College admins, and faculty added as TPO admins, may open `/tpo/*` through an explicit permission (`tpo.access`) checked by `can()`; no implicit role bypass. |
| OD-09 | Restore the company share one-time code (6 digits, lockout), the chosen-column selection (up to 11) and 90-day retention; keep the 256-bit token. Resumes ZIP waits for storage. |
| OD-22 | College admins may grant roles except `COLLEGE_ADMIN` (Super Admin only); branding and domains stay Super Admin; announcements allowed. |
| OD-23 | Suspend / end membership instead of delete; add platform-wide block for Super Admin that revokes sessions; no impersonation. |
| OD-27 | Reporters see their own reports; logs and audit findings stay Super Admin only. |
| OD-35 | Scoped admin content preview with no storage key or signed URL exposed. |

## Behaviour
| ID | Decision |
|---|---|
| OD-01 | Deadlines hard-stop submissions; a per-assignment "allow late" toggle (off by default) stores a late flag. |
| OD-02 | Allow skipping questions (score 0), as today. |
| OD-03 | Release results once the deadline has passed, without requiring a manual close. |
| OD-04 | Grading: one click saves and publishes by default; optional "hold for publishing" for batch grading. |
| OD-05 | College admins bypass the attendance correction window; reason required and audited. |
| OD-06 | Semester credits derive from mapped courses; manual field removed. |
| OD-08 | TPO inbox reads and writes recruiter threads. |
| OD-10 | Unsubscribe is per college by default; the page offers an optional global opt-out. |
| OD-11, OD-12 | Real campaign sending, batch invites and reminders through the messaging module, allowlist-only outside production, one remind per day, audited; remove "draft only" surfaces once live. |
| OD-13 | Privacy policy and terms pages plus a minimal static home and request-demo; no full marketing site. |
| OD-14 | JNTU and DGIPUC skins only if their tenants prove live (live check first). |
| OD-15 | Keep the dashboard as the landing page (vNext improvement) with legacy wording, and keep Courses one click away in the sidebar. |
| OD-16 | Add a platform sign-in link for multi-college people on a college address. |
| OD-17 | `/superadmin-login` redirects to `/` with no state. |
| OD-18 | Keep vNext recruiter sign-in on any college address with a grant. |
| OD-19 | Login mascot out of scope. |
| OD-20 | Keep recruiter self-revoke; notify the TPO on revoke. |
| OD-21 | Keep concrete time and mode on learner placement requests; also accept the legacy free-text reason. |
| OD-24 | Tenant code immutable; program department editable with dependency checks. |
| OD-25 | Keep the model; show legacy words for project statuses in the UI. |
| OD-26 | Add one-click "Allot subdomain" as the default path; keep the domains panel for custom domains. |
| OD-28 | Keep reopen of a closed drive; reason required for publish, close, reopen, extend and edit; season-scoped lists. |
| OD-29 | JD is a link field until storage is unblocked. |
| OD-30 | Company page shows counts only; contact mail derives from the recruiter lead. |
| OD-31 | Keep live eligible computation (hide under 5) and fix the enable check. |
| OD-32 | Public join link shown once. |
| OD-33 | No manual marks for non-assignment components. |
| OD-34 | Watched threshold platform-wide, hidden. |
| OD-36 | Build project notifications (meetings, requests) through the delivery module now. |

## Scope and process
| ID | Decision |
|---|---|
| OD-37 | S1 to S3 plus every exact-wording S4. |
| OD-38 | All "intentional differences" lists approved as written. |
| OD-39 | Live checks on the deployed old-LMS dev site approved (read-only; owner signs in). |

## Other
- Recruiter drive visibility: recruiters see only their own drives.
- Storage: links only until uploads are unblocked.
- Cutover plan: draft after the NSRIT dev load is accepted.
- NSRIT: all open questions decided by Claude with the recommended defaults (see memory and `docs/migration/nsrit-migration-plan.md`).

## 2026-10-17: UNCONFIRMED live checks
Owner: "you are more forward and future proof thinker than me, do the best recommended things... no need to follow the old lms if things are wrong there." All UNCONFIRMED gaps are decided by the orchestrator and lanes (better, safer behaviour where legacy is ambiguous or wrong); no old-LMS live checks are required. Decisions are documented per gap in the acceptance files.
