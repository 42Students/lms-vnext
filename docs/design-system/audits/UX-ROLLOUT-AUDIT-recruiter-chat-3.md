# UX rollout cross-audit — recruiter, tracker and superadmin (chat-3)

**Scope:** 28 listed routes (17 recruiter, 6 tracker, 4 superadmin, 1 superadmin-login). **Audited:** 2026-10-18. **Builder:** chat-15. **Auditor:** chat-3. **Branch:** chatgpt/chat-3-b.

## Method

Read the signed-off UX Playbook, all 21 UX-AUDIT-RUBRIC checks, the 10 excellence rules, four route inventories and relevant author notes. Inspected each route entry and traced recruiter re-exports into actual /hr renderers; opened the forms, shared controls, permission paths and mutation guards needed to assess them. Existing legacy titles, action wording, labels and destinations were preserved. Source file:line evidence below references the pre-fix main checkout. Tests were added without weakening prior tests.

**Limits:** Source and GitHub review, not a device/browser audit. Cannot verify 320/360/390 screenshots, actual focus return/screen readers, safe area, offline behavior, or strict typecheck and CI execution from this lane. Keep page acceptance checkboxes unticked until the orchestrator records them.

## Per-page route ledger

| Route | Evidence (file:line) | Surface/state/authority assessment | Finding |
|---|---|---|---|
| /recruiter | recruiter/page.tsx:3 | Canonical Today redirect; /hr/home owns UI | RX-06 (MINOR) |
| /recruiter/calendar | recruiter/calendar/page.tsx:1 | Re-export /hr/calendar; agenda, filters and date query examined | — |
| /recruiter/colleges | recruiter/colleges/page.tsx:3 | Canonical access selection redirect; no tenant selector fork | RX-06 (MINOR) |
| /recruiter/company | recruiter/company/page.tsx:1 | Re-export /hr/company; grants, roster filters and paging examined | — |
| /recruiter/drives | recruiter/drives/page.tsx:1 | Re-export /hr/drives; query, empty/error, grants and paging examined | — |
| /recruiter/drives/[jobId] | recruiter/drives/[jobId]/page.tsx:1 | Re-export HR drive detail; applicants/offers scrolling and role reads examined | — |
| /recruiter/drives/[jobId]/change-requests | recruiter/drives/[jobId]/change-requests/page.tsx:17-23 | TPO shared editor: error, confirm, 16px controls corrected | RX-01 RX-02 RX-03 |
| /recruiter/drives/[jobId]/interview-slots | hr/drives/[jobId]/interview-slots/page.tsx:43-55 | Shared slot form/confirmation corrected | RX-05 |
| /recruiter/drives/[jobId]/messages | hr/drives/[jobId]/messages/page.tsx:23-39 | Thread opener, scoped return link and permission gates examined | — |
| /recruiter/drives/[jobId]/rounds/editor | hr/drives/[jobId]/rounds/editor/page.tsx:32-80 | GET read and version-guarded POST create/edit forms examined | — |
| /recruiter/drives/[jobId]/rounds/editor/remove/[roundId] | hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx:22-36 | Removal consequence confirmation is a dedicated route | — |
| /recruiter/drives/new | hr/drives/new/page.tsx:103-119 | Draft storage restore/reset dialog, focus and mobile size repaired | RX-04 |
| /recruiter/drives/proposals | hr/drives/proposals/page.tsx:36-83 | URL query/sort, pagination, scoped college choices examined | — |
| /recruiter/drives/recorded-outside | hr/drives/recorded-outside/page.tsx:13-33 | College grant gate, outside-drive form and route return examined | — |
| /recruiter/home | hr/home/page.tsx:129-152 | Today dashboard, authorized college and action states examined | — |
| /recruiter/messages | hr/conversations/page.tsx:46-58 | Inbox query and thread destination, reply form examined | — |
| /recruiter/profile | hr/profile/page.tsx:16-25 | Profile/grant panels and responsive tables examined | — |
| /tracker | tracker/page.tsx:10-39 | Tracker report form: 16px text, 44px controls, safe retry | TX-03 TX-04 |
| /tracker/audit-findings | tracker/audit-findings/page.tsx:37-125 | DataTable empties, filter values, pager focus corrected | TX-05 |
| /tracker/audit-findings/[publicId] | tracker/audit-findings/[publicId]/page.tsx:27-59 | Version-checked edit dialog, finding link contrast repaired | TX-01 TX-02 TX-09 |
| /tracker/issues | tracker/issues/page.tsx:146-188 | Issue title link and bulk status write confirmation repaired | TX-06 TX-08 |
| /tracker/issues/[publicId] | tracker/issues/[publicId]/page.tsx:43-48,100-190 | Super Admin rights, cursor pagination and workflow controls examined | TX-07 |
| /tracker/logs | tracker/logs/page.tsx:1-35 | Log panel link/retry 44px and focus corrected | TX-07 |
| /superadmin | superadmin/page.tsx:1-3 | Protected /admin/academics redirect | SX-01 (MINOR) |
| /superadmin/[...legacy] | superadmin/[...legacy]/page.tsx:8-22 | Super Admin check, allowlist, q-only query forwarding examined | — |
| /superadmin/departments | superadmin/departments/page.tsx:1-9 | Role guard in legacy-department-links.ts; no data in alias | — |
| /superadmin/programs | superadmin/programs/page.tsx:1-9 | Role guard in legacy-department-links.ts; no data in alias | — |
| /superadmin-login | superadmin-login/page.tsx:1-6 | Legacy entry uses shared login/MFA flow; device redirect pending | SX-01 (MINOR) |

## Findings — exact fixes

| ID | Severity | Page | Evidence (file:line) | Failure | Required fix / disposition |
|---|---|---|---|---|---|
| RX-01 | MAJOR | /recruiter/drives/[jobId]/change-requests | tpo-drive-change-requests.tsx:23-29 | Raw API issue/error and arbitrary status in UI | Safe fallback and public-status whitelist; fixed |
| RX-02 | MAJOR | /recruiter/drives/[jobId]/change-requests | tpo-drive-change-requests.tsx:37-52,76-90 | 40px button actions and low-contrast text | Shared controls, 44px targets, keyboard focus; fixed |
| RX-03 | MAJOR | /recruiter/drives/[jobId]/change-requests | tpo-drive-change-requests.tsx:79-90 | Accept/Decline/Withdraw executed without review | ConfirmDialog with preserved action wording and version token; fixed |
| RX-04 | MAJOR | /recruiter/drives/new | hr-drive-draft-form.tsx:145-153,459-466 | Browser confirm for replacing or clearing unsent work | Focus-managed restoration/reset dialogue preserving drafts; fixed |
| RX-05 | MAJOR | /recruiter/drives/[jobId]/interview-slots | recruiter-interview-slot-form.tsx:111-145 | Browser confirm for cancelling slot | ConfirmDialog; shared 44px Input/Select/Button; fixed |
| TX-01 | MAJOR | /tracker/audit-findings/[publicId] | independent-finding-actions.tsx:32-47 | Browser prompt for immutable audit write | ConfirmDialog before version-checked PATCH; fixed |
| TX-02 | MAJOR | /tracker/audit-findings/[publicId] | independent-finding-actions.tsx:50-87 | 40px fields, smaller phone text, weak focus | Shared Input/Select/Textarea/Button; fixed |
| TX-03 | MAJOR | /tracker | tracker-report-form.tsx:14,115-132,218-242 | Small phone inputs and undersized actions | 16px fields, 44px buttons, shared components/focus; fixed |
| TX-04 | MAJOR | /tracker | tracker-report-form.tsx:97-99 | Similar-issue search leaked caught error.message | Retained friendly unavailable copy; fixed |
| TX-05 | MAJOR | /tracker/audit-findings | tracker/audit-findings/page.tsx:37,95-125 | Filter and pager size/focus inconsistency | Shared fields/buttons, keyboard-visible 44px pagination; fixed |
| TX-06 | MAJOR | /tracker/issues | tracker/issues/page.tsx:162-165 | Issue title link hover-only, small tap target | 44px deep-teal underlined keyboard link; fixed |
| TX-07 | MAJOR | /tracker/issues and /tracker/logs | tracker-issue-bulk-actions.tsx:53-81; tracker-workflow-panel.tsx:131-137; tracker-issue-logs-panel.tsx:30-41 | Undersized bulk/log controls, decorative links | 44px targets, accessible link ink/focus; fixed |
| TX-08 | MAJOR | /tracker/issues | tracker-issue-bulk-actions.tsx:21-38,73-83 | Bulk status write lacked explicit review | ConfirmDialog before version-checked write loop; fixed |
| TX-09 | MINOR | /tracker/audit-findings/[publicId] | tracker/audit-findings/[publicId]/page.tsx:41-42 | Looks similar decorative teal ink | Accessible link ink and focus; fixed |
| RX-06 | MINOR | /recruiter root and colleges | recruiter/page.tsx:3; recruiter/colleges/page.tsx:3 | Alias UI is delegated to /hr destination | Preserve routing; verify actual redirect in browser |
| SX-01 | MINOR | /superadmin and login | superadmin/page.tsx:1-3; superadmin-login/page.tsx:1-6 | Legacy bookmark deep-link return path unverified | Preserve gated/shared destination; browser evidence pending |

## 21 checks / 10 excellence criteria

| Rubric | Evidence and outcome |
|---|---|
| 1–4 completeness/archetypes/component/states | Mapped all 28 routes to alias, form, directory, detail, dashboard, calendar, inbox or login archetypes. Checked canonical inherited states rather than declaring a redirect UX pass. |
| 5–7 palette/type/legacy | Inspected deep-teal links, action contrast, text sizes and legacy labels. Corrected identified undersized or decorative controls without changing titles or destinations. |
| 8–10 shared APIs, compatibility, browser prompts/raw errors | Used existing Button, Select, Textarea, Input and ConfirmDialog APIs. Source contracts guard safe feedback, version tokens, unsaved draft and confirmations. |
| 11–14 phone/WebView/slow network | Corrected touch geometry and input zoom risks; retained draft, query and same-tab link behavior. True 320/360/390 tests, safe-area and offline evidence are still required. |
| 15–16 accessibility/announcement | Reviewed form labels, alert/status output, accessible actions and focus styles. Fixed real missing focus and modal confirmation; no live screen-reader test has been done. |
| 17–19 TS/performance/reference | No new permission bypass or unbounded list introduced; existing scopes, pagination and shared controls retained. No typecheck/browser execution claimed. |
| 20–21 anti-drift | Added regression contracts for URL filters, modal decisions, draft restoration, copy-safe errors and optimistic version checks; redirects must always be tested through canonical destination in an authenticated browser. |

## Verdicts and counts

| Area | Routes | BLOCKER | MAJOR | MINOR | NIT | MAJOR fixed | Verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| Recruiter | 17 | 0 | 5 | 1 | 0 | 5 | PASS WITH FIXES, source only |
| Tracker | 6 | 0 | 8 | 1 | 0 | 8 | PASS WITH FIXES, source only |
| Superadmin + login | 5 | 0 | 0 | 1 | 0 | 0 | PASS, redirect source only |
| **TOTAL** | **28** | **0** | **13** | **3** | **0** | **13** | **Runtime acceptance outstanding** |

## Three riskiest unverified areas

1. Mobile/native WebView at 320/360/390px: actual overflow, dialog focus restoration, screen reader, safe-area and native date controls.
2. Unreliable networks and stale writes: confirm locks, 4xx/5xx copy, optimistic tokens, draft backup/restoration against the development database.
3. Authenticated role and tenant/browser navigation: recruiter grant loss, Super Admin deep-link redirects, shared login/MFA and denied/error recovery.

**No production action, schema migration or data mutation was performed.**
