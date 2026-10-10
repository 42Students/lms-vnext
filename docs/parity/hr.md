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
