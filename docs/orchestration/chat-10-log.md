# Chat 10 — HR / Recruiter lane

- 2026-10-14 — HR Drives List PARTIAL: strict college + lifecycle + search filters using existing recruiter grant-scoped jobs; request-state limitations explicit. Unit and isolated PG fixture tests authored, not executed. Unfinished: approvals, resubmission, legacy fields, browser/PG runtime. Commit recorded in Git history.
- 2026-10-14 — Today PARTIAL: live/deadline/round cards with selected grant, IST week model, unit and isolated PG fixtures authored but not executed. Pending waiting/approval/invite/stale states and runtime proof.
- 2026-10-14 — Company Profile PARTIAL: authorized company-college hiring footprint + recent jobs, validated query, loading/error, unit and isolated PG tests authored. Industry/logo and per-person attribution remain blocked; no runtime checks.
- 2026-10-14 — Round Results PARTIAL: chooser, exact-grant round/outcome read table and staged/applied distinctions, responsive empty/loading/error; authored unit + isolated PG denial fixtures. Remaining embedded legacy flow, submission writes, acceptance and share review.

- 2026-10-14 — Applicant drawer PARTIAL: only company-drive SHORTLISTED read + active membership; contact in drawer, no unshared candidates. Pure/unit + PG auth fixtures authored; not executed.

- 2026-10-14 — Offers and selection PARTIAL: read-only persisted expiry + joining and pass-through readiness, no LOI/send inventions; tests authored, not executed.

- 2026-10-14 — Company Reports funnel PARTIAL: declined/joined DB evidence + mobile cards; unit/PG denials authored, runtime positive fixtures and acceptance outstanding.

- 2026-10-14 — Results-due calendar PARTIAL: bounded round due-at query, IST due cards, no fabricated slot/notifications, unit+isolated PG authored; unexecuted.

- 2026-10-14 — Drive Detail Overview PARTIAL: employer-scoped summary / deadline state and nav, model/tests, runtime not executed.

- 2026-10-14 — Drive List structured filters PARTIAL: work mode/employment/urgency + 20-row paging, unit/PG authored; backend-wide source listing remains to paginate at DB.

- 2026-10-14 — Recruiter designation write PARTIAL: same-origin self-only audited PATCH and stale token; PG fixtures success/foreign/wrong/stale and model tests authored, unexecuted.

- 2026-10-14 — Recruiter company boundary PARTIAL: extra SQL exact employer ID and pure post-query guard; forged cross-company PG fixture authored. Designation follow-up fixes included. Gates not run.

- 2026-10-14 — HOTFIX: exact employer filter relocated from TPO grant listing (incorrect) to recruiter-owned jobs SQL. Added regression test. Must gate before merge.

- 2026-10-14 — Embedded Round Results PARTIAL: safe same-job round/outcome URL filters, shortlist-only read cards, unit + PG fixtures authored, not executed.

- 2026-10-14 — Today results due PARTIAL: company/college-authorized upcoming result deadlines on Today, no external notifications; pure/unit + isolated PG tests authored, unexecuted.

- 2026-10-14 — HR round contact privacy PARTIAL: user ACTIVE + same-college membership + submission/shortlist + company identity; defense-in-depth model and PG guard tests authored, gates pending.

- 2026-10-14 — HR Calendar RESULTS_DUE day grouping PARTIAL: due-only IST days and agenda/calendar badges; unit and PG fixture updated, execution pending.

- 2026-10-14 — HR selection readiness PARTIAL: all-round applied PASS intersection and conservative JOINED count; unit + PG fixture updated, unexecuted.

- 2026-10-14 — HR applicant DB pagination PARTIAL: 25-row scoped pages and full company-safe stage totals; tests authored/extended, execution pending.

- 2026-10-14 — Request Drive local draft PARTIAL: owned-college chooser, Hire Again authorized job preview and Zod validated local-only form; no persistence or sending; tests authored not executed.

- 2026-10-14 — Request Drive links PARTIAL: Today/Drives CTA and exact-job Hire Again preview navigation; test extensions unexecuted.

- 2026-10-14 — Request Drive compensation/eligibility PARTIAL: local-only CTC breakdown, bond, backlogs and preview; tests authored, execution pending.

- 2026-10-14 — HR Offers DB pages PARTIAL: 25-row filtered status pages and all-shared aggregate totals, no LOI; tests authored/extended, execution pending.

- 2026-10-14 — HR Calendar mobile cards PARTIAL: narrow-screen day group layout for rounds/deadlines/results, unit/PG tests extended. Offers paging total label fixed. Execution pending.

- 2026-10-15 — HR applicant CSV PARTIAL: existing grant-scoped applicant pages, formula-neutralized capped CSV, contact always masked; unit+PG authored, not executed.

- 2026-10-15 — HR hiring activity PARTIAL: employer-scoped publish/close timeline, no applicant data. Unit+PG fixtures authored; gates pending.

- 2026-10-15 — HR round schedule PARTIAL: read-only IST timeline + conservative known-duration collision hints. Unit/PG written, not run.

- 2026-10-15 — Recruiter self-display-name PARTIAL: audited same-origin self-only CAS write to registered user name, no company-level mutations; pure/PG tests authored, execution pending.

- 2026-10-15 — Pre-merge self-review hotfix: fixed double-escaped regexes in recruiter display-name normalization and CSV formula neutralization; added leading whitespace/newline regressions. Pure tests authored, not executed.

- 2026-10-15 — HR notifications PARTIAL: scoped own-recipient lifecycle inbox, no raw PII/title/body, unread-only display; unit/PG fixtures authored, unexecuted.

- 2026-10-15 — HR notification mark read PARTIAL: same-origin, exact employer allowlist, createdAt CAS, new stale error and persisted readAt. Unit/PG authored; not run.

- 2026-10-15 — HR offers CSV PARTIAL: 200 cap, formula neutralization and always-masked contact via existing exact-company read; pure/unit+PG authored, unexecuted.

- 2026-10-15 — Today unread notification CTA PARTIAL: grant-scoped unread 100-cap card plus links to Messages/Activity. Unit and PG fixture added, tests not executed.

- 2026-10-15 — HR Company Reports CSV PARTIAL: company/college-scoped aggregate funnel, 200 cap and safe quoting, tests authored not executed.

- 2026-10-15 — HR notification pagination PARTIAL: exact unread/total SQL counts and 25-row pages, Today count label fixed. Unit authored; PG/browser unexecuted.
