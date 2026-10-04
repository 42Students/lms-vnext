# Shared / Public / Operational — Detailed Page Parity Spec

These surfaces are not owned by one authenticated sidebar but are part of replacing the legacy LMS safely.

# Authentication / account context

## Page: Tenant-aware root/login
**Legacy:** `/`, `/login`

Legacy responsibilities:
- tenant/host-aware login skin;
- phone/OTP identity;
- role/account resolution;
- post-login home routing;
- tenant branding;
- auth errors/retry;
- safe unknown-role handling.

- [ ] Identity Platform browser login is implemented and configured.
- [ ] tenant hostname resolves the correct branding/context.
- [ ] phone/OTP flow matches required product behavior.
- [ ] login error/rate-limit/expired-code states are explicit.
- [ ] successful login resolves memberships safely.
- [ ] unknown/no-membership state goes to chooser/recovery, never guessed Learner.
- [ ] role home routing is deterministic.
- [ ] logout/session expiry returns to correct login.
- [ ] mobile login behavior is verified.
- [ ] branding asset storage remains explicit BLOCKED until Cloud Storage is live.

## Page: Super Admin Login
**Legacy:** `/superadmin-login`

- [ ] Product decision: unified Identity Platform login or separate hardened Super Admin entry.
- [ ] If redesigned, rationale is recorded in master matrix.
- [ ] Super Admin IP/policy requirements remain enforceable.
- [ ] no legacy separate-login bookmark becomes a security bypass.

## Flow: Cross-domain Auth Handoff
**Legacy:** `/auth/handoff`

Legacy has progress/failure handling with Back to Login and Retry.

- [ ] define whether cross-host/custom-domain token handoff remains needed.
- [ ] consume token exactly once.
- [ ] validate issuer/audience/expiry/origin.
- [ ] select/restore intended membership safely.
- [ ] retry does not replay an already-consumed token unsafely.
- [ ] failure provides correct login fallback.
- [ ] no handoff secret appears in logs/client persistence.

## Flow: Membership Chooser / Switcher
vNext already has chooser/switcher.

- [ ] college cards/membership role context match user expectations.
- [ ] only ACTIVE memberships are selectable.
- [ ] switch is same-origin protected.
- [ ] deactivated membership cannot be selected with stale UI.
- [ ] switching refreshes all role/navigation/data context.
- [ ] clearing membership returns to chooser-valid state.
- [ ] recruiter/global college-less state is compatible.

# External company sharing

## Public Page: Company Applicant Share
**Legacy:** `/company-share/[token]`

Legacy:
- expired/revoked warning;
- 6-digit code gate;
- optional Email Me a Code;
- applicant table with configurable shared columns;
- resume links with safe URL handling;
- shortlist-by notice;
- Download All Resumes ZIP;
- Download List CSV;
- download audit logging.

- [ ] share token expiry/revocation matches.
- [ ] 6-digit code gate matches.
- [ ] brute-force/rate-limit protections exist.
- [ ] Email Me a Code flow matches where configured.
- [ ] only explicitly shared applicant fields are returned.
- [ ] resume link safety matches.
- [ ] shortlist-by deadline notice matches.
- [ ] CSV export matches shared fields only.
- [ ] resume ZIP generation matches authorized files only.
- [ ] list/ZIP/resume downloads are audited.
- [ ] invalid/revoked/expired states leak no applicant data.
- [ ] public page is responsive and accessible.

# AI grading

## Protected Page: AI Grading
**Legacy:** `/ai-grading`

Legacy contract:
- form vs JSON input modes;
- questions/rubrics add/remove;
- load example;
- clear inputs;
- answer booklet PDF upload;
- extraction + grading run;
- long-running status;
- marks summary;
- review queue count;
- extraction confidence;
- pages referenced;
- overall/grading/extraction confidence;
- per-answer results/evidence;
- low-confidence review cards;
- export JSON;
- download PDF report;
- upload/run failure reporting.

- [ ] Product ownership decision confirms this remains part of vNext.
- [ ] authorization is explicit; never public.
- [ ] form input mode matches.
- [ ] JSON input mode/schema validation matches.
- [ ] add/remove question/rubric behavior matches.
- [ ] example/reset behavior matches.
- [ ] PDF upload validation/storage matches.
- [ ] extraction provider/model is defined.
- [ ] grading provider/model is defined.
- [ ] long-running execution has safe timeout/retry/idempotency.
- [ ] marks summary matches.
- [ ] review queue/low-confidence logic matches.
- [ ] extraction evidence/page references match.
- [ ] confidence metrics match semantics.
- [ ] per-question result display matches.
- [ ] JSON export matches.
- [ ] PDF report generation matches.
- [ ] file/run failures are observable and user-visible.
- [ ] tenant/user authorization around uploaded assessment data is tested.

# Operational QA / Tracker

## Page: Report Issue
**Legacy:** `/tracker`

Legacy:
- no-login issue report;
- remembered reporter/account/environment context;
- unsaved draft restore/discard;
- context/location/issue type/description/severity/evidence;
- screenshot picker/upload;
- similar issues;
- create issue first so screenshot failure never loses report;
- screenshot retry;
- success with public issue id;
- View Issue / Report Another;
- Ctrl/Cmd+Enter submit.

- [ ] Product decision: migrate Tracker into vNext or retain as separate supported service.
- [ ] If migrated, report form fields/options match.
- [ ] draft restore/discard matches.
- [ ] screenshot upload/retry matches.
- [ ] report persists before attachments.
- [ ] similar-issue behavior matches.
- [ ] success/id/deep link matches.
- [ ] keyboard submit/accessibility matches.
- [ ] abuse/rate-limit/public-data policy is explicit.

## Page: Issues List
**Legacy:** `/tracker/issues`

- [ ] ownership decision matches Report Issue.
- [ ] filters/search/sort/pagination match.
- [ ] saved filters/views match.
- [ ] issue status/severity/context columns match.
- [ ] open detail deep link matches.
- [ ] loading/empty/error states match.

## Page: Issue Detail
**Legacy:** `/tracker/issues/[issueId]`

- [ ] issue fields/history/comments/attachments match.
- [ ] status/decision actions match authorized operator role.
- [ ] attachment preview/download safety matches.
- [ ] not-found/error states match.

## Page: Logs
**Legacy:** `/tracker/logs`

Legacy includes:
- Production/Development/UAT;
- time windows 15m/1h/6h/24h/7d;
- levels;
- search;
- grouped/ungrouped;
- pagination/load older;
- refresh/auto-refresh;
- stale state;
- new-since-last-visit;
- backend uptime;
- log detail/permalink;
- known errors;
- daily digest;
- test alert;
- Cloud Logging errors/rate limits;
- Log→Issue handoff.

- [ ] Product ownership decision: migrate or retain supported ops surface.
- [ ] environment/window/level/search filters match.
- [ ] grouped/ungrouped behavior matches.
- [ ] pagination/refresh/auto-refresh matches.
- [ ] rate limit pauses auto-refresh safely.
- [ ] stale-last-success state matches.
- [ ] new-since-last-visit state matches.
- [ ] log detail/permalink matches.
- [ ] Known Errors workflow matches.
- [ ] Daily Digest workflow matches.
- [ ] Test Alert workflow matches.
- [ ] Log→Issue draft handoff matches.
- [ ] Super Admin authorization is enforced server-side.

# Public marketing / legal

## Page: Marketing Home
**Legacy:** `/home`
- [ ] Product decision: keep separate legacy/public site or migrate.
- [ ] if retained separately, vNext cutover preserves route/host behavior.
- [ ] if migrated, all sections/CTAs/SEO metadata are audited before retirement.

## Page: Platform
**Legacy:** `/platform`
- [ ] ownership/cutover decision recorded.
- [ ] if migrated, content/CTA/SEO parity audited.

## Page: Universities
**Legacy:** `/universities`
- [ ] ownership/cutover decision recorded.
- [ ] if migrated, content/CTA/SEO parity audited.

## Page: Enterprises
**Legacy:** `/enterprises`
- [ ] ownership/cutover decision recorded.
- [ ] if migrated, content/CTA/SEO parity audited.

## Page: Request Demo
**Legacy:** `/request-demo`
- [ ] ownership/cutover decision recorded.
- [ ] lead/contact form submission destination remains functional.
- [ ] validation/success/error states preserved.

## Page: Privacy Policy
**Legacy:** `/privacy-policy`
- [ ] legal owner decides retained vs migrated route.
- [ ] cutover never produces a missing privacy-policy link.
- [ ] current policy content/version/source is verified before launch.

# Error surfaces

## Page: 404
- [ ] vNext custom/not-found experience decision recorded.
- [ ] authenticated pages preserve shell/helpful navigation where appropriate.
- [ ] public page does not expose internals.

## Page: 500 / fatal error
- [ ] fatal error experience decision recorded.
- [ ] retry/recovery path exists.
- [ ] errors are observable without leaking secrets.
- [ ] authenticated session is not destroyed unnecessarily.

# Test-only legacy route

## E2E Super Admin Login
Legacy `/e2e/superadmin-login` is a test helper.

- [x] Classified RETIRED as product UI.
- [ ] vNext E2E/auth harness covers equivalent deterministic test setup without a production backdoor.
