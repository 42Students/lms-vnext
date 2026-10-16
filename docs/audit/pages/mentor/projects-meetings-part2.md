# Mentor / Projects and Meetings, part 2 (legacy: project detail tabs Resources, Activity, Final submission; /mentor/calendar; /mentor/notifications; redirect-only routes; vNext: same routes)
Audited: 2026-10-16 by audit agent (Sonnet 5.5)   Reviewed: not yet (Round R pending)

Continues `projects-meetings.md` (part 1: landing, list, shell, Overview, People & Meetings, Releases and Sprints, Board, Task Allocation). Abbreviations are defined in part 1 section 0 (PDC, TDM, PC, IMPL, PW, MD, SCH). Extra abbreviations: CAL = FE `src/pages/mentor/calendar.js` (306, dev tip in `42lms\_hr-tpo-fe`), NOT = FE `src/pages/mentor/notifications.js` (403), RES = vNext `project-resource-controls.tsx`, RFP = `project-resource-files-panel.tsx`.

Note on legacy versions: the stale worktree copies of calendar.js and notifications.js (293 and 365 lines) differ from the dev tip; the dev tip decides MISSED/past by the meeting end instant (CAL:45-61) and adds partial-source warnings (NOT:372-381). Both were read at the dev tip.

---

## 9. Resources tab

### 1. Legacy behaviour (`case "resources"`, PDC:8724-9162; row PDC:531-746; handlers PDC:3296-3559)
- Hero: mentor button "Add resource" (learner "Share a resource"), "Last updated {time}", stat tiles Total/Showing "of N", Files, Links, Other (PDC:8736-8780). Filters: Search "Search title, description, file name, or link", Type (distinct canonical types), Status (Active default, Draft, Archived, All), Sprint, Task, "Clear filters" (PDC:8781-8850).
- Editor (mentor): Title (required "Resource title is required"), Description, Type (File, Link, Document, Code, Note, Environment; required), Status (Active/Draft/Archived), Related sprint, Related task, "Visible to" (Everyone on the project / Mentors only), Pinned, Required, Access notes, Resource URL (required "Add a link or upload a file before saving"; scheme rule "Resource URL must start with http:// or https://", "Enter a valid resource URL."), "Or upload a file" (.pdf .doc .docx .txt .ppt .pptx .zip .png .jpg .jpeg, 50 MB, "File size exceeds 50MB limit.", "Resource file uploaded.", "Attached {file}"), submit "Add resource"/"Update resource", Cancel (PDC:8852-8994).
- Row: type icon, title, tags (type, status Active/Draft/Archived, "Mentors only", "Pinned", "Required"), description, access notes, file name, "Sprint: …", "Task: …", "{uploader} · {d MMM yyyy, h:mm A}"; actions "Open file"/"Open link" (guards: "This resource has no link or file attached yet.", "This resource's link is not a valid web address, so it can't be opened.", "Your browser blocked the new tab. Allow pop-ups for this site to open resources."), Edit, Delete (Popconfirm `Delete "{title}"?` / "This permanently removes the resource for everyone on the project. It cannot be undone."). Mentors-only resources are hidden from learners; archived rows muted; mentor drag handle to reorder (toast "Resource order updated.") while no filter is active. Toasts "Resource added.", "Resource updated.", "Resource removed."
- Empty: "No resources yet. Add the briefs, templates and reference links your team will need."; filtered: "None of the n resources on this project match your current filters."
- Backend: full-array sync with `resourcesToken`; archived projects reject; learner-created resources editable by their creator (learner audit LEARNER-projects-33).

### 2. vNext behaviour (`PW:912-1008`, `RES`, `RFP`)
- Heading "Resources", mentor/admin button "Add resource" (dialog "Add Project resource" / "Share a safe HTTP(S) link or an internal text resource with the Project team.": Title, URL (optional if description given), Description, "Required resource"; error "Add a description or an HTTP(S) resource URL."; toast "Project resource added"). Each row: title, description, "Required" badge, text-only notices for required resources without a link, "Open resource ↗", mentor Edit and Archive (confirm "Archive {title}? / The resource leaves active Project surfaces while historical Project data remains intact."; toasts "Project resource updated", "Project resource archived").
- `ProjectResourceFilesSection` (`project-resource-files-section.tsx`): a second list "Attached" for uploaded files (Title, Description, "Or upload a file", signed upload, progress, statuses, "Open file", Retry, "Edit resource", "Delete"); mentors/admins on non-archived, non-completed projects; learners see READY files only; downloads via short-lived signed URL.
- `project_resources` (`SCH:489-556`) has title, description, url, required, sequence, status, visibility (TEAM / MENTOR_ONLY, API `validation.ts:663,689`, service `resource-service.ts:75,127,208`) but no type, pinned, access notes, sprint or task link.

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-53 | Resource form lacks Type, Status (Active/Draft/Archived), Related sprint, Related task, Pinned and Access notes (no columns for type, pinned, access notes, sprint/task links). | MISSING-FIELD | S3 | PDC:8868-8940 | `RES:45-95`; `SCH:489-556` |
| MEN-projects-meetings-54 | "Visible to: Everyone / Mentors only" is supported by the API and read policy but not exposed in the create/edit form, and the list shows no "Mentors only" tag, so a mentor cannot author or recognise a mentor-only resource from the UI. | MISSING-FIELD | S3 | PDC:8910-8921,714 | `validation.ts:663,689`; `resource-service.ts:127,208`; `RES:100-150` (no visibility field) |
| MEN-projects-meetings-55 | No search, Type/Status/Sprint/Task filters, "Clear filters", stat tiles (Total/Showing, Files, Links, Other) or "Last updated". | MISSING-FILTER | S3 | PDC:8736-8850 | `PW:927-1001` |
| MEN-projects-meetings-56 | No drag reorder of resources (priority order); `sequence` column exists but is not editable. | MISSING-ACTION | S4 | PDC:3525-3559,9121-9123 | `PW:935-999`; `SCH:489-556` |
| MEN-projects-meetings-57 | Row content and labels differ: "Open file"/"Open link" vs "Open resource ↗"; no uploader and updated-time line, no type/status/Pinned/Draft tags; the open-guard messages (no link, invalid address, pop-up blocked) absent; heading wording ("Add Project resource", "Required resource", "Project resource added") vs "Add resource" / "Resource added.". | COPY | S3 | PDC:575-617,631-743,3418 | `PW:935-1000`; `RES:177-221` |
| MEN-projects-meetings-58 | Two separate lists (links in "Resources", uploads under "Attached") instead of one resource row with a file; delete is "Archive" for links (history kept) and hard delete for files. Delete confirm wording differs ("This permanently removes the resource for everyone on the project."). | COPY | S4 | PDC:643-655,3505-3523 | `PW:1002-1007`; `RFP:153-232`; `RES:403-417` |

---

## 10. Activity tab

### 1. Legacy behaviour (`case "activity"`, PDC:9164-9389; filters PDC:1437-1537)
- Toolbar: "Type" select (placeholder "All activity"; Sprint changes, Task changes, Team & meetings, Resources shared, Submission updates, Project details), "Date range" picker (future dates disabled), "Times shown in {tz}".
- Feed (`role="feed"`): each card has a category icon, actor name, event label (humanised, "Project" prefix stripped, e.g. `PROJECT_TASK_UPDATED` -> "Task Updated"), category label (Overview, Meeting, Resource, Sprint, Submission, Team, Task, Update), relative time ("5m ago", "3d ago") with exact time as tooltip, title and summary; 20 per page, "Load more activity" appends and de-duplicates; sorted newest first.
- States: skeleton rows; error "We couldn't load this project's activity. The history is still there — this is a connection problem, not an empty log." + "Try again"; filtered empties "No activity matches this source and date range." / "No activity in this date range." / "No activity recorded from this source yet." + "Clear filters"; empty "No project activity yet. Task moves, sprint updates and resource changes will appear here."
- API `GET /projects/{id}/activity/feed?page&size&sourceTab&fromDate&toDate`.

### 2. vNext behaviour
- Workspace `audit` section (`PW:1139-1186`): heading "Activity" / "Persisted Project events visible inside this workspace."; up to 100 events (`activity-service.ts` `.limit(101)`, `slice(0,100)`), each card with summary, "{actor or System} · {en-IN date time}", and a badge `event.eventType.split(".").slice(1).join(" ")` (raw taxonomy text). Empty: "No persisted Project activity yet." No filters, pagination or load-more on the tab.
- The separate page `mentor/projects/[id]/activity-history` ("Recorded project activity") adds importance, event-type, time-window and order filters with pagination, and the project-scoped CSV `api/projects/[id]/mentor-activity-export`; a link to it sits in the ten-button row on every tab (part 1 gap 14).

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-59 | The Activity tab has no Type or Date range filters and no "Times shown in …" note; those exist only on the separate "Recorded project activity" page. | MISSING-FILTER | S3 | PDC:9177-9234 | `PW:1139-1186`; `activity-history/page.tsx:33-60` |
| MEN-projects-meetings-60 | Tab stops at 100 events with no "Load more activity" and no indication that more exist. | STATE | S3 | PDC:9376-9386,1466-1486 | `activity-service.ts` (`limit(101)`, `slice(0, 100)`); `PW:1155-1181` |
| MEN-projects-meetings-61 | Copy and labels: heading/description "Persisted Project events visible inside this workspace." is internal wording; the badge shows raw taxonomy text (e.g. "task created") instead of the humanised event + category chips (Overview/Meeting/Resource/Sprint/Submission/Team/Task); empty/error/filtered-empty messages differ; no error state with "Try again". | COPY | S3 | PDC:3946-4005,9262-9312 | `PW:1143-1181` |
| MEN-projects-meetings-62 | Relative time ("5m ago", exact time on hover) and timezone note replaced by absolute en-IN date-time. | MISSING-FIELD | S4 | PDC:3863-3883,9354-9362 | `PW:1166-1171` |

---

## 11. Final submission (review of the team's delivery)

### 1. Legacy behaviour
- Entry: "Review submission" button on Overview card and Board hero (enabled when ready or a submission exists, PDC:6543-6550), or `?tab=delivery` (opens the modal once, PDC:838-871); project list "Needs review" card links straight to it.
- Modal "Review submission" (PDC:9735-10253): hero (project title, "Review the learner submission, update the outcome, and capture feedback in one place.", status tag Ready for review / Submitted / Waiting for completion), stale-snapshot warning "This submission may have changed since you opened this review / Refresh the page to load the latest version before accepting, requesting changes, or locking." (PDC:9772-9780), metrics Sprints / Tasks / Submission.
- Panel "Learner submission": Submitted by, Submitted at, Attachment ("Open attachment" with scheme guard), Review status, Submission type (file/link/both), note "A draft attachment has been saved, but the learner hasn't formally submitted it yet.", "Additional files & links" with "Added by {name}", Summary ("No summary submitted yet."), "Learner notes" ("No student notes provided."), "Review notes".
- Panel "Review outcome": "Review feedback" textarea ("Feedback for the learner") and actions: "Reopen for revision" (Popconfirm "Reopen this submission for revision? / The learner will be able to edit and resubmit it.") when Accepted/Locked, else "Request changes" (confirm "The learner will see your feedback…", enabled only when status Submitted), "Accept submission" (confirm "Accept this submission? / The learner will be notified their submission was accepted."), and "Lock submission" (confirm "Lock this submission? / The learner will no longer be able to edit or resubmit it.") when Submitted/Accepted. Toasts: "Draft saved.", "Submission accepted.", "Changes requested.", "Submission locked.", "Submission reopened for revision."
- Panel "Submission history": every save, submit and review action with actor, text ("requested changes", "accepted the submission", …), feedback and time.
- Backend: `updateProjectDelivery`/`applyProjectDeliveryPayload` (IMPL:2800-2880) requires version (428/409), archived rejection, notifications through `notifyDeliveryUpdate` (IMPL:4272-4322): learners get "Delivery accepted" / "Changes requested" / "Delivery locked" / "Delivery reopened for revision" with feedback; mentors get "Ready for review" when learners submit; audit + activity event. Readiness gate blocks learner submit until tasks and sprints are complete (IMPL:2838-2848).
- No evaluation rubric and no closeout in legacy; admin override path exists (`adminReviewProjectDelivery`, IMPL:2778).

### 2. vNext behaviour
- `PW:756-910` (section `delivery`, only via `?tab=delivery`): heading "Final submission"; note "Latest recorded delivery: version n · STATUS. Historic versions remain available below."; one article per version ("Version n", summary, status badge, "Open source ↗", "Open demo ↗", `Review · APPROVED` with feedback). Mentor controls: `FinalReviewControl` on SUBMITTED versions (dialog "Review final delivery" / "This decision is preserved as immutable Project review history.", Decision Approve / Request changes, Feedback required for changes, toasts "Final delivery approved", "Changes requested"; route `mentor-decision` with `expectedUpdatedAt` + `confirmed`); `ProjectEvaluationControl` on APPROVED versions without an evaluation (dialog "Evaluate approved project" / "Score explicit criteria. The total is derived from these rubric rows.", criterion, score, max score, feedback, "Add criterion", "Remove criterion"; toast "Project evaluation recorded"); `ProjectDeliveryReopenControl` (APPROVED, ACTIVE project, no evaluation: dialog "Reopen this submission for revision? / The learner will be able to edit and resubmit it." with required "Review feedback").
- Submission rows (`SCH:736-832`) carry summary, sourceUrl, demoUrl, notes, attachments (jsonb), submittedAt/By, lockedAt, reopenedAt, version; the workspace shows only summary and the two links. Separate pages: `deliveries/[submissionId]/review` (decision, dates, feedback; deliberately omits learner contact, private notes, source URLs, reviewer identity), `review-overview`, `review-completeness`, `/mentor/reviews`, `/mentor/review-history`, `closeout`.
- Completion: `closeout` page lists the persisted checklist (latest delivery approved, tasks Done, sprints Completed, releases Shipped) and `MentorProjectCloseoutControl` (three confirmations, window.confirm, `POST /api/projects/{id}/complete`).

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-63 | No "Lock submission" action (and no Accepted/Locked distinction): after approval the learner cannot be explicitly locked out; vNext offers only reopen-until-evaluated. | MISSING-ACTION | S3 | PDC:10197-10209,4096-4106; IMPL:2800 (LOCK) | `PW:856-893`; `SCH:736-832` (`lockedAt` column unused by any control) |
| MEN-projects-meetings-64 | Review context incomplete: the version card omits who submitted and when, learner notes, additional files and links (attachments jsonb), submission type, and the per-event submission history (save/submit/review/lock/reopen with feedback). The mentor must decide without seeing the attachments or notes. | MISSING-MODAL | S2 | PDC:9803-9909,10214-10250 | `PW:795-854`; `SCH:736-832`; `deliveries/[submissionId]/review/page.tsx:42-46` (excludes notes and URLs by design) |
| MEN-projects-meetings-65 | Review controls and copy differ: single dialog titled "Review final delivery" with Decision select vs buttons "Accept submission", "Request changes", "Reopen for revision" each with its own confirm text; labels "Approve delivery" and toasts "Final delivery approved" vs "Submission accepted."; the stale-snapshot warning is replaced by a 409 on save. | COPY | S3 | PDC:10142-10209,4096-4106,9772-9780 | `project-final-delivery-controls.tsx:314-481` |
| MEN-projects-meetings-66 | No notifications to the learners on approve / changes requested / reopen (legacy "Delivery accepted", "Changes requested", "Delivery reopened for revision" with feedback) and none to the mentor when a learner submits; vNext relies on live attention cards and activity events. | SIDE-EFFECT | S2 | IMPL:4272-4322 | `mentor-final-delivery-decision-service.ts:50-60` (activity only); no `deliverInAppNotification` in `src/modules/projects` |

---

## 12. Closeout, archive and restore

### 1. Legacy behaviour
- Mentors have no archive, restore, complete or closeout control: status changes are admin-only ("Mentors un-archive from the admin workspace pages", PDC:854-855). Backend `archiveProject`/`restoreProject` (IMPL:3480-3630) are admin paths; archived projects reject mentor writes (`requireProjectNotArchived`, IMPL:5462) with message "This project is archived and read-only", and notifications "Project archived/restored" go to learners (IMPL:3505,3628).
- Project "Completed/Done" is a free-text status edited by admins; the mentor list tags are "Archived"/"Blocked"/status text.

### 2. vNext behaviour
- Mentor: `closeout` page (checklist + completion), read-only archived workspace with "Read-only" list badge (`MP:296`), archived notice (`PW:292-304`), mutation controls hidden when `readOnly`. Archive and Restore are College Admin / Super Admin only (`ProjectArchiveControl` rendered when `mode === "ADMIN"`, `PW:280-287`; restore route `api/projects/[projectId]/restore`).
- No gap against legacy for mentors; these are improvements (section 14).

### 3. Gaps
None for the Mentor account (archive/restore/closeout/evaluation are intentional differences, section 14). The only related difference is archived banner copy, MEN-projects-meetings-15 (part 1).

---

## 13. Meetings page (/mentor/calendar)

### 1. Legacy behaviour (CAL, dev tip)
- Entry: sidebar "Meetings" (path `calendar`, `mentorNavigationMenu` lists.js:305-335). `CourseSectionHeader` title "Meetings", subtitle "Every scheduled meeting across your assigned projects, in one place." (CAL:237-238). API `GET /projects/me` (all projects with `meetingsList`).
- Sections: "Upcoming (n)" (calendar icon) and "Past & Cancelled (n)". Upcoming = status not CANCELLED and (REQUESTED or end instant after now; the dev tip uses end time so an in-progress meeting stays upcoming), sorted ascending; Past = CANCELLED, or not REQUESTED and not future, sorted descending; first 20 past rows with "Show all n past meetings"/"Show fewer" (keyboard accessible link); list recomputed every 60 s.
- Row: title, project title, status tag (MISSED red when the end instant has passed for SCHEDULED/RESCHEDULED, CANCELLED grey, REQUESTED gold, COMPLETED green, else blue), "ddd, MMM D YYYY" ("Date TBD"), "hh:mm A – hh:mm A (GMT+hh:mm)" in the viewer's browser timezone, "Sprint: {label}", "Join link" (http/https only, hidden when CANCELLED), "Open project" (`?tab=team`).
- States: three skeleton rows; error `Alert` with message "We couldn't load your meetings." and Retry; empties "No upcoming meetings." / "No past meetings yet." No filters, no export.

### 2. vNext behaviour
- `mentor/calendar/page.tsx`: eyebrow "Mentor", title "Meetings", description "Registered meetings across your current assigned Projects. Times shown in IST."; GET filter form (search, Action needed, Assigned project, Sprint association, Join link, Status, Meeting type, Assigned project state, IST dates) and CSV export "Export filtered meeting metadata CSV (max 200)"; counts line; `MentorMeetingsCalendar` with "Upcoming (n)" and "Past & Cancelled (n)", same 20-row preview, `splitMentorMeetings` by end instant (`mentor-calendar-view.ts:28-50`), minute clock refresh, IST date/time (`timeZoneName: "short"`).
- Row: title, project title, `StatusBadge` (COMPLETED, MISSED, CANCELLED, REQUESTED, else info), date, time range, "Sprint: …", "Awaiting your response in the project workspace." for REQUESTED, "Archived project · Read-only", "Join meeting", "Open project" (`?tab=team`). Route `error.tsx`/`loading.tsx` exist.
- MISSED rule: SCHEDULED meeting whose IST start date is before today's IST date (`mentor-calendar-view.ts:56-79`).

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-67 | Page copy: subtitle differs ("Every scheduled meeting across your assigned projects, in one place." vs "Registered meetings across your current assigned Projects. Times shown in IST.") and the invented eyebrow "Mentor"; also "Join link" vs "Join meeting" and the extra "Awaiting your response…" line. Exact-wording rule. | COPY | S3 | CAL:238,123 | `calendar/page.tsx:34-35`; `mentor-meetings-calendar.tsx:46-54` |
| MEN-projects-meetings-68 | MISSED badge rule differs: legacy dev marks SCHEDULED meetings MISSED as soon as the end instant has passed (audit M-41/M-42); vNext only after the IST day changes, so a meeting that ended this morning sits under "Past" still badged as scheduled. | STATE | S3 | CAL:45-61 | `mentor-calendar-view.ts:56-79` (comment still cites the old start-date rule) |
| MEN-projects-meetings-69 | Load error has no inline Retry with a "We couldn't load your meetings." message (route-level `error.tsx` instead); status has no RESCHEDULED / DRAFT values to display (no such vNext statuses). | STATE | S4 | CAL:222-232 | `calendar/error.tsx` |

---

## 14. Notifications (/mentor/notifications)

### 1. Legacy behaviour (NOT, dev tip)
- Entry: sidebar "Notifications" (`mentorNavigationMenu`). Title "Notifications", subtitle "Announcements, submissions waiting for review, stalled projects, and meetings coming up soon." (NOT:352-353).
- Sources loaded together: college announcements (`fetchAllTypesAnnouncement`, all pages of 100), personal notifications (`getNotificationsForRecipient`, all pages), and the project list (`getProjects`). Derived items per non-archived project: "Needs review" (title "{project} — submission waiting for your review", description "Submitted by {name}" or "A team member submitted work for this project.", link `?tab=overview`; excludes reopened deliveries, `deliveryNeedsMentorReview`), "Stalled" ("{project} — no activity in 7+ days", "This project hasn't had any recorded activity recently."; not for archived/completed/blocked; link `?tab=activity`), "Meeting requested" ("{meeting} — {project}", "A team member requested this meeting — review and confirm the time.", `?tab=team`, sorted with reviews), "Upcoming meeting" (within 48 h; "ddd, MMM D at {start}"). Announcement/personal rows have tag = type with underscores replaced and sentence case, fall back "A new notification was sent to you."
- Order: sortKey (announcements -1, reviews/requests 0, stalled 1, meetings 2), then timestamp descending. Row is a card link with icon (blue/gold/red) and tag.
- States: skeleton rows; error `Alert` "We couldn't load your notifications." + Retry; warning "Some notification sources are unavailable / Could not load: … Everything else below is current, but this page may be incomplete." + "Retry sources" (NOT:372-381); empty "Nothing needs your attention right now." (or "No project alerts are visible, but some notification sources could not be checked."); with Projects off the project call is skipped (NOT:238-262).
- Backend side effects that feed this page: `notifyDeliveryUpdate` ("Ready for review" to mentors on learner submit, IMPL:4316-4321), meeting request (IMPL:3103-3106), assignment, comment, archive/restore notifications. There is no read/unread or mark-all in legacy.

### 2. vNext behaviour
- Header eyebrow "Mentor", title "Notifications", description "Personal notices, college announcements and registered project attention."; `AnnouncementFeed`; "Project attention (n of m)" with filters (project, order, type) and cards (kinds: REVIEW "Delivery awaiting your review", STALLED "Project may be stalled", REQUESTED "Meeting request pending", MEETING_SOON "Upcoming project meeting", `mentor-attention.ts:44-84`); "Personal notifications" with unread/all view, mark-all-read (confirm), mark-one-read, 50-per-page cursor pagination, empty "No personal notifications yet."/"No unread notifications."; invalid-cursor recovery; works with Projects off (attention replaced by a status line).
- Attention rules: REVIEW for latest pending SUBMITTED version, STALLED only when status ACTIVE and no activity for 7 days (falls back to `updatedAt`), REQUESTED for any REQUESTED meeting, MEETING_SOON for SCHEDULED within 48 h of now; archived projects skipped; links `?tab=delivery` and `?tab=team`.

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-70 | Copy differs: subtitle, invented eyebrow, section headings, empty text ("Nothing needs your attention right now." has no equivalent), tags "Needs review" / "Stalled" / "Meeting requested" / "Upcoming meeting" and item titles/descriptions ("{project} — submission waiting for your review", "Submitted by {name}") vs "Delivery awaiting your review", "Project may be stalled", "Meeting request pending". | COPY | S3 | NOT:289-340,352-353,388 | `notifications/page.tsx:77-78,116-157`; `mentor-attention.ts:44-84` |
| MEN-projects-meetings-71 | No warning when one source (announcements, personal notifications, project attention) fails to load, only a whole-page error; legacy shows "Some notification sources are unavailable" with "Retry sources" and a different empty message. UNCONFIRMED how `AnnouncementFeed` or a failed `listMyMentorProjectAttention` surfaces; confirm by forcing each query to fail locally. | STATE | S3 | NOT:372-381,388 | `notifications/page.tsx:48-75`; `notifications/error.tsx` |
| MEN-projects-meetings-72 | Mentors receive no persisted notification rows from project events (Ready for review, Meeting requested, New comment, Task assigned, member added/removed, project updated). Attention cards are recomputed live, so a request that is later withdrawn or a comment never appears and nothing is pushed or kept. Owner decision 8. | SIDE-EFFECT | S2 | IMPL:3103-3106,4316-4321,4180,3831 | no in-app notification delivery from `src/modules/projects` (only `placements/offer-service.ts:536`) |
| MEN-projects-meetings-73 | Stalled rule is narrower: legacy flags any non-archived, non-complete, non-blocked project (including planned) idle for 7 days using last activity or `updatedAt`; vNext only ACTIVE projects. Legacy also lists notices in one merged, priority-ordered list; vNext splits into three sections. | STATE | S4 | NOT:44-64,342-346 | `mentor-attention.ts:44-84` |

---

## 15. Profile and redirect-only routes

### 1. Legacy behaviour
- Inventory rows (`docs/audit/legacy-inventory-A.md:91-98`): `/mentor/allQuizzes`, `/mentor/contacts`, `/mentor/contacts/[contactsTab]`, `/mentor/fileExplorer`, `/mentor/profile` do a `getServerSideProps` redirect (permanent false) to `/mentor/projects`; `/mentor/courses` redirects to `/mentor`; `/mentor/courses/[courseId]` and `/mentor/courses/[courseId]/[...courseTab]` redirect to `/mentor/projects`. None render a page, so there is no mentor profile screen in legacy.
- Sidebar offers only Projects, Meetings, Notifications.

### 2. vNext behaviour
- No `profile`, `contacts`, `allQuizzes`, `fileExplorer` or `courses` directories under `src/app/(authenticated)/mentor`; `docs/planning/account-surface-parity.md:161-165` classes all eight as RETIRED stubs. A mentor's browser history, bookmarks or old email links for these URLs therefore hit the not-found page (UNCONFIRMED exact response; confirm by opening `/mentor/profile` as a mentor). Mentor-only sidebar has the same three items (`shell-model.ts:180-183,327-335`). The shared `/account/security` page is the only profile-like screen and is not linked for mentors.

### 3. Gaps
| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-74 | Legacy URLs that redirect to Projects (`/mentor/profile`, `/mentor/contacts`, `/mentor/contacts/*`, `/mentor/allQuizzes`, `/mentor/fileExplorer`, `/mentor/courses/*`; `/mentor/courses` goes to `/mentor`) return not-found instead of redirecting. Matrix says RETIRED, so this is only a redirect shim (`next.config` redirects) if the owner wants old bookmarks to keep working. | MISSING-PAGE | S4 | `legacy-inventory-A.md:91-98`; pages `profile.js`, `contacts/index.js`, `courses/index.js` | no matching route; `account-surface-parity.md:161-165` |

---

## 16. Cross-cutting

| ID | Gap | Type | Sev | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| MEN-projects-meetings-75 | No unsaved-changes guard on any mentor editor (task, sprint, resource, meeting, delivery feedback): legacy confirms before route changes and registers `beforeunload` ("You have unsaved project changes. Leave this page and discard them?"); vNext dialogs are modal and discard silently on dismiss. | STATE | S4 | PDC:1134-1166,2635-2641 | `mentor-task-create.tsx`, `mentor-sprint-write.tsx`, `project-meeting-controls.tsx` (no dirty check) |
| MEN-projects-meetings-76 | Mutating mentor actions use three different confirmation idioms (`window.confirm` for sprint start/complete/reopen and closeout, `ConfirmDialog` for edits, none for release ship/unship and meeting cancel) and the legacy `showProjectError` modal with retry guidance is replaced by toast-only errors; failure copy is generic ("Project update failed", "Reload to retry."). | COPY | S3 | PDC `showProjectError` usage throughout, e.g. 1583,3184,4112 | `project-lifecycle-actions.tsx:30-45`, `mentor-sprint-write.tsx:90`, `mentor-project-closeout-control.tsx:23` |
| MEN-projects-meetings-77 | Keyboard/AT parity for the legacy board is moot (no board), but the replacement controls lack equivalents of the legacy accessible names for lanes and cards ("Reassign "{title}"", lane groups, "Open details for {title}"); status selects are labelled only "Next task state". | A11Y | S4 | PDC:223-230,420-526,8430 | `mentor-task-status-transition.tsx:38-48` |

---

## 17. Intentional differences (vNext is better or required by decision; keep unless the owner objects)

- Mentor team-membership writes are College Admin / Super Admin only (decision 3, `docs/decisions/2026-10-14-orchestrator-defaults.md:7`). Legacy mentors added, re-roled and removed members, and saw the sole-mentor guard and remove-impact text; vNext shows the roster read-only plus the managed-class-team notice (`PW:407-427`).
- Task completion is review-gated: DONE needs an approved learner task submission and the mentor transition set is TODO / IN_PROGRESS / BLOCKED (`mentor-task-transition-model.ts`). Legacy had "Mark complete" and drag into Completed.
- All writes use optimistic concurrency (`expectedUpdatedAt`) with explicit confirmation (`confirmed: true`) on mentor routes; audit events are written in the same transaction.
- Final delivery is versioned with immutable reviews, a project evaluation rubric (criteria, scores, total derived) and approved-delivery reopen with required feedback; project completion requires the closeout checklist (`closeout` page, `POST /api/projects/{id}/complete`).
- Archive, restore and project deletion are admin-only and audited; mentors get a clear read-only workspace and a "Read-only" list badge.
- Meetings: overlap check against other scheduled meetings, HTTPS-only links, future-only windows, IST everywhere (decision 2), cancel keeps the record with a note, outcome notes edit page with audit, IST reschedule dialog. Calendar adds filters (search, attention, project, sprint, link, status, type, project state, IST period) and a CSV export; meetings in progress stay in Upcoming.
- Mentor portfolio pages not in legacy: `/mentor/reviews`, `/mentor/review-history`, `/mentor/task-reviews`, `/mentor/task-review-history`, `/mentor/sprint-progress`, `/mentor/reports`, `/mentor/activity`, `/mentor/team-coverage`, and project sub-pages (board-review, risk-readiness, review-overview, review-completeness, resources-directory, timeline, team-meetings, team-history, activity-history, tasks/[taskId]/feedback, meetings/[meetingId]/notes), each with CSV exports where noted. The ten-button row and the seven list-header buttons expose them; the wording rule (part 1 gap 14) applies if the owner wants the legacy header unchanged.
- Notifications add unread/read state, mark-all-read, cursor paging, project filters and ordering; attention cards never fire for archived projects and use the latest pending delivery version.
- Resources: signed-URL file uploads with scan/ready status, 200-file cap, per-file edit and delete, visibility enforced server-side (`resource-service.ts:75`), archive instead of delete for link resources.
- Projects list: sort and filter set (progress, open tasks, team size, assignment, work coverage, attention kinds) beyond legacy; pagination via URL.

## 18. Test hooks

- Existing: `tests/integration/mentor-task-create.test.ts`, `mentor-task-details-update.test.ts`, `mentor-task-transition.test.ts`, `mentor-sprint-details-update.test.ts`, `mentor-meeting-notes.test.ts`, `mentor-meeting-reschedule.test.ts`, `mentor-calendar-filters.test.ts`, `mentor-project-closeout.test.ts`, `mentor-notification-acknowledgment.test.ts`, `mentor-latest-review-alert.test.ts`, `mentor-delivery-version-detail.test.ts`, `mentor-board-export.test.ts`, `projects-p5-lifecycle.test.ts`, `projects-p6b-final-evaluation.test.ts`, `projects-p7a-resources-readiness.test.ts`, `projects-p7b-meetings.test.ts`, unit `tests/unit/chat11-mentor-*.test.ts` (filters, ordering, review aging, CSV exports), e2e `tests/e2e/w03-mentor-surfaces.spec.ts`; acceptance pass 6 (`docs/audit/acceptance/2026-10-16-pass6.md`) rendered 27 mentor paths and exercised one mentor mutation (task assignee).
- Needed (`scripts/verify/pages/mentor-projects-meetings.mjs`, seeded local data, 1280 and 375 px): list filters and deep links including a reviewer-role member (gap 11); every tab for a Project Mentor, Co-Mentor and Reviewer; Overview readiness after gaps 16 to 22; release / sprint / task create, edit, start, complete (with open tasks), reopen, ship, unship with DB read-back; task transition to BLOCKED without a note (gap 47); task comments with author/time; assignee change and notification delivery; meeting schedule (past time, http link, overlap), request -> schedule -> complete -> notes, cancel, reschedule; resource add / edit / archive / upload with visibility MENTOR_ONLY as a learner; activity tab beyond 100 events; delivery approve / changes / reopen / evaluate / closeout and the learner-visible effects; calendar MISSED boundary at ± end time; notifications with each source failing; role-leak (learner, faculty non-mentor, other-college mentor) on `/mentor/*` and `/api/projects/*`; archived project read-only on every control.
- UNCONFIRMED (verify with seeded data): -11 (reviewer-role redirect), -71 (partial source failure), -74 (not-found response), plus whether legacy goal / deliverables / definition-of-done / personas / nextAction / blocker were carried into vNext by the NSRIT migration (gaps -17 to -20 assume they were not because no column exists; confirm against `scratchpad/audit/nsrit-migration-plan.md` and the migrated `project_instances.summary`).

## 19. Counts (gaps MEN-projects-meetings-01 to 77)

| Severity | Count |
|---|---|
| S1 | 0 |
| S2 | 16 |
| S3 | 45 |
| S4 | 16 |
| Total | 77 |

By type: MISSING-FIELD 21, COPY 19, STATE 11, MISSING-ACTION 9, SIDE-EFFECT 4, MISSING-FILTER 3, MISSING-TAB 3, MISSING-MODAL 2, MISSING-PAGE 1, VALIDATION 1, PERMISSION 1, PERFORMANCE 1, A11Y 1.
