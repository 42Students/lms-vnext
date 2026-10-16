# Round R review: Super Admin / tenants-modules (Round A files tenants-modules.md, tenants-modules-2.md, tenants-modules-3.md)

Reviewer: Round R (Claude Sonnet 5.5). Judged against origin/main c72f0b19b (no commits touching the admin routes, colleges, module-access, platform-settings, inbound-mail, announcements, verification, tracker, activity or dashboard code after the Round A commit 460950977; the chat-9 sidebar and copy work of 2026-10-16 04:xx predates Round A and is already reflected). Legacy: `_hr-tpo-fe` at lms-dev-2026 63fea105 and backend `42LMS-BACKEND\lms` (lms-dev-2026).

## 1. Summary

Round A gaps reviewed: 68 (SA-tenants-modules-01 to -68). CONFIRMED 65, WRONG 0, SEVERITY-CHANGE 3, MISSED 3. Discrepancy rate = (3 MISSED + 0 WRONG + 3 SEVERITY-CHANGE) / (68 + 3) = 6 / 71 = 8.5%.

Two factual corrections inside CONFIRMED rows (not counted as discrepancies because the gap stands): -33 says 33 documented settings keys, the dev-tip `SETTINGS` array has 31 (7 Platform and auth, 4 SMS, 4 Course and progress, 3 Attendance, 9 Placements, 4 Operational caps; `TenantSettings.js:73-414`); -12 says vNext "keeps case", true for storage, but the server rejects a duplicate case-insensitively (`src/modules/colleges/service.ts:118-125`), so the only gap is the missing format rule and readable message.

Method note: I read the legacy closure (TenantsHub, Organizations, Colleges, ManageCollegeDrawer, CollegeSubdomain, CollegeBranding, CollegeSignIn, ReadinessGate, TenantSettings, FeatureControlsHub, ModuleAccess, AuditHub/ActivityCenter/activityText, inbound-mail, announcements, audit-findings page and drawer, VerificationWorkspace, Dashboard; backend SuperAdminFeatureController, TenantAdminController settings and audit calls, SuperAdminAuditController) and the vNext pages and components before opening the Round A files. My independent list reproduced the large gaps (read-only settings, no descendant module-access editing, no inline feature toggles or blast-radius counts, read-only sign-in and branding, no subdomain allot, no org/college search or bulk import, no address fields, inbound mail without mark-done, audit-findings board not the repo importer, no placement-cell verification switch or bulk actions on the Super Admin queue, no read counts or button on announcements, thin Overview). Round A is unusually complete for this group; the review found only small misses.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
| --- | --- | --- |
| SA-tenants-modules-01 | CONFIRMED | `dashboard/page.tsx:79-165` shows only Organizations, Colleges, Departments, People. |
| SA-tenants-modules-02 | CONFIRMED | No attention board on the vNext Super Admin Overview. |
| SA-tenants-modules-03 | CONFIRMED | `SUPER_ADMIN_COLLEGE_LINKS` is 8 text links (`admin-dashboard-navigation.ts:74-83`). |
| SA-tenants-modules-04 | CONFIRMED | `SUPER_ADMIN_GLOBAL_LINKS` has 3 entries, no Recruiter accounts, no descriptions. |
| SA-tenants-modules-05 | CONFIRMED | Shell scope picker not re-read by me; taken from Round A (UNCONFIRMED in section 5). |
| SA-tenants-modules-06 | CONFIRMED | `/admin/tenants` is a read-only directory; create and setup are separate routes. |
| SA-tenants-modules-07 | CONFIRMED | `organization-actions.tsx` is Rename/Archive; no Status column. |
| SA-tenants-modules-08 | CONFIRMED | `organizations/page.tsx` has no search, count or page size. |
| SA-tenants-modules-09 | CONFIRMED | |
| SA-tenants-modules-10 | CONFIRMED | `organization-create-form.tsx:28` shows `payload?.error` (a machine code from `api-error.ts:92`), no success toast on the plain form. |
| SA-tenants-modules-11 | CONFIRMED | `college-create-form.tsx` posts organizationId, name, code only. |
| SA-tenants-modules-12 | CONFIRMED | Code schema is 1-64 chars (`validation.ts:19-23`); see correction above. |
| SA-tenants-modules-13 | CONFIRMED | |
| SA-tenants-modules-14 | CONFIRMED | |
| SA-tenants-modules-15 | CONFIRMED | No bulk import anywhere in `src/components/admin`. |
| SA-tenants-modules-16 | CONFIRMED | Edit dialog has name, city, state, country only. |
| SA-tenants-modules-17 | SEVERITY-CHANGE | S2 to S3. `person-onboard-dialog.tsx` and `person-membership-actions.tsx` (suspend) give a Super Admin the same College Admin/TPO create and suspend path from `/admin/people`; what is missing is the in-context tab, permanent delete and per-admin history. See section 4. |
| SA-tenants-modules-18 | CONFIRMED | Only `/api/admin/hr/[userId]/terminate-sessions` exists (HR accounts), not for College Admin or TPO. |
| SA-tenants-modules-19 | CONFIRMED | |
| SA-tenants-modules-20 | SEVERITY-CHANGE | S1 to S2. The gap is real (`college-subdomain-model.ts` unreferenced), but a platform-domain host can still be added through `tenant-domain-manager.tsx` with a TXT record, so launch is slower rather than blocked. See section 4. |
| SA-tenants-modules-21 | CONFIRMED | `updateCollegeSignInSchema` exists but has no caller (grep) and no route. |
| SA-tenants-modules-22 | CONFIRMED | `CollegeBrandingForm` is mounted only at `/college/branding`. |
| SA-tenants-modules-23 | CONFIRMED | |
| SA-tenants-modules-24 | CONFIRMED | No audit or activity emit in `organizations/service.ts`, `colleges/service.ts`, `tenant-domains/service.ts`, or the `src/app/api/organizations`, `colleges`, `tenant-domains` routes (grep). |
| SA-tenants-modules-25 | CONFIRMED | |
| SA-tenants-modules-26 | CONFIRMED | `college-feature-rule-editor.tsx` confirm text is generic; legacy fetches `/mentor-count` and `/placements-impact` (`SuperAdminFeatureController.java:231-270`). |
| SA-tenants-modules-27 | CONFIRMED | Only COLLEGE and membership editors exist (`college-feature-rule-editor.tsx`, `student-rule-editor.tsx`); S1 stands because no other vNext page edits Department/Program/Cohort/Section rules. |
| SA-tenants-modules-28 | CONFIRMED | |
| SA-tenants-modules-29 | CONFIRMED | |
| SA-tenants-modules-30 | CONFIRMED | |
| SA-tenants-modules-31 | CONFIRMED | |
| SA-tenants-modules-32 | CONFIRMED | |
| SA-tenants-modules-33 | CONFIRMED | Count corrected to 31 keys (section 1). |
| SA-tenants-modules-34 | SEVERITY-CHANGE | S2 to S3, and the UNCONFIRMED is resolved: College Admin edits both values at `/college/attendance/settings` through `PUT /api/attendance/admin/policy` (`college-attendance-policy-form.tsx`). Only the Super Admin copy of the control is missing. |
| SA-tenants-modules-35 | CONFIRMED | |
| SA-tenants-modules-36 | CONFIRMED | |
| SA-tenants-modules-37 | CONFIRMED | |
| SA-tenants-modules-38 | CONFIRMED | |
| SA-tenants-modules-39 | CONFIRMED | |
| SA-tenants-modules-40 | CONFIRMED | |
| SA-tenants-modules-41 | CONFIRMED | |
| SA-tenants-modules-42 | CONFIRMED | `activity/page.tsx:97` uses `limit: 40`, no default window. |
| SA-tenants-modules-43 | CONFIRMED | |
| SA-tenants-modules-44 | CONFIRMED | Only the `Current admin safety scope` option (line 197), no banner. |
| SA-tenants-modules-45 | CONFIRMED | |
| SA-tenants-modules-46 | CONFIRMED | No sync route under `src/app/api/tracker`. |
| SA-tenants-modules-47 | CONFIRMED | |
| SA-tenants-modules-48 | CONFIRMED | |
| SA-tenants-modules-49 | CONFIRMED | |
| SA-tenants-modules-50 | CONFIRMED | |
| SA-tenants-modules-51 | CONFIRMED | `inbound-mail-list.tsx` is read-only. |
| SA-tenants-modules-52 | CONFIRMED | `message-model.ts:3` defaults to ALL. |
| SA-tenants-modules-53 | CONFIRMED | |
| SA-tenants-modules-54 | CONFIRMED | Only `admin-service.ts` and the schema reference `inbound_mail_messages`; no `src/app/api` route writes it. Keep S2 pending the recruiter-reply decision (section 5). |
| SA-tenants-modules-55 | CONFIRMED | `inbound-mail/page.tsx:15-16`. |
| SA-tenants-modules-56 | CONFIRMED | `admin-service.ts:39,54` limit 25. |
| SA-tenants-modules-57 | CONFIRMED | |
| SA-tenants-modules-58 | CONFIRMED | |
| SA-tenants-modules-59 | CONFIRMED | |
| SA-tenants-modules-60 | CONFIRMED | |
| SA-tenants-modules-61 | CONFIRMED | Inputs are 255 and 10000 (`super-admin-college-broadcast-form.tsx:64-65`). |
| SA-tenants-modules-62 | CONFIRMED | |
| SA-tenants-modules-63 | CONFIRMED | `TpoVerificationSwitch` is used only in `CollegeVerificationPanel.tsx:76`. |
| SA-tenants-modules-64 | CONFIRMED | |
| SA-tenants-modules-65 | CONFIRMED | `SuperAdminVerificationPanel.tsx` passes no `selectedKeys` or `onSelectionChange`. |
| SA-tenants-modules-66 | CONFIRMED | |
| SA-tenants-modules-67 | CONFIRMED | |
| SA-tenants-modules-68 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
| --- | --- | --- | --- | --- | --- |
| SA-tenants-modules-R01 | The control-page header cards are missing on Feature Controls, Module Access and Tenant Settings: scope tag (`Platform view`, `Organization scope`, `One college`) and summary metrics (Feature Controls: `Colleges in scope`, `Projects on`, `Placements on`; Module Access: `Hierarchy scopes`, `Students in largest scope`, `Student overrides`; Tenant Settings: `Documented controls`, `Stored keys`, `Editing`) plus the eyebrow/title/description copy (`Module availability` / `Optional modules by college`, `Effective access` / `Optional module access hierarchy`, `Runtime configuration` / `Settings with explicit execution scope`). Round A records the cards in its legacy sections but raises a gap only for Tenant Setup (-06). | MISSING-FIELD | S4 | `src/pages/superadmin/sections/FeatureControlsHub.js` (AdminControlOverview block), `ModuleAccess.js:598-606`, `TenantSettings.js` header overview | `admin/features/page.tsx` (PageHeader only; counts exist only as "N-M of T"), `admin/module-access/page.tsx`, `admin/settings/page.tsx` |
| SA-tenants-modules-R02 | Archived organizations and colleges cannot be restored. vNext replaced legacy permanent delete with archive (`Archive` in `organization-actions.tsx`, `college-archive-button.tsx`) and `/admin/tenants` lists `ARCHIVED` colleges, but no restore action, route or service exists, so an archive done by mistake cannot be undone from the product. Legacy delete was irreversible but also blocked while dependants existed; vNext archive adds a state the lifecycle view shows but nothing can leave. | MISSING-ACTION | S3 | `SEC/Organizations.js:112-125`, `SEC/Colleges.js:271-290` (hard delete, blocked by dependants; no restore needed) | `src/modules/colleges/service.ts`, `src/modules/organizations/service.ts`, `src/app/api/colleges`, `src/app/api/organizations` (no restore/unarchive anywhere, grep); `admin/tenants/page.tsx:25` filter offers `ARCHIVED` |
| SA-tenants-modules-R03 | Audit Findings access: legacy opens the board to a super admin or to a tracker manager who passes the tracker logs-access gate (`TrackerLogsAccessGate`, checked again by every API); vNext allows active Super Admin only and redirects everyone else to `/dashboard`. Probably an intended tightening, but it is an access difference nobody recorded. | PERMISSION | S4 | `src/pages/tracker/audit-findings.js:195-224`, `TrackerLogsAccessGate.jsx` | `tracker/audit-findings/page.tsx:19` |

## 4. WRONG and SEVERITY-CHANGE details

No Round A row was WRONG (no case where vNext already does what the row says is missing).

- SA-tenants-modules-17, S2 to S3. Reason: the user outcome "create a College Admin or TPO for this college, suspend and reactivate them" is reachable in vNext from `/admin/people` (onboard dialog with COLLEGE_ADMIN and TPO roles, membership suspend action). The remaining gap is the Manage College drawer co-location, permanent delete and per-admin suspend history, which are convenience and cleanup. The mentor-project suspend guard stays UNCONFIRMED.
- SA-tenants-modules-20, S1 to S2. Reason: S1 means a real workflow is blocked. `tenant-domain-manager.tsx` can add `name.<platform domain>`, show the TXT record and verify it, and readiness accepts a verified primary host, so a platform subdomain can be launched, with a DNS step the owner controls. The experience is much worse than legacy one-click allot (and the 3 to 30 character name rule and reserved names are absent), so it stays a high S2.
- SA-tenants-modules-34, S2 to S3. Reason: both attendance policy values are editable by the College Admin in vNext (`/college/attendance/settings`, `PUT /api/attendance/admin/policy`), which is also who owns them in legacy day to day; only the Super Admin shortcut from Tenant Settings is missing. Round A's UNCONFIRMED is closed.

## 5. UNCONFIRMED items and how to confirm on the deployed dev site

1. SA-tenants-modules-05 header scope picker (not independently re-read): open any `/admin/*` page as Super Admin, check whether the picker is searchable and warns on clearing.
2. SA-tenants-modules-54 and the recruiter-reply flow: confirm whether any vNext recruiter or student email-reply path is expected to post into conversations. Check `docs/parity/*recruiter*` and the recruiter audit review; if yes, raise -54 to S1. Also confirm there is no webhook outside `src/app/api` (for example a Cloudflare Worker repo) writing `inbound_mail_messages`.
3. SA-tenants-modules-62 and -57: send a broadcast on dev and read the TPO `From 42` tab and bell to see whether a notification (not only an announcement row) reaches colleges without a placement cell. The broadcast service has no notification or audit call in the lines I read (`super-admin-college-broadcast-service.ts`, grep for notif and audit returned nothing); confirm in the database `notifications` and activity tables.
4. SA-tenants-modules-17: on `/admin/people` as Super Admin, onboard a TPO for a selected college, suspend a mentor who is active on a project, and confirm whether the legacy block (cannot suspend while mentoring active projects) exists.
5. SA-tenants-modules-24 and -R02: create then archive an organization and college on dev and look in Activity Log; try to find any way to restore the archived college (also confirm `/admin/tenants?status=ARCHIVED` offers no action).
6. SA-tenants-modules-30: query `module_access_rules` for `locked = true AND enabled IS NULL` (Round A's own check).
7. SA-tenants-modules-33 setting count: re-run on `lms-dev-2026` tip to confirm 31 keys (this review) versus the 33 in the inventory; if prod-2026 differs, state which branch the inventory used.
