# HR / Recruiter — Detailed Page Parity Spec

Legacy navigation: Today, Drives, Calendar, Messages, Company & Team. Profile and invite/bootstrap are secondary surfaces.

Recruiter sessions are college-scoped. The global/college-less state is a chooser, not an implicit fallback into a random college.

# Home

## Page: HR Home — college chooser state
**Legacy:** `/hr/home` when no college membership is active.

> **2026-10-10 W05 partial implementation:** `/hr/home` now renders recruiter
> company context, active college-access cards, a no-active-access state and safe
> links into Company & Team / Hiring Workspace. `/hr/colleges` redirects here.
> This is **not closed**: pending invitations, persisted active-college switching,
> account-load retry, college logos/valid-until and the college-scoped Today task
> dashboard remain open.

Legacy contract:
- greeting + company;
- pending invitations;
- college cards with name/code/logo/valid-until;
- Open action switches membership;
- no-access empty state;
- account-load error + retry.

- [ ] Global/college-less session is represented explicitly.
- [ ] Pending invitations are visible and actionable.
- [ ] College cards fields match.
- [ ] Open switches to the exact selected recruiter membership.
- [ ] switch failure does not leave ambiguous active scope.
- [ ] no-college-access empty state matches.
- [ ] loading/account-error/retry states match.

## Page: Today — college-scoped
Audited `HrToday` contract:
- greeting/college/company context;
- Request a Drive;
- actionable task cards;
- Waiting section;
- This Week events;
- Live drive/round card;
- hard error vs stale-last-success distinction;
- all-done empty state.

- [ ] greeting/context matches active college.
- [ ] Request a Drive CTA works.
- [ ] task taxonomy/action links match.
- [ ] urgency/status cues match.
- [ ] Waiting section matches.
- [ ] This Week schedule matches.
- [ ] Live operational card matches.
- [ ] done/empty state matches.
- [ ] initial loading, hard error and stale refresh states are distinct.

# Drives

## Page: Drives List
**Legacy:** `/hr/drives`

Legacy views:
- Waiting;
- Live;
- Closed;
- All.

Legacy behavior:
- search by role;
- counts in segmented tabs;
- Request a Drive;
- cards;
- sent-back attention;
- Fix and Resend;
- Hire Again;
- Open;
- no college selected state;
- "drive access not switched on" state;
- stale list alert.

- [ ] all four lifecycle views/counts match.
- [ ] search matches.
- [ ] card fields/status match.
- [ ] sent-back attention state matches.
- [ ] Fix and Resend deep link matches.
- [ ] Hire Again deep link matches.
- [ ] Open matches.
- [ ] Request a Drive matches.
- [ ] no-college-selected state matches.
- [ ] no-drive-access state matches.
- [ ] loading/hard-error/stale/empty states match.

## Page: Request a Drive
**Legacy:** `/hr/drives/new`  
Modes:
- new;
- fix/send again (`?fix=`);
- hire again (`?from=`).

Legacy sections/fields:
- restored unsent draft;
- placement-cell requested-changes note;
- Role and Work: role title, description, JD file, location, mode;
- Compensation and Agreement: CTC, fixed, variable, bond months/amount and related agreement fields;
- Rounds with presets, add/remove, round kind/name;
- Eligibility: min CGPA, active backlogs and other legacy eligibility fields;
- "What students will see" preview;
- Send for Approval / Send Again;
- success state: Open Drive / Go to Drives / Request Another.

- [ ] New mode matches.
- [ ] Fix mode loads prior request + placement-cell note.
- [ ] Hire Again mode copies prior drive safely.
- [ ] unsent draft restore behavior matches.
- [ ] Start Over clears restored draft safely.
- [ ] Role/description/location/mode fields match.
- [ ] JD file upload validation matches; storage remains explicit BLOCKED until live.
- [ ] compensation fields match.
- [ ] bond/agreement fields match.
- [ ] round presets match.
- [ ] add/remove/edit round rows match.
- [ ] round kinds match TALK/TEST/VENDOR_TEST/GD/INTERVIEW.
- [ ] eligibility fields match.
- [ ] preview matches student-visible payload.
- [ ] submission validation matches.
- [ ] successful result state/actions match.
- [ ] college/permission/error/not-found states match.

## Page: Drive Detail
**Legacy:** `/hr/drives/[jobId]`

Global states:
- loading;
- account/drive error;
- choose-college-first;
- 404;
- back to Drives.

- [ ] all global states match.
- [ ] drive header role/status/applicant/offer/round summary matches.

### Tab: Overview
- [ ] drive/recruiter/college summary matches.
- [ ] lifecycle/status and placement-cell response state match.
- [ ] pipeline summary matches.
- [ ] contextual actions (fix/hire again/other legacy actions) match.
- [ ] read-only closed state matches.

### Tab: Applicants
Legacy:
- applicants visible only after placement cell shares;
- focused review CTA;
- stage filter buttons;
- applicant table;
- applicant detail drawer;
- recruiter notes/ratings;
- "review for which round?" modal.

- [ ] not-shared state matches.
- [ ] applicant list/fields match.
- [ ] stage filters/counts match.
- [ ] focused review CTA matches.
- [ ] applicant detail drawer matches.
- [ ] recruiter notes/ratings match.
- [ ] round-selection modal for decisions matches.
- [ ] access to sensitive fields follows company-share policy.

### Tab: Rounds & Interviews
Legacy:
- list rounds;
- add a round;
- edit recruiter-created unused round;
- remove only safe unused/no-results round;
- Round modal: kind/name/mode;
- Interview Slots sub-area;
- Results from table sub-area.

- [ ] round list/status/ownership markers match.
- [ ] Add Round action matches.
- [ ] Edit restrictions match.
- [ ] Remove Round confirmation/blockers match.
- [ ] Round modal fields/validation match.
- [ ] Interview Slots view matches.
- [ ] Propose Slot fields/time/capacity/panel match.
- [ ] slot status/placement-cell response matches.
- [ ] Results table round selector matches.
- [ ] outcomes PASS/FAIL/HOLD/ABSENT match.
- [ ] bulk result submission/confirmation matches.

### Tab: Offers
Legacy:
- offers table/status;
- reply by/joining;
- send selection list collapse;
- selected applicant table;
- kind OFFER/LOI;
- optional role;
- CTC;
- submit selection confirmation.

- [ ] offers table fields/status match.
- [ ] joining/reply-by state matches.
- [ ] selection-list workflow matches.
- [ ] applicant row selection matches.
- [ ] OFFER/LOI kind matches.
- [ ] role/CTC fields/validation match.
- [ ] final send confirmation/consequence matches.

### Tab: Messages
- [ ] drive-scoped thread history matches.
- [ ] send message body validation matches.
- [ ] placement-cell/recruiter authorship context matches.
- [ ] failed-send/retry state matches.

# Calendar

## Page: Recruiter Calendar
**Legacy:** `/hr/calendar`

Legacy:
- week-based calendar;
- Previous Week / Today / Next Week;
- event types ROUND, SLOT, DEADLINE, RESULTS_DUE;
- day columns;
- click event -> Drive Overview or Rounds;
- no-college/account states;
- retry/error;
- nothing-scheduled-this-week empty state.

- [ ] week navigation matches.
- [ ] event taxonomy/colors/labels match.
- [ ] event time/day placement matches.
- [ ] event click deep links match.
- [ ] today state matches.
- [ ] empty/loading/error states match.
- [ ] timezone handling matches.

# Messages

## Page: Recruiter Messages
**Legacy:** `/hr/messages`

Legacy:
- total unread summary;
- conversation count;
- search;
- thread list;
- unread badges/last-message context;
- open thread;
- stale refresh alert;
- empty state.

- [ ] unread/count summary matches.
- [ ] conversation search matches.
- [ ] thread ordering/preview matches.
- [ ] unread markers/read state match.
- [ ] open thread behavior matches.
- [ ] sending/replying behavior from thread matches.
- [ ] stale/hard-error/loading/empty states match.
- [ ] conversations are restricted to active college/recruiter company.

# Company & Team

## Page: Company & Team shell
**Legacy:** `/hr/company` with query-state tabs Company, Team, Reports.

> **2026-10-10 W05 partial implementation:** `/hr/company` now has an explicit
> active-grant college chooser, Company and Team query-state tabs, company
> relationship context, tenant-scoped active teammate reads and a You marker.
> Recruiter shell navigation now links to this surface. This is **not closed**:
> legacy Reports, per-teammate drive counts, industry/logo parity, Your Profile
> CTA, custom load/retry states and executed browser/runtime evidence remain open.

- [ ] active tab persists in URL.
- [ ] Company & Team header/active-college context matches.
- [ ] Your Profile CTA works.
- [ ] account/no-college/loading states match.

## Tab: Company
- [ ] company identity/profile fields match.
- [ ] college-specific relationship context matches.
- [ ] load-error/retry state matches.

## Tab: Team
- [ ] recruiter team member list matches.
- [ ] Name/designation/email/You marker match.
- [ ] empty "Only you so far" state matches.
- [ ] team visibility follows company/account scope.

## Tab: Reports
Legacy:
- funnel/progress analytics;
- all drives at college;
- columns Drive/status, Applied, Offered, Accepted, Declined, Joined;
- drive row deep link.

- [ ] funnel/progress metrics match.
- [ ] all-drive report rows match.
- [ ] offered/accepted/declined/joined semantics match.
- [ ] row deep link works.
- [ ] no-drives empty state matches.

# Profile

## Page: Recruiter Profile
**Legacy:** `/hr/profile`

> **2026-10-10 W05 partial implementation:** `/hr/profile` now reads the
> authenticated recruiter identity/company context, lists exact active college
> grants and provides a destructive-confirmation Leave Access action backed by a
> same-origin endpoint that can revoke only the caller's own active grant.
> Company & Team links to this profile. This is **not closed**: exact editable
> First Name / Last Name parity is blocked because the current shared user schema
> exposes only `displayName`; save/edit validation and executed browser/runtime
> evidence remain open.

Legacy:
- Your Details card;
- editable First Name, Last Name, Email, Designation;
- Save Changes;
- College Access card;
- Leave Access action;
- Account card: Mobile, Company, College;
- mobile/company centrally managed;
- loading/error retry.

- [ ] editable fields/validation match.
- [ ] Save updates active session display safely.
- [ ] Mobile remains read-only/centrally managed.
- [ ] Company remains read-only/centrally managed.
- [ ] College Access list matches.
- [ ] Leave Access destructive confirmation matches exact consequence.
- [ ] leaving invalidates access immediately and returns user to valid scope.
- [ ] loading/error/retry states match.

## Retired route: HR Colleges
**Legacy:** `/hr/colleges` is an explicit redirect to Home.

- [x] Classified RETIRED; do not recreate a separate product page.

# Invite / bootstrap

## Public Page: Recruiter Invite
**Legacy:** `/hr-invite/[token]`

Legacy states:
- loading;
- invalid/expired link;
- existing-account "One more step" sign-in;
- declined/not-hiring/unsubscribed success;
- joined success;
- join form;
- First Name;
- Designation;
- Mobile;
- Join;
- Not hiring from this college this season;
- Stop contacting me.

- [ ] token validity/expiry/revocation semantics match.
- [ ] existing-account sign-in handoff matches.
- [ ] join form fields/validation match.
- [ ] mobile/account identity collision handling matches.
- [ ] successful join creates correct company/college membership/grant.
- [ ] Not Hiring response matches CRM state.
- [ ] Stop Contacting Me response matches unsubscribe state.
- [ ] duplicate/replayed token behavior is safe.
- [ ] loading/error/success states match.
- [ ] public route leaks no applicant/college-private information before acceptance.


**2026-10-14 Chat 6 HR job Applicants/Offers — PARTIAL:** Tabs use persisted job-scoped applicant + screening records for placement-cell-SHORTLISTED candidates only, with active/withdrawn counts and filters, 200-row source cap, and job offers read-only for shared applicants. Recruiter grant is checked before both reads; no internal screening reasons or unshared candidates are queried. Remaining: exact legacy share marker semantics, private/no-share placeholders, applicant drawers/review writes, pagination, executed PG/browser verification, and privacy review.

**2026-10-14 Chat 6 / HR cross-company job routing — PARTIAL:** Existing recruiter job resolver now converts missing/foreign-company/foreign-college/wrong-role job access to identical non-enumerating PLACEMENT_JOB_NOT_FOUND before candidate/offer reads. HR job page maps that and malformed job UUID to a localized not-found state and provides a loading skeleton. Added a pure permission model plus unit and isolated PG fixture tests (authored, not executed). Remains: runtime/browser testing, expiry/revocation concurrency and exact legacy 403/404 copy review.

**2026-10-14 Chat 10 / HR Drives List — PARTIAL:** Added college-grant chooser, four lifecycle tabs, strict role-title search, mobile-friendly published/closed cards and non-archived counts from authorized employer jobs. Waiting requests are explicitly not fabricated from jobs. Remaining: persisted employer request workflow / sent-back and hire-again, pending draft state, full legacy card fields, stale-success handling, browser verification and executed PG tests.


**2026-10-14 Chat 10 / HR Today — PARTIAL:** Added exact-grant college chooser, live-drive and seven-day deadline cards, this-week scheduled-round links and honest zero/empty states from recruiter-scoped persisted jobs/rounds. India calendar-day range is pure-tested; cross-company and wrong-role PG fixture tests are authored but not executed. Remaining: request-drive CTA and approval/waiting taxonomy, invitations, persisted active-college switching, messages, live card fidelity, stale refresh and browser/runtime acceptance.


**2026-10-14 Chat 10 / Company Profile hiring footprint — PARTIAL:** Company tab now shows exact college-relationship live/closed/total persisted drive counts and three recent recruiter-visible drive links, no individual recruiter attribution, plus a strict college ID parse and existing profile CTA. Pure projection and isolated PG fixture tests authored, not executed. Remaining: legacy industry/logo (industry absent from registered company schema; logo storage blocked), individual teammate drive counts require real assignment evidence, custom stale/error retry, browser acceptance and full legacy Company tab parity.


**2026-10-14 Chat 10 / HR Round Results table — PARTIAL:** Added standalone chooser and per-drive round selector with outcome filters/counts, STAGED versus APPLIED status, score/waitlist display, responsive candidate rows and link back to the existing staging workspace. Read via recruiter job non-enumerating company/college grant guard and only screening-SHORTLISTED candidates; no internal comments are projected. Pure-model and isolated PG success/foreign/wrong-role tests authored, not executed. Remaining: exact legacy Results-from-table embed/tab, bulk submission/review and interview-slot workflows, share-policy audit, stale-state/cross-role/browser and PG acceptance.


**2026-10-14 Chat 10 / Applicant review drawer — PARTIAL:** Scoped, read-only applicant panel opened from shortlisted recruiter-visible list; active college membership/user status and exact company job guard checked before contact display, IST application date, mobile bottom sheet, non-leaking missing candidate. Unit and isolated PG role/foreign tests authored, not executed. Remaining: recruiter notes/ratings and round-specific review write schema, full legacy share marker, pagination beyond 200, runtime/browser privacy evidence.


**2026-10-14 Chat 10 / Offers and selection read view — PARTIAL:** Persisted shared-offer versions now show reply expiry, accepted/declined/issued counts and explicit joining outcomes; selected-candidate readiness inferred ONLY from completed APPLIED PASS rounds. LOI kind and recruiter selection sending remain explicitly unsupported (no registered LOI row, no external sending). Scoped service/Pure-model/isolated PG tests authored, not executed. Remaining: final selection confirmation, OFFER/LOI issuance and upstream approval, response workflows, complete legacy table & browser/PG proof.


**2026-10-14 Chat 10 / Company Reports outcome funnel — PARTIAL:** Joined and declined offer counts now use persisted offer/explicit joining records (joined counted only with ACCEPTED), in addition to existing applied/issued/accepted; responsive mobile cards complement table. Relationship scope and bound page size preserved, no candidate PII. Pure unit and PG no-grant/wrong-role tests authored but unexecuted; positive persisted tenant/report fixtures, historical dedup, deep legacy report parity and browser evidence remain open.


**2026-10-14 Chat 10 / HR Results-Due Calendar — PARTIAL:** Persisted recruiter-company/college-scoped round resultsDueAt dates now appear as a dedicated IST due list with job/round drill-ins and counts. Round query includes dates in view even if meeting scheduled in another week; no slot, messaging or candidate data fabricated. Unit and isolated PG role/company/college fixtures authored (not executed). Remaining: integrated legacy RESULT_DUE event taxonomy in day columns, interview SLOT table, stale-load treatment and browser/PG proof.


**2026-10-14 Chat 10 / HR Drive Detail overview — PARTIAL:** Added employer-visible summary cards for shared/withdrawn application counts, issued/accepted offers and completed/total evaluative rounds, persisted deadline/read-only cues and tab navigation. Counts explicitly capped to existing 200-row views; pure unit + in-test PG company/role denials authored but unexecuted. Remaining complete legacy request lifecycle, review actions, exact pipeline stage attribution, unconstrained pagination and browser privacy proof.


**2026-10-14 Chat 10 / HR Drive List structured filters — PARTIAL:** Employment type, work mode, explicit missing/deadline-within-seven-days selectors and 20-row view pagination augment prior college/lifecycle/search filters. All data still arrives through exact recruiter grant-scoped job read; Waiting not fabricated. Unit and in-test PG foreign/wrong-role fixtures authored, unexecuted. Remaining: DB-side keyset paging and total count at scale, actual recruiter request lifecycle, exact legacy sticky/stale behavior and browser acceptance.


**2026-10-14 Chat 10 / Recruiter profile designation edit — PARTIAL:** Self-only designation PATCH with strict Zod input, same-origin guard, central identity.self.manage, active matching company/recruiter profile, millisecond optimistic token, append-only activity event in transaction, mobile editable control and conflict retry. Name/email/mobile remain central read-only; first/last name schema absent. Pure unit and disposable PG success/foreign/wrong-role/stale tests authored, not executed. Remaining runtime security and browser acceptance, exact legacy independent first/last name editing.


**2026-10-14 Chat 10 / Recruiter cross-company list isolation — PARTIAL:** Extended shared recruiter job list with exact persisted placement-company ID filter and post-query grant+company invariant; this protects HR Drives, Today and Calendar from forged/mismatched relationship grants. Isolated PG success/foreign-company/wrong-role and pure policy tests authored but unexecuted. Also corrected designation whitespace normalization, typed form event and monotonic optimistic version timestamp. Remaining security review against revoked grants, runtime PG/lint/typecheck and browser acceptance.


**2026-10-14 Chat 10 follow-up / recruiter scope placement — PARTIAL:** Corrected exact employer company filter placement: it belongs only on recruiter-owned job listing, not the TPO's administrator grant directory. Preserves TPO grant listing while retaining company enforcement on HR drives/calendar/dashboard. Auth regression test added below; execution remains orchestrator-gated.


**2026-10-14 Chat 10 / Embedded HR round results table — PARTIAL:** Rounds tab now includes Results from table selector and validated outcome filtering using the same recruiter-grant-protected, SHORTLISTED candidate projection as the standalone view; stages distinguish STAGED from APPLIED with no private notes. Responsive cards and explicit zero/empty states. Pure model/unit and isolated PG success/foreign company/college/wrong-role tests authored, not executed. Remaining legacy bulk result workflow, interviewer slot UI, stale-result concurrency, browser acceptance.


**2026-10-14 Chat 10 / Today result deadline task cards — PARTIAL:** Today now includes this-week results-due count and IST links for persisted employer-owned rounds, filtered again to the selected college job allowlist; no candidate identities/external notifications. Pure projection unit and in-test PG foreign-company/college/wrong-role fixtures authored, unexecuted. Remaining legacy Today task taxonomy, actual requests and waiting states, stale-last-success, browser/mobile acceptance.


**2026-10-14 Chat 10 / Shared candidate contact privacy — PARTIAL:** Recruiter round read now explicitly requires an ACTIVE learner user, ACTIVE same-college membership, SUBMITTED application, SHORTLISTED screening, exact employer company and previously authorized job. Applies SQL active-user filter and pure post-query disclosure guard before round participant names/emails are projected. Unit privacy matrix + disposable PG own/foreign-company/college/wrong-role tests authored, unexecuted. Remaining genuine shortlist user fixture, share-marker parity, runtime/browser privacy acceptance.


**2026-10-14 chat-10 HR Calendar RESULTS_DUE day placement — PARTIAL:** Persisted recruiter-scope results-due events now appear in the IST week/month day columns and agenda, including due-only calendar days and round deep links. No invented SLOT data. Unit and prior in-test PostgreSQL authorization fixture extended but not executed. Remaining slot table, mobile/browser acceptance, and stale-load distinctions.


**2026-10-14 chat-10 Selection readiness across all evaluative rounds — PARTIAL:** Recruiter offers selection preview now requires APPLIED/PASS in every non-TALK round, with every round COMPLETED; final-round-only PASS no longer confers readiness. JOINED offer count requires ACCEPTED offer state and explicit JOINED outcome. Pure unit regression and existing in-test PG scope fixture updated; tests not executed. Remaining persisted recruiter selection/LOI workflow (no registered table), full offers pagination, desktop/mobile confirmation.


**2026-10-14 chat-10 / Shared applicant pagination — PARTIAL:** Recruiter job Applicants tab uses exact-grant scoped DB aggregation for all SUBMITTED/WITHDRAWN shortlisted application counts and DB limit/offset pages of 25 (rather than silent 200-row truncation). Mobile previous/next controls retain stage and drawer page; status/college/active-user filters remain enforced before count and list. Pure-model and in-test PG foreign-company/wrong-role tests updated, not executed. Remaining deep private share marker parity, cursor pagination at scale and browser acceptance.


**2026-10-14 chat-10 / Request a Drive read-first draft — PARTIAL:** New `/hr/drives/new` page with authorized college chooser, local form for role/work/CTC/CGPA/rounds, validation, student-visible preview, Start Over and clipboard copy. `?from=` copies only an exact company/college-authorized published/closed drive for Hire Again preview; `?fix=` explicitly blocked until request-change persistence exists. No draft persisted, external sending, fake approval or file feature. Pure model/unit + in-test PG success/foreign-company/college/wrong-role tests authored, not executed. Remaining full legacy agreement/JD/eligibility and request submission lifecycle, restored draft, fix/send, browser acceptance.


**2026-10-14 chat-10 / Request Drive / Hire Again deep links — PARTIAL:** Recruiter Today and Drives pages now advertise their scoped local Request a Drive preview; authorized Drive Detail exposes Hire Again preview from exact company-owned job. Every generated link validates UUID and carries selected college; target server rechecks grant and relationship before job clone. Pure model plus in-test PG own-company fixture extended; not executed. Remaining full persisted submission/fix/resend and browser acceptance.


**2026-10-14 chat-10 / Request Drive compensation and eligibility preview — PARTIAL:** Local draft adds fixed/variable CTC, bond months/amount and active-backlog eligibility, Zod validation and a student-view preview. No request is saved or sent. Unit tests and existing isolated PG owned-company preview fixture updated but not executed. Remaining complete persisted approval lifecycle, JD attachment, and verified legacy acceptance.


**2026-10-14 chat-10 / HR offer status counts and database paging — PARTIAL:** Offers tab now uses exact company-shared shortlist SQL aggregate totals (ISSUED/ACCEPTED/DECLINED/WITHDRAWN, awaiting, overdue and ACCEPTED+JOINED) with separate filtered 25-offer DB pages. Status and previous/next links are read-only; LOI and external sending remain unsupported. Pure pagination tests and in-test PG foreign-company/wrong-role fixture extended, unexecuted. Remaining full selection/issuance workflow and browser acceptance.


**2026-10-14 chat-10 / HR Calendar narrow-screen views — PARTIAL:** Week and month now render date-grouped mobile cards without the desktop seven-column horizontal grid, preserving separate persisted rounds, deadlines and results due with exact recruiter job links. Desktop grid remains. Pure unit and PG fixture updated, unexecuted. Also corrected Offers pagination display to use exact selected-state total. Remaining browser viewport/scroll validation and legacy interview-slot surface.


**2026-10-15 chat-10 / recruiter shared-applicant CSV — PARTIAL:** Added GET export from exact recruiter-owned job, capped at 200 rows through per-page shortlist-and-active-user-scoped existing reads, formula-neutralized quoted CSV, IST submission time, explicit omitted count, and all contact fields masked (never exported for recruiters). No new permission or mutation. Pure unit and in-test isolated PG own/foreign-company/wrong-role fixtures authored but not run. Remaining real shortlisted applicant positive fixture, concurrent revocation snapshot behavior, browser file acceptance.


**2026-10-15 chat-10 / recruiter hiring activity feed — PARTIAL:** New read-only /hr/activity filters persisted PLACEMENTS job-published/closed audit events by exact company+college-owned job IDs, replacing raw audit summaries with fixed non-sensitive event labels and IST timestamps. No applicant contacts, new sends or table changes. Pure unit and disposable PG own/foreign/wrong-role tests authored but unexecuted. Remaining notification unread/read, message threads, browser acceptance.


**2026-10-15 chat-10 / HR round schedule overlap — PARTIAL:** Drive Rounds now displays owned persisted round start/end, venue/mode and conservative potential overlap warnings only with known positive durations; IST labels, no invented SLOT or write actions. Unit/isolated PG own-company, foreign-company and wrong-role fixtures authored; unexecuted. Remains true resource/slot conflict checks and browser acceptance.


**2026-10-15 chat-10 / recruiter self-name profile edit — PARTIAL:** Self-only displayName edit is backed by registered users table, strict Zod, central identity.self.manage, same-origin PATCH, active profile matching exact recruiter company, SQL millisecond optimistic CAS and transactional activity audit. Profile displays the editable own name; company identity/email/mobile stay read-only. No file features or external sending. Pure unit and in-test PostgreSQL success/foreign-company/wrong-role/stale/audit fixtures authored but not run. Remaining independent legacy first/last name fields, browser acceptance and session-display propagation check.


**2026-10-15 chat-10 / HR read-only in-app notifications — PARTIAL:** New /hr/messages page safely lists persisted own-recipient in_app_notifications joined to allowlisted PLACEMENTS job lifecycle events and exact recruiter company+college job IDs; unread-only filter, chooser, bounded newest 100 and IST times. Never displays raw notification body/title or applicant contact. Pure unit and in-test PostgreSQL own positive/foreign-college/wrong-role fixtures authored, not executed. Remaining true legacy threads, read acknowledgement, real-time refresh, browser acceptance.


**2026-10-15 chat-10 / recruiter notification acknowledgement — PARTIAL:** Same-origin POST marks only own-recipient, exact-company job-lifecycle notification readAt using strict createdAt optimistic CAS and no new external send or noisy audit event. Foreign-company notification resolves non-leaking PLACEMENT_JOB_NOT_FOUND; duplicate or stale becomes declared PLACEMENT_RECRUITER_NOTIFICATION_STALE. Read button refreshes inbox. Unit + isolated PG own/foreign/wrong-role/stale tests authored, unexecuted. Remaining legacy thread-level read semantics and browser acceptance.


**2026-10-15 chat-10 / recruiter offers CSV — PARTIAL:** Authorized own-company Offers tab now exports filtered, SQL-paginated, 200-row capped and formula-neutralized CSV (including persisted reply deadline and joining outcome). Recruiter CSV never includes contact regardless of shortlist. Endpoint rechecks company+college job before each page and sets no-store/omitted header. Pure unit and isolated PG own/foreign/wrong-role tests authored, unexecuted. Remaining LOI/selection writes and complete browser/export acceptance.


**2026-10-15 chat-10 / Today unread recruiter notifications — PARTIAL:** Today now shows company-and-selected-college-scoped count of unread eligible in-app job notifications, deep links to filtered /hr/messages and to the separate hiring activity history. Count explicitly states if truncated to 100; no private recipient/body content or implicit college fallback. Pure unit and in-test PostgreSQL own/wrong-scope notification fixture extended, unexecuted. Remaining legacy task lifecycle, full inbox pagination, browser/mobile acceptance.


**2026-10-15 chat-10 / Company Reports CSV — PARTIAL:** Existing scoped recruiter report now supports a read-only 200-drive capped formula-neutralized CSV of aggregate funnel metrics, no student identities or contact. Each page reuses the exact recruiter company/college report service; explicit omitted header and no-store. Pure-model unit + in-test PostgreSQL own/foreign-company/wrong-role fixtures authored but unexecuted. Remaining long-history de-dup, browser download acceptance.


**2026-10-15 chat-10 / Notifications exact counts and pagination — PARTIAL:** DB-scoped exact total/unread aggregate replaces loaded-set estimate, and unread/all lists now serve 25-row pages with previous/next. Today displays actual authorized unread count. Company/college/recipient filters precede totals and rows; no private bodies. Pure model tests authored, PG existing fixtures applicable but unexecuted. Remaining thread parity and browser acceptance.


**2026-10-15 chat-10 / HR notification title search — PARTIAL:** Search authorized job titles in Messages, applied to the exact company-and-college allowlist before notification queries, with GET search retained across pages. No private message body, candidate contact or other-company jobs. Unit and in-test PG fixtures extended, unexecuted.


**2026-10-15 chat-10 / recruiter activity lifecycle filters — PARTIAL:** /hr/activity adds explicit Published/Closed/All URL filters at SQL query level after exact company+college job allowlist; counts remain bounded, raw audit metadata hidden. Unit and in-test PostgreSQL filters extended, not executed. Remaining full audit pagination and legacy Messages threading.


**2026-10-15 chat-10 / Company Team search — PARTIAL:** Company & Team now has college-preserving GET name/designation/email search applied solely to exact company+relationship authorized active team returned by existing service, with explicit matching count and pure model/unit test. No new disclosure, company mutation or external messaging. Remaining DB paging at scale and browser acceptance.


**2026-10-15 chat-10 / HR Calendar event-category filters — PARTIAL:** Week/month/agenda calendar now filters presentation across authorized Rounds, Application deadlines, Results due or All, preserving category in prior/today/next and view URLs; no fabricated interview slots and no new candidate disclosure. Pure model/unit tests authored; PG auth continues through existing listRecruiterCalendarEvents and remains to be executed. Browser viewport validation open.


**2026-10-15 chat-10 / Request Drive round presets — PARTIAL:** Added three local hiring-round presets (interview-only, test+interview, full TALK/TEST/GD/INTERVIEW); replacing round lists never saves, submits, or mutates source Hire Again jobs. Pure model/Zod unit tests authored. Also corrected calendar category filter typing to preserve typed result-due records. Remaining persisted approval and browser parity.


**2026-10-15 chat-10 / Hiring activity server pagination — PARTIAL:** Read-only /hr/activity now pages allowlisted employer/college audit events using stable occurredAt/id sort, capped limit+1 lookahead, bounded numeric page and filter-preserving previous/next links. No private metadata. Pure-model and in-test PG page bounds extended, unexecuted. Remaining keyset paging at large offsets and browser acceptance.


**2026-10-15 chat-10 / HR Drives sorting — PARTIAL:** Authorized published/closed drives list supports URL-persisted newest, deadline-first (missing deadlines last), and title sorting before 20-row client pages. Sorting operates after exact recruiter college/company filtering and does not mutate source. Unit test for validation, deterministic tie and sort authored, unexecuted. Remaining server keyset sorting at scale and browser acceptance.


**2026-10-15 chat-10 / Request Drive scoped saved-draft restore — PARTIAL:** Recruiter can explicitly save a *validated* unsent draft in sessionStorage (browser tab, 24-hour expiry) and restore it. Key includes recruiter user, selected college and authorized Hire Again source; JSON is Zod validated, length and TTL checked, Start Over clears it. No server persistence, external send or file storage. Pure model and own-company PG source fixture extended, unexecuted. Remaining restoration of incomplete drafts, approval workflow and browser acceptance.


**2026-10-15 chat-10 / employer hiring activity CSV — PARTIAL:** Company/college-scoped history export caps at 200, formula-neutralizes titles, uses fixed event labels and IST timestamps without raw audit metadata or contacts. Rechecks scope before its second bounded page. Pure-model unit and in-test PG scope assertions added, unexecuted. Remaining browser acceptance and full-history export.


**2026-10-15 chat-10 / Request Drive round ordering — PARTIAL:** Accessible Up/Down controls reorder unsent rounds with boundary guards and immutable draft projection; no network writes or approval state is fabricated. Unit tests authored, not run. Browser acceptance remains.


**2026-10-15 chat-10 / Request Drive student preview sequence — PARTIAL:** Local-only validated preview now enumerates round sequence/kind/name and compensation/eligibility (not just count), using top-level const for display fields. Pure model/unit ensures round order; no misleading approval or storage. Remaining real student-facing schema integration and browser acceptance.


**2026-10-15 chat-10 / Company Team roster export — PARTIAL:** Adds scoped recruiter-team CSV (200 cap, formula-neutralized, no-store) from getRecruiterCompanyTeam's exact company+college active grant read. Shows existing authorized recruiter name/designation/email only; no learner contacts. Pure model/unit authored, PG scope remains covered by existing team reads but not re-executed. Remaining browser acceptance and large-team paging.


**2026-10-15 chat-10 / Today deadline urgency — PARTIAL:** Adds Passed/Within 24h/Upcoming labels to persisted company+college-scoped results-due cards. Labels only describe clock distance, not unsent/stale result state. Pure boundary unit authored; existing scope fixture applicable but not executed. Remaining stale/live browser refresh proof.


**2026-10-15 chat-10 / Results-due round deep links — PARTIAL:** Calendar (desktop/mobile/cards) and Today due cards now link directly to the persisted authorized `roundId` in the drive Rounds tab, instead of falling back to its first round. Existing job resolver re-authorizes exact company/college and rejects foreign/missing rounds. Unit URL encoding and existing scoped PG results-due fixture cover the contract but were not executed. Browser acceptance remains.


**2026-10-15 chat-10 / HR Home authorized college-card metadata — PARTIAL:** College-less chooser now displays verified active grant's college code and access-granted IST date, using self-only company+college authorization checked against persisted relationships, and filters stale grants rather than rendering them. Does not invent logo or expiry fields. Pure unit extended; runtime/PG/browser proof pending.


**2026-10-15 chat-10 / Profile college access quick navigation — PARTIAL:** Each exact active self-grant exposes scoped Today, Drives and Company & Team links, validated by a pure UUID route model. Explicitly distinguishes page selection from unavailable persistent membership switching. No new write, user data or company disclosure. Unit test authored, execution and full legacy scope-switch persistence remain.


**2026-10-15 chat-10 round 4 / draft annual CTC consistency — PARTIAL:** Request a Drive now validates a fully specified fixed-plus-variable amount against both the advertised minimum and maximum annual CTC; incomplete breakdowns are not misrepresented as totals. Cross-field errors attach to the relevant field. Pure unit coverage authored, execution pending; no submission, storage, or external notification.


**2026-10-15 chat-10 round 4 / duplicate hiring-round validation — PARTIAL:** Request a Drive rejects ambiguous duplicate stage names even across kinds after case/whitespace normalization, identifying the offending round row while preserving legitimate multiple rounds. Pure Zod unit cases authored, unexecuted. No placement decision or actual round write.


**2026-10-15 chat-10 round 4 / recruiter notification CSV — PARTIAL:** New read-only export traverses up to eight exact recipient/company/college-scoped notification pages, capped at 200, with formula-neutralized job titles, fixed lifecycle labels, IST receive times, and unread flag. Raw notification titles/bodies, applicant contacts and other employers' notifications are never exported. Unit tests authored but unexecuted; PG/browser proof pending.


**2026-10-15 chat-10 round 4 / recruiter team paging — PARTIAL:** Company & Team Team tab now paginates the *already authorized and search-filtered* company roster in 25-row slices with URL-stable search and prev/next controls. No cross-company user enumeration, no new data selected. Pure unit tests authored but unexecuted. DB keyset paging and browser acceptance remain.


**2026-10-15 chat-10 round 4 / named round schedule conflict detail — PARTIAL:** Rounds tab now lists exact other authorized round names and sequence numbers for known-duration overlaps, rather than an unexplained count. Pure projection rejects unresolved/foreign IDs, never claims venue/panel reservation conflicts, and has unit coverage authored but not executed. Actual interview slot workflow remains.


**2026-10-15 chat-10 round 4 / recruiter calendar CSV — PARTIAL:** Export the selected persisted calendar week/month/agenda view as a category-filtered, IST-timestamped CSV, capped at 200 and formula-neutralized. It calls the existing recruiter-scoped job/round calendar service; no student contacts, placement-cell private notes or fictional interview slots. Pure unit cases authored, not executed; browser download and PG acceptance remain.


**2026-10-15 chat-10 round 4 / Today live hiring-drive operational cards — PARTIAL:** Today now shows up to three company+college-filtered, non-archived published drives with the earliest recorded application deadlines, safe deep links, and an honest no-live-drive state. No fictitious recruiter attribution or offers are inferred. Pure model/unit covers wrong company/college, archived, closed, sorting and limits; execution and browser proof pending.


**2026-10-15 chat-10 round 4 / Drives IST-day and past-deadline filters — PARTIAL:** Drives adds Today (Asia/Kolkata calendar day) and recorded deadline-passed filters atop authorized published/closed jobs. Past deadline is a timestamp fact, never claimed to indicate a live application or auto-closed drive. Filters preserve URL/search and cap. Pure date-boundary and query tests authored but unexecuted; browser review pending.


**2026-10-15 chat-10 R5 / Hiring Activity loading and hard error — PARTIAL:** Activity history has route-local loading skeleton and explicit retryable read error; failed reads are not disguised as no activity. Pending runtime/browser error boundary verification and legacy stale-last-success.


**2026-10-15 chat-10 R5 / Messages loading and hard error — PARTIAL:** Scoped notifications now have a route-local loading skeleton and retryable error state that distinguishes failed reads from empty inbox or zero unread. No additional recipients, messages or data exposure. Browser and stale-refresh acceptance open.


**2026-10-15 chat-10 R5 / Drive Detail hard error — PARTIAL:** Added retryable route-local error state and Back to Drives option for operational loading failures, separate from existing 404 and loading skeleton. Error copy never displays raw denial codes or private applicant data. Browser permission/error verification pending.


**2026-10-15 chat-10 R5 / Company Team filtered export — PARTIAL:** Team CSV now uses the same bounded name/designation/email search as the visible team page, applied only after exact persisted employer-college team authorization. Export link retains selected college and search; no unshared candidate contacts are added. Pure filter unit extended; PG/browser download proof remains.


**2026-10-15 chat-10 R5 / Round calendar filter taxonomy — PARTIAL:** Fixed Rounds-only display to include exactly registered ROUND events rather than all non-deadline records. Unregistered or future SLOT/GENERAL items cannot be silently mislabeled as interviews. Pure regression test authored; existing employer-scoped calendar service remains the authorization boundary. Full legacy slot taxonomy still pending.


**2026-10-15 chat-10 R5 / Request Drive compensation review — PARTIAL:** Validated local preview now flags potentially inconsistent fixed+variable total versus stated min/max CTC, and one-sided bond amounts/durations. Warnings are informational, never fabricated application rejections or server submissions. Pure boundary unit authored; review does not alter draft persistence. Browser acceptance pending.


**2026-10-15 chat-10 R5 / Drive-grouped notification page — PARTIAL:** Read-only Messages screen groups its current 25 authorized notification rows by drive, showing per-page unread totals while preserving record-level mark-read actions. Explicitly states this is *not* persisted conversation threads or cross-page totals. Pure model/unit added; recipient/company/college query remains the same. Browser acceptance pending.


**2026-10-15 chat-10 R5 / Round conflict deep links — PARTIAL:** Existing within-drive, known-duration overlap indicators now deep-link each *authorized persisted* conflicting round to the Rounds selector using an encoded roundId. Unknown IDs are filtered rather than projected, and this does not infer interviewer or room conflicts. Pure model regression authored; foreign-company not-found behavior remains with existing job resolver. Browser acceptance pending.


**2026-10-15 chat-10 R5 / Activity query typing repair — PARTIAL:** Read-only HR Activity route now declares `page` in the typed Next searchParams and parses it through the existing strict Zod schema, preserving bounded numeric page validation. Additional unit bounds authored; runtime TypeScript/browser gates still pending. Avoids the reported TS property error while retaining company/college authorization.


**2026-10-15 chat-10 R6 / Drive portfolio CSV — PARTIAL:** Recruiter Drives exports up to 200 company+college-granted published/closed records after existing lifecycle/search/employment/mode/deadline filters and sorting, neutralizes spreadsheet formulas, formats IST deadline, omits learner contact and reports cap. Pure unit authored, execution and browser download pending.


**2026-10-15 chat-10 R6 / Drives deadline-attention cards — PARTIAL:** Company+college-scoped non-archived published drives expose next-seven-day and recorded-past-deadline action links with explicit no-auto-closure caveat. Filters exclude other colleges, archived and closed jobs, and limit surfaced cards; pure unit authored, execution/browser acceptance pending.


**2026-10-15 chat-10 R6 / Calendar next-visible-event correctness — PARTIAL:** Upcoming event highlight now compares real round/deadline starts against recorded results-due timestamps and honors selected calendar category; selected-category empty states use visible count rather than unfiltered totals. Pure model/unit for priority and unsupported SLOT types authored; execution/browser validation pending.
