# Public invite links, company share, marketing/legal verification

Audit `docs/audit/pages/public/auth-public-2-links-marketing.md`. Protocol `docs/orchestrator/briefs/gap-closure-lane.md`. The unit/source test `tests/unit/public-auth-links-gap-closure.test.ts` contains 18 audit-ID-named tests, including earlier recruiter 40–42 support outside this lane queue. **Tests are authored, not run.** No production OTP/SMTP/ZIP acceptance asserted.

| ID | Status | Evidence / remaining requirement |
| --- | --- | --- |
| PUB-auth-public-44 | OPEN | Client validates name, 6-digit OTP and optional Indian mobile; full email-classification/MX validation not reverified |
| PUB-auth-public-45 | OPEN | Joined state provides sign-in link; PENDING_HR state not independently verified |
| PUB-auth-public-46 | DONE | RecruiterInviteLanding uses shared apiFetch with timeout/non-JSON failure handling; 404 invalid differs from 5xx/offline load_error Retry, and OTP actions are guarded; named test PUB-auth-public-46 |
| PUB-auth-public-47 | OPEN | Company and college context exists; every historical invitation-specific sentence not confirmed |
| PUB-auth-public-50 | OPEN | One-time company share code gate not wired into public share GET and SQL authorization |
| PUB-auth-public-51 | OPEN | Email me a code instead for company share not yet available |
| PUB-auth-public-52 | OPEN | Wrong-code share lockout/bell not independently implemented |
| PUB-auth-public-53 | OPEN | Chosen applicant column whitelist and shortlist stage disclosure still only 3 columns |
| PUB-auth-public-55 | OPEN | Private all-resume ZIP awaits signed receipt/download and scanner |
| PUB-auth-public-56 | DONE | Company-share page renders college, company, share date and expiry / confidentiality warning; named test PUB-auth-public-56 |
| PUB-auth-public-59 | DONE | Public share now displays exact invalid/expired warning; thrown server load errors render independent Retry boundary; `tests/unit/public-auth-links-gap-closure.test.ts` — PUB-auth-public-59 |
| PUB-auth-public-67 | DONE | /privacy-policy redirects to 13-section historic privacy policy, April 20 2026, Android ID and privacy email; named test PUB-auth-public-67 |
| PUB-auth-public-68 | DONE | Historic terms/privacy static HTML files at exact consent-facing paths; named test PUB-auth-public-68 |
| PUB-auth-public-48 | DONE | Exact legacy declined subtitle rendered after Not hiring; named test PUB-auth-public-48 |
| PUB-auth-public-49 | OPEN | Invite state notification side effects require PG verification |
| PUB-auth-public-54 | OPEN | CSV all selected columns/role filename and download event not present |
| PUB-auth-public-57 | OPEN | Shortlist-by date metadata not rendered |
| PUB-auth-public-60 | OPEN | SHARE_OPENED bell not verified |
| PUB-auth-public-58 | DONE | Tenant-name confidential overlay on applicant list; named test PUB-auth-public-58 |
| PUB-auth-public-61 | OPEN | Historical course slug continue link alias not implemented |
| PUB-auth-public-62 | DONE | Marketing /home role/agent grid, audience split, pillars, journey, CTA and JSON-LD; named test PUB-auth-public-62 |
| PUB-auth-public-63 | DONE | Marketing /platform hero, agents, pillars, integrations, lifecycle and CTA; named test PUB-auth-public-63 |
| PUB-auth-public-64 | DONE | Universities landing headline with campus audience and CTA; named test PUB-auth-public-64 |
| PUB-auth-public-65 | DONE | Enterprises landing headline and workforce offerings; named test PUB-auth-public-65 |
| PUB-auth-public-66 | DONE | /request-demo headline, What to expect section and mailto contact without form; named test PUB-auth-public-66 |

A verified implementation is a source-level closure awaiting orchestrator execution, not evidence that SMTP, live object buckets or production tenant mailboxes are configured. Other OPEN entries are not promoted to DONE by having a code snippet or a partial source test.


## Round 6 — public invite and share copy (tests not executed)

| ID | Status | Evidence |
| --- | --- | --- |
| PUB-auth-public-47 | OPEN | Exact legacy permission copy "Contact details are shared only as the placement cell allows." added to recruiter invite. Drive-specific title sentence cannot be shown absent a persisted drive-review association. `recruiter-invite-landing.tsx`; PUB-auth-public-47 unit test. |
| PUB-auth-public-54 | DONE (approved bounded CSV) | Existing audited, capped company applicant CSV export remains; public action now says "Download list (CSV, up to 500 applicants)" rather than an implementation label. `company-share/[token]/page.tsx` and `tests/unit/public-auth-links-gap-closure.test.ts`, case PUB-auth-public-54. The owner explicitly retains capped exports as a vNext improvement. |
