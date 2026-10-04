# TPO — Detailed Page Parity Spec

Legacy sidebar: Home, Leads, Drives, Students, Requests, Calendar, Reports, Messages, Settings, Audit Log, Notifications. Secondary/mobile `More` also links Profile and the secondary tools.

TPO parity is a product-critical gate. A TPO page is not complete unless its operational actions, confirmations, failure states and role/tenant fences are complete.

# Home

## Page: TPO Home / Command Center
**Legacy:** `/tpo/home`

Audited legacy areas:
- season selector/current vs past season;
- read-only warning for past season;
- setup checklist with collapse/expand and deep links;
- My Work / Placement Team toggle;
- live Drive Day hero when a round is active;
- Needs You queue, grouped repeated task types, first 8 + Show all;
- urgency types including Deadline Today, Applicants to Share, HR Messages, Drive Requests, HR Access, Requests, Slots to Confirm, Results Ready, Selections to Verify, Follow-ups;
- Follow-ups Due with Call, WhatsApp, outcome logging, Done;
- This Week agenda;
- Season headline numbers;
- Branch performance;
- Season pipeline;
- Company funnel;
- Compensation intelligence;
- stale-data alert distinct from hard failure.

Closure checklist:
- [ ] Season selection and past-season read-only state match.
- [ ] Setup checklist item set/completion/deep links match.
- [ ] Setup checklist collapse/expand behavior matches.
- [ ] My Work / Placement Team toggle changes the queue correctly.
- [ ] Drive Day hero appears only from real live operational state.
- [ ] Needs You event taxonomy matches all legacy task types.
- [ ] Grouping repeated task types and group expand/collapse matches.
- [ ] Urgency labels/tones are semantically equivalent.
- [ ] Show all/fewer behavior matches.
- [ ] Follow-ups Due list matches.
- [ ] Call and WhatsApp actions work safely.
- [ ] Follow-up outcome logging and Done action match.
- [ ] This Week agenda matches.
- [ ] Placement rate/registered/offers/live/ready-unplaced/employer-conversation metrics match.
- [ ] Branch performance matches.
- [ ] Season pipeline matches.
- [ ] Company funnel matches.
- [ ] Compensation intelligence matches.
- [ ] Every KPI/queue CTA lands on the intended filtered destination.
- [ ] Initial loading, hard error and stale-last-success states are distinct.
- [ ] Past-season mutations are blocked server-side, not only visually.
- [ ] Mobile order prioritizes Needs You as legacy does.

# Leads / CRM

## Page: Leads
**Legacy:** `/tpo/leads`

### Header / health summaries
- Add Lead;
- Import;
- outreach-health strip: follow-ups due, no next step, gone quiet, unassigned;
- relationship-stage strip;
- stale-load and Companies-load error handling.

- [ ] Add Lead action is present.
- [ ] Import action is present.
- [ ] Outreach-health metrics and drill-in filters match.
- [ ] Relationship-stage metrics and drill-ins match.
- [ ] stale-data vs hard-error handling matches.

### View: Table
Legacy table columns include Contact, Stage, Flags, Owner, Last activity, Next follow-up, Invite, Source, Drives, Students hired and action.

Filters/actions:
- Stage;
- Owner;
- Source;
- Follow-up due;
- Quiet;
- No next step;
- Unassigned;
- saved table search/export/filter infrastructure;
- bulk Assign Owner;
- bulk Mark Contacted;
- bulk Not Now;
- bulk Prepare WhatsApp Invites;
- bulk Invite by Email;
- row Invite/Resend;
- row Create Drive;
- row Mark Contacted;
- row Not Now.

- [ ] All columns/derived values match.
- [ ] Search/filter/export behavior matches.
- [ ] All seven filter controls/toggles match.
- [ ] Bulk Assign Owner uses review/confirmation.
- [ ] Bulk Mark Contacted uses review/confirmation.
- [ ] Bulk Not Now opens reason/revisit flow.
- [ ] Bulk WhatsApp invite preparation matches.
- [ ] Bulk email invite preflight/count/confirmation matches.
- [ ] Joined/unsubscribed leads are correctly skipped/disabled.
- [ ] Row Invite/Resend matches.
- [ ] Row Create Drive pre-fills company.
- [ ] Row Mark Contacted matches.
- [ ] Row Not Now matches.

### View: Board
- columns by CRM stage;
- cards;
- drag/drop or Move To stage;
- recruited terminal handling;
- overflow/collapsed indicator to Table.

- [ ] Stage columns/order match.
- [ ] Move/drag semantics match.
- [ ] Terminal/recruited restrictions match.
- [ ] Empty columns/collapsed-overflow behavior match.

### View: Companies
- Company;
- People;
- Drives;
- Students hired;
- company detail deep link.

- [ ] Company aggregate values match.
- [ ] Company search/export match.
- [ ] Detail deep link works.

### Overlays
- Add Lead modal: Email/Phone, Name, Company;
- duplicate-lead confirmation with Open action;
- Not Now modal: reason + revisit date;
- Invite modal;
- Import Preview modal groups New / Already leads / To fix;
- Prepared Messages modal for WhatsApp.

- [ ] Add Lead modal fields/validation match.
- [ ] duplicate detection/open-existing behavior matches.
- [ ] Not Now modal fields/validation match.
- [ ] Invite modal workflow matches.
- [ ] Import preview/validation/commit matches.
- [ ] Prepared WhatsApp Messages workflow matches.

## Page: Lead Detail
**Legacy:** `/tpo/leads/[leadId]`

Legacy areas/actions:
- header: Invite/Resend, Create Drive, More;
- More: Not Now, Add Follow-up;
- Not Now alert;
- unsubscribed/not-hiring alert;
- Contact card + click-to-call + WhatsApp;
- Company card + company deep link + drive list;
- interaction log: note/call/email/meeting style event types + outcomes;
- Follow-ups list + Add + Done;
- Timeline;
- Invite modal;
- Add Follow-up modal;
- Not Now modal.

- [ ] Header identity/stage/company context matches.
- [ ] Invite/Resend disabled correctly for joined/unsubscribed.
- [ ] Create Drive prefill works.
- [ ] Not Now alert/state matches.
- [ ] Unsubscribed/not-hiring state prevents inappropriate outreach.
- [ ] Contact phone/email/designation fields match.
- [ ] Call/WhatsApp actions match.
- [ ] Company card and drive history match.
- [ ] Interaction-log event types/outcomes match.
- [ ] Note validation matches.
- [ ] Follow-up list matches.
- [ ] Add Follow-up modal date/note behavior matches.
- [ ] Mark Follow-up Done matches.
- [ ] Timeline event coverage/order matches.
- [ ] Not Now modal reason/revisit behavior matches.
- [ ] Loading/not-found/error states match.

## Page: Company Detail
**Legacy:** `/tpo/companies?name=...`

Legacy contract:
- Create Drive;
- Add Contact;
- company metrics: contacts/active, drives, hires, seasons hiring, latest activity;
- People;
- Hiring History;
- Documents/shared applicant lists;
- Drives;
- Timeline.

- [ ] Company lookup is tenant-safe and case/identity stable.
- [ ] Create Drive prefill matches.
- [ ] Add Contact opens Leads add flow with company prefill.
- [ ] Company KPI strip matches.
- [ ] People list/stage/activity/deep links match.
- [ ] Hiring History metrics/table match.
- [ ] Shared Documents history matches.
- [ ] Open Drive from document/history works.
- [ ] Drives table matches.
- [ ] Timeline matches.
- [ ] Loading/not-found/error/empty states match.

# Drives

## Page: Drives List
**Legacy:** `/tpo/drives`

Legacy lifecycle tabs:
- Requests;
- Drafts;
- Live;
- Closed.

Legacy summary:
- live now;
- waiting for review;
- deadlines in next 7 days;
- companies this season.

Legacy table:
- company/role;
- mode;
- CTC;
- type;
- deadline;
- lifecycle status;
- Open;
- row More: Applicants, Rounds and schedule, Offers;
- Create Drive disabled for past season;
- stale-data alert.

- [ ] Lifecycle tabs/counts match.
- [ ] Summary metrics/drill-ins match.
- [ ] Table columns/status labels match.
- [ ] search/filter/export infrastructure matches.
- [ ] row Open matches.
- [ ] row Applicants/Rounds/Offers deep links match.
- [ ] Create Drive matches and is blocked for past season.
- [ ] empty state changes correctly by lifecycle tab.
- [ ] stale-data/hard-error/loading states match.

## Page: New Drive
**Legacy:** `/tpo/drives/new`

- [ ] Company/recruiter source context matches.
- [ ] Role/title/description/location/mode/category fields match.
- [ ] compensation/CTC fields match.
- [ ] application window/deadline fields match.
- [ ] eligibility rule fields match.
- [ ] role options if present match.
- [ ] rounds/template fields present in legacy match.
- [ ] preview/review before create matches.
- [ ] validation/duplicate/conflict states match.
- [ ] successful create navigates to intended workspace.
- [ ] past-season/permission restrictions are enforced.

## Page: Edit Drive
**Legacy:** `/tpo/drives/[jobId]/edit`

- [ ] Editable fields match lifecycle restrictions.
- [ ] fields locked after publish match.
- [ ] validation and unsaved-change behavior match.
- [ ] Save result refreshes drive workspace safely.
- [ ] permission/past-season/read-only behavior match.

## Page: Drive Detail
**Legacy:** `/tpo/drives/[jobId]`

### Header / mission control
Legacy:
- job title/company/status;
- needs-attention cards;
- KPIs reachable/applied/rounds/offers;
- lifecycle stepper Request→Published→Applications→Rounds→Offers→Closed;
- partial section-load warning;
- overflow actions Edit, Export Applicants, Share with Company, Cancel where allowed.

- [ ] Header/status/lifecycle context matches.
- [ ] Needs-attention taxonomy matches.
- [ ] KPI calculations and click-through filters match.
- [ ] Lifecycle stepper matches.
- [ ] independent section failures do not zero healthy sections.
- [ ] Edit action rules match.
- [ ] Export Applicants matches.
- [ ] Share with Company flow matches.
- [ ] Cancel availability rules match.

### Tab: Overview
- [ ] overview sections/summary match.
- [ ] request state and recruiter request details match.
- [ ] publish readiness/preflight signals match.
- [ ] not-applied/reachability/attention sections match.
- [ ] activity/history matches.
- [ ] navigation into filtered Applicants/other tabs matches.

### Tab: Applicants
- [ ] applicant table/search/filter/stage views match.
- [ ] candidate detail drawer matches.
- [ ] bulk actions match.
- [ ] external-registration/company-id state matches.
- [ ] share-applicant workflow is available.
- [ ] export behavior matches.
- [ ] empty/error states match.

### Tab: Rounds
- [ ] round list/order/status matches.
- [ ] add/edit/schedule round actions match.
- [ ] round kind/date/time/mode/location fields match.
- [ ] auto-apply/results state matches.
- [ ] conflict/blocker states match.
- [ ] result progression into next stages matches.

### Tab: Offers
- [ ] offer/selection list matches.
- [ ] candidate offer state matches.
- [ ] verify/selection actions match.
- [ ] release/response/joining data matches.
- [ ] candidate detail deep link/drawer matches.

### Tab: Drive Day
- [ ] active/completed round selector matches.
- [ ] Drive Day operations reachable from job.
- [ ] coordinator permissions match.
- [ ] attendance/results operational actions match.
- [ ] empty/no-round states match.

### Request/lifecycle overlays
Legacy includes:
- Reject request modal;
- Send Back request modal;
- Publish preview modal;
- Extend application deadline modal;
- Cancel Drive modal with reason;
- close/complete consequences where applicable;
- recruiter Messages drawer.

- [ ] Reject request modal/reason/consequence matches.
- [ ] Send Back modal/reason matches.
- [ ] Publish Preview modal checks and consequences match.
- [ ] Extend Deadline modal validation matches.
- [ ] Cancel Drive modal reason validation and downstream consequence preview match.
- [ ] Close/complete flow is accounted for.
- [ ] Messages drawer matches recruiter conversation workflow.

## Page: Global Drive Day
**Legacy:** `/tpo/drive-day`

- [ ] today's/current rounds list matches.
- [ ] company/job/round/context matches.
- [ ] coordinator-scoped access matches.
- [ ] status/attendance/result readiness cues match.
- [ ] round click opens focused Drive Day.

## Page: Round Drive Day
**Legacy:** `/tpo/drive-day/[roundId]`

- [ ] round roster matches.
- [ ] attendance/check-in actions match.
- [ ] result/outcome capture matches.
- [ ] bulk result/attendance actions match.
- [ ] progress/summary counts match.
- [ ] coordinator vs TPO permission differences match.
- [ ] completion confirmation matches.
- [ ] loading/not-found/error states match.

# Students

## Page: Students
**Legacy:** `/tpo/students`

### Intelligence summary
Legacy metrics:
- ready but not applying;
- needs readiness support;
- not registered;
- already applying;
- placed / placement pool;
- branch placement grid.

- [ ] All summary counts use correct season/registration denominator.
- [ ] metric click filters roster correctly.
- [ ] branch performance grid matches.

### Tab: Students roster
Legacy filters:
- view segmented filters;
- branch;
- company;
- minimum journey depth;
- outcome;
- shortcut filters "Rejected at interview or later" and "Reached final round".

Legacy columns:
- student identity;
- batch/branch;
- CGPA/backlogs;
- readiness;
- registration;
- best so far;
- applications;
- offers;
- placement status.

- [ ] View filters/counts match.
- [ ] Branch filter matches.
- [ ] Journey/company/depth/outcome filters match.
- [ ] shortcut filters match.
- [ ] table columns/derived journey values match.
- [ ] search/export/saved table behavior matches.

### Bulk actions
- Add to Drive;
- Nudge;
- Assign Prep;
- Mark Higher Studies;
- Debar.

- [ ] Add to Drive modal matches.
- [ ] Nudge text + confirmation matches.
- [ ] Prepared WhatsApp messages workflow matches.
- [ ] Assign Prep modal/course selection matches.
- [ ] Higher Studies confirmation/consequence matches.
- [ ] Debar modal/reason/consequence matches.

### Academic import
- Import Academic Details;
- preview groups matched/unmatched;
- commit/update.

- [ ] import parser/columns match.
- [ ] preview counts/groups match.
- [ ] unmatched rows are actionable/explainable.
- [ ] commit is tenant/season safe.

### Tab: Requests
- [ ] Student Requests tab matches global request panel.
- [ ] counts/status/actions match.

## Page: Requests
**Legacy:** `/tpo/requests`

- [ ] all student exception/change request types are included.
- [ ] status/age/student/job filters match.
- [ ] request detail/context matches.
- [ ] approve/reject/send-back decisions match.
- [ ] reason/comment requirements match.
- [ ] decision consequences update authoritative learner/job state.
- [ ] empty/loading/error states match.

# Calendar

## Page: TPO Calendar
**Legacy:** `/tpo/calendar`

Legacy modes:
- Week;
- Month;
- Agenda.

Legacy event types include rounds, talks, deadlines and recruiter follow-ups.

- [ ] Week mode matches.
- [ ] Month mode matches.
- [ ] Agenda mode matches.
- [ ] date range/navigation matches.
- [ ] company filter matches.
- [ ] event-type filters match.
- [ ] summary metrics for rounds/deadlines/follow-ups/next match.
- [ ] event popover/detail matches.
- [ ] event deep links to drive/lead match.
- [ ] create Follow-up modal matches.
- [ ] move Follow-up modal matches.
- [ ] empty/loading/partial-failure states match.
- [ ] timezone handling is verified.

# Reports

## Page: Reports Gallery
**Legacy:** `/tpo/reports`

Groups:
- Overview and performance;
- Student outcomes;
- Relationships and compliance.

Headline metrics:
- placement rate;
- students placed;
- offers;
- students accepted.

- [ ] Group headings/descriptions match.
- [ ] headline metrics match.
- [ ] report cards and help text match.
- [ ] management-view CTA opens Placement Summary.

## Report: Placement Summary
- [ ] table/data columns match.
- [ ] unique placed vs total offers semantics match.
- [ ] summary KPIs match.
- [ ] filters match.
- [ ] export matches.
- [ ] presentation mode matches.

## Report: By Branch
- [ ] branch metrics/table/chart match.
- [ ] drill-in/filter behavior matches.
- [ ] export matches.

## Report: By Company
- [ ] company hires/average/highest package metrics match.
- [ ] drill-in/filter behavior matches.
- [ ] export matches.

## Report: CTC
- [ ] highest/average/median semantics match best-offer logic.
- [ ] internship exclusion matches.
- [ ] chart/table/export match.

## Report: Unplaced Students
- [ ] placement-pool definition matches.
- [ ] filters/table/export match.
- [ ] drill-in to student context matches.

## Report: Offers and Acceptance
- [ ] released/accepted/declined/expired metrics by company match.
- [ ] filters/table/export match.

## Report: Joining Status
- [ ] joined/deferred/did-not-join among accepted offers matches.
- [ ] filters/table/export match.

## Report: Failure Reasons
- [ ] rejection/no-show reason taxonomy matches.
- [ ] round/company/branch filters match.
- [ ] table/chart/export match.

## Report: Leads
- [ ] invited/joined/hired recruiter funnel matches CRM data.
- [ ] filters/table/export match.

## Report: Accreditation Export
- [ ] NAAC/NIRF column set matches.
- [ ] completeness preflight matches.
- [ ] blocking/warning missing-data list matches.
- [ ] CSV export matches.

## Shared report-detail behavior
Legacy report detail has Saved Filters, Mode, Type, dynamic table columns, chart, presentation view, export and report totals.

- [ ] saved filter behavior is implemented or explicitly redesigned.
- [ ] Mode filter matches.
- [ ] Category/Type filter matches.
- [ ] dynamic table and null rendering match.
- [ ] chart generation matches supported reports.
- [ ] presentation view matches.
- [ ] exports are audit-safe.
- [ ] loading/error/empty states match.

# Messages

## Page: Messages
**Legacy:** `/tpo/messages`

- [ ] conversation list matches.
- [ ] recruiter/company/drive context is visible.
- [ ] unread/last-message ordering matches.
- [ ] open thread behavior matches.
- [ ] send message/reply behavior matches.
- [ ] drive-context deep links match.
- [ ] failed-send/retry state matches.
- [ ] empty/loading/error states match.
- [ ] tenant boundaries are enforced.

# Settings

## Page: Settings shell
**Legacy:** `/tpo/settings`

Groups:
- Season and policy;
- People;
- Communication;
- Sharing and identity.

Legacy behavior includes unsaved-change warning when moving between sections or unloading.

- [ ] section navigation/grouping matches.
- [ ] active section URL/query state matches.
- [ ] unsaved-change indicator matches.
- [ ] leave-without-saving confirmation matches.
- [ ] browser unload protection matches where appropriate.

## Settings: Placement Season
- [ ] list multiple seasons.
- [ ] current/registration-open status.
- [ ] Edit Season modal.
- [ ] name/date range/registration deadline.
- [ ] blocked academic dates list.
- [ ] Start New Season modal.
- [ ] warning for earlier-season open drives.
- [ ] Open Registration confirmation and consequence.

## Settings: Placement Rules
- [ ] placed-count trigger setting matches.
- [ ] offer limits/uplift/response rules present in legacy match.
- [ ] validation and save behavior match.
- [ ] dirty-state protection matches.

## Settings: Placement Team
- [ ] placement-team member list matches.
- [ ] Add to Team modal with faculty search.
- [ ] TPO Admin / Faculty Coordinator role selection.
- [ ] removal impact lookup.
- [ ] reassign-and-remove modal.
- [ ] student coordinators list.
- [ ] Assign Student Coordinator modal with student + drive.
- [ ] remove coordinator confirmation.

## Settings: Recruiters
- [ ] recruiters with college access list matches.
- [ ] Active/Removed state matches.
- [ ] revoke access confirmation and immediate effect match.

## Settings: Trusted Companies
- [ ] trusted domains list matches.
- [ ] add/normalize domain behavior matches.
- [ ] remove trust confirmation matches.
- [ ] trust effect on request approval matches.

## Settings: Templates
- [ ] reusable communication templates match.
- [ ] save/edit fields and validation match.
- [ ] mail-provider/status dependencies match.

## Settings: Student Notices
- [ ] optional notices controls match.
- [ ] Prep & Readiness configuration matches.
- [ ] prep course multi-select matches.
- [ ] email-template readiness/status display matches.

## Settings: My Notifications
- [ ] personal notification preference options match.
- [ ] preferences are user-specific, not college-wide.
- [ ] save/error state matches.

## Settings: What Companies See
- [ ] field/data-sharing switches match.
- [ ] internal placement signals remain private where legacy does.
- [ ] changes affect recruiter/company preview consistently.

## Settings: Branding
- [ ] recruiter invite/share/email branding fields match.
- [ ] preview behavior matches if present.
- [ ] storage-backed assets remain explicit BLOCKED until live.

# Audit / Notifications / Profile / More

## Page: TPO Audit Log
**Legacy:** `/tpo/audit`

Legacy summary includes:
- recent events;
- people and systems;
- shares/downloads;
- settings changes;
- latest activity.

- [ ] summary metrics match.
- [ ] event/entity/actor/date filters match.
- [ ] share/download events match.
- [ ] settings-change events match.
- [ ] detail text/context matches.
- [ ] search/pagination/export if present are accounted for.
- [ ] empty/loading/error/stale states match.

## Page: TPO Notifications
**Legacy:** `/tpo/notifications`

Legacy:
- All / Unread segmented filter;
- Mark all as read;
- opening marks notification read;
- groups Today / Yesterday / This week / Earlier;
- linked notifications;
- stale refresh alert.

- [ ] All/Unread counts/filter match.
- [ ] Mark all as read matches.
- [ ] opening individual notification marks read.
- [ ] time grouping matches.
- [ ] notification event coverage matches placement domain.
- [ ] deep links match.
- [ ] loading/empty/error/stale states match.

## Page: TPO Profile
Shared Faculty profile schema.

- [ ] User summary/profile image/completeness matches.
- [ ] Resume matches.
- [ ] Contacts/social/address/personal/identity matches.
- [ ] Aadhaar/PAN storage flow accounted for.
- [ ] Experience/education/skills/certifications/languages match.
- [ ] Publications/awards/metadata match.
- [ ] Add/edit/delete dialogs/states match.
- [ ] partial-section failure tolerance matches.
- [ ] loading/retry behavior matches.

## Page: More
**Legacy:** `/tpo/more`

Groups:
- Work: Requests, Calendar, Messages;
- Insights: Reports;
- Account: Notifications, Settings, Audit Log, Profile.

- [ ] All legacy destinations appear.
- [ ] labels/descriptions match intent.
- [ ] keyboard activation works.
- [ ] mobile navigation uses this page where legacy does.
- [ ] no secondary tool becomes unreachable on small screens.
