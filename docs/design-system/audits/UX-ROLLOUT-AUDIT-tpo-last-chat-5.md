# UX ROLLOUT CROSS-AUDIT — /tpo LAST THIRD — chat-5

**Auditor:** chat-5 (independent of author chat-2)  
**Baseline inspected:** `8b40a824d9b85284254f2cc7536146047e2bd251` (`main`, October 18, 2026).  
**Pages:** 42 of 42, exact route-order positions **85–126** in `pages-tpo.md`.  
**Standard:** signed-off `UX-PLAYBOOK.md`, 21-item `UX-AUDIT-RUBRIC.md`, ten rollout criteria, original TPO wording catalogue `docs/audit/legacy-copy-B.md`.

## Method and limitations

Inspected all 42 route source files for text contrast, main landmarks, semantic headings, native prompts, fixed-width tables, retained phone cards, auth gating, data-state copy, and author notes/tests. Independently inspected the shared `DataTable` contract and higher-risk descendant controls for company trust, domain trust, recruiter grants and learner request decisions. Traced TPO settings/student tables to ensure action and verification fields survive mobile conversion. All changes stay on the chat-5 feature branch; no production access or GET side effects.

This is a **source audit**, not a claim that every nested component, runtime HTTP response, permission combination, 320/360/390 screenshot or screen-reader interaction has passed in a live browser. Existing wording was retained during changes; no exhaustive automatic equality check against the million-character legacy catalogue is claimed.

## Findings and completed required fixes

| Page | Finding ID | Severity | Evidence (pre-fix file:line) | Required fix / resolution |
|---|---|---|---|---|
| `/tpo/reports/by-branch` | `TPO-L85-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/by-branch/page.tsx:64` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/by-company` | `TPO-L86-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/by-company/page.tsx:71` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/failure-reasons` | `TPO-L88-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx:129` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/intelligence` | `TPO-L89-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/intelligence/page.tsx:46` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/joining-followups` | `TPO-L90-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/joining-followups/page.tsx:33` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/joining-status` | `TPO-L91-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/joining-status/page.tsx:61` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/leads` | `TPO-L92-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/leads/page.tsx:118` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/offers-expiry` | `TPO-L94-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx:36` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/placed-branch` | `TPO-L95-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/placed-branch/page.tsx:38` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/placement-summary` | `TPO-L96-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/placement-summary/page.tsx:182` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/season-pipeline` | `TPO-L97-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx:52` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/reports/unplaced` | `TPO-L98-C` | **MAJOR** | `src/app/(authenticated)/tpo/reports/unplaced/page.tsx:83` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/requests` | `TPO-L099-A` | **MAJOR** | `src/components/placements/tpo-request-decision-control.tsx:71,91` | Brought approve/reject/reason-choice buttons to 44px minimum with accessible foreground and unchanged decision dialogs. |
| `/tpo/requests` | `TPO-L99-C` | **MAJOR** | `src/app/(authenticated)/tpo/requests/page.tsx:49` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/requests` | `TPO-L99-M` | **MAJOR** | `src/app/(authenticated)/tpo/requests/page.tsx:43` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/settings/after-college` | `TPO-L101-M` | **MAJOR** | `src/app/(authenticated)/tpo/settings/after-college/page.tsx:14` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/settings/blocked-dates` | `TPO-L102-M` | **MAJOR** | `src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx:9` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/settings/job-types` | `TPO-L104-M` | **MAJOR** | `src/app/(authenticated)/tpo/settings/job-types/page.tsx:10` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/settings/notices` | `TPO-L105-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/notices/page.tsx:29` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/notices` | `TPO-L105-M` | **MAJOR** | `src/app/(authenticated)/tpo/settings/notices/page.tsx:21` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/settings/notifications` | `TPO-L106-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/notifications/page.tsx:81` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/notifications` | `TPO-L106-T` | **MAJOR** | `src/app/(authenticated)/tpo/settings/notifications/page.tsx:259` | Migrated fixed-width table to shared responsive `DataTable`, retained every original column/action and supplied explicit legacy empty copy. |
| `/tpo/settings/prep-readiness` | `TPO-L107-M` | **MAJOR** | `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx:21` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/settings/public-page` | `TPO-L109-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/public-page/page.tsx:68` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/recruiters` | `TPO-L110-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/recruiters/page.tsx:99` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/recruiters` | `TPO-L110-P` | **BLOCKER** | `src/components/placements/tpo-recruiter-grant-controls.tsx:17` | Replaced grant/revoke/extend native confirms with guarded `ConfirmDialog`; preserved confirmation wording, versions and mutation payloads. |
| `/tpo/settings/recruiters` | `TPO-L110-T` | **MAJOR** | `src/app/(authenticated)/tpo/settings/recruiters/page.tsx:256` | Migrated fixed-width table to shared responsive `DataTable`, retained every original column/action and supplied explicit legacy empty copy. |
| `/tpo/settings/rules` | `TPO-L111-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/rules/page.tsx:196` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/team` | `TPO-L114-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/team/page.tsx:51` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/team` | `TPO-L114-T` | **MAJOR** | `src/app/(authenticated)/tpo/settings/team/page.tsx:145` | Migrated fixed-width table to shared responsive `DataTable`, retained every original column/action and supplied explicit legacy empty copy. |
| `/tpo/settings/templates` | `TPO-L115-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/templates/page.tsx:21` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/templates` | `TPO-L115-M` | **MAJOR** | `src/app/(authenticated)/tpo/settings/templates/page.tsx:11` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/settings/trusted` | `TPO-L116-C` | **MAJOR** | `src/app/(authenticated)/tpo/settings/trusted/page.tsx:40` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/settings/trusted` | `TPO-L116-D` | **MAJOR** | `src/components/tpo/tpo-trusted-domain-editor.tsx:10` | Replaced trusted-domain native confirm with focus-managed `ConfirmDialog`, retaining verification warning and mutation scope. |
| `/tpo/settings/trusted` | `TPO-L116-P` | **BLOCKER** | `src/components/placements/tpo-trust-toggle.tsx:22–31` | Removed `window.prompt` and native confirm; shared `ConfirmDialog` with 8–500 character reason, safe cancellation and preserved college-scoped audit. |
| `/tpo/settings/trusted` | `TPO-L116-T` | **MAJOR** | `src/app/(authenticated)/tpo/settings/trusted/page.tsx:120` | Migrated fixed-width table to shared responsive `DataTable`, retained every original column/action and supplied explicit legacy empty copy. |
| `/tpo/students/[membershipId]/history` | `TPO-L118-C` | **MAJOR** | `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx:50` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/students/[membershipId]/history` | `TPO-L118-N` | **MAJOR** | `docs/orchestrator/ui-ux/pages-tpo.md:120` | Created missing `docs/audit/ux/<route>.md` and its route-specific regression coverage. |
| `/tpo/students/[membershipId]/participation` | `TPO-L119-C` | **MAJOR** | `src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx:41` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/students/[membershipId]/participation` | `TPO-L119-N` | **MAJOR** | `docs/orchestrator/ui-ux/pages-tpo.md:121` | Created missing `docs/audit/ux/<route>.md` and its route-specific regression coverage. |
| `/tpo/students/preparation-plan` | `TPO-L120-C` | **MAJOR** | `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx:20` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/students/preparation-plan` | `TPO-L120-M` | **MAJOR** | `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx:18` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/students/preparation-prep` | `TPO-L121-C` | **MAJOR** | `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx:20` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/students/preparation-prep` | `TPO-L121-M` | **MAJOR** | `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx:14` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/students/requests` | `TPO-L122-C` | **MAJOR** | `src/app/(authenticated)/tpo/students/requests/page.tsx:131` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/team` | `TPO-L123-C` | **MAJOR** | `src/app/(authenticated)/tpo/team/page.tsx:127` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/team/[threadId]` | `TPO-L124-C` | **MAJOR** | `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:39` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/team/[threadId]` | `TPO-L124-M` | **MAJOR** | `src/app/(authenticated)/tpo/team/[threadId]/page.tsx:36` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/team/[threadId]` | `TPO-L124-N` | **MAJOR** | `docs/orchestrator/ui-ux/pages-tpo.md:126` | Created missing `docs/audit/ux/<route>.md` and its route-specific regression coverage. |
| `/tpo/team/everyone` | `TPO-L125-C` | **MAJOR** | `src/app/(authenticated)/tpo/team/everyone/page.tsx:22` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/team/everyone` | `TPO-L125-M` | **MAJOR** | `src/app/(authenticated)/tpo/team/everyone/page.tsx:21` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/team/everyone` | `TPO-L125-N` | **MAJOR** | `docs/orchestrator/ui-ux/pages-tpo.md:127` | Created missing `docs/audit/ux/<route>.md` and its route-specific regression coverage. |
| `/tpo/verification` | `TPO-L126-C` | **MAJOR** | `src/app/(authenticated)/tpo/verification/page.tsx:22` | Replaced small-text `text-primary-text` (3.59:1 on white) with deep-teal, 4.94:1; preserved legacy link words. |
| `/tpo/verification` | `TPO-L126-M` | **MAJOR** | `src/app/(authenticated)/tpo/verification/page.tsx:19` | Removed redundant nested `<main>`; the authenticated shell owns the sole main landmark. |
| `/tpo/verification` | `TPO-L126-N` | **MAJOR** | `docs/orchestrator/ui-ux/pages-tpo.md:128` | Created missing `docs/audit/ux/<route>.md` and its route-specific regression coverage. |

## Mobile table evidence

The four repaired directory tables are `/tpo/settings/notifications` (subject, module, read status, IST receipt), `/tpo/settings/recruiters` (seven fields including verification status plus guarded extend/revoke), `/tpo/settings/team` (four fields, role badges and duty links), and `/tpo/settings/trusted` (three fields plus trust toggle). The authorized student branch-intelligence table at `/tpo/students` and request table at `/tpo/students/requests` **already** have corresponding separately rendered mobile cards; their raw desktop tables are not absent-mobile findings.

## Tests and acceptance

- `tests/unit/chat5-ux-cross-tpo-last.test.ts`: each of the 42 routes has a uniquely named `UX-tpo-<route>-09` integrity check; four directory mobile table contracts, preserved authorization/version metadata and notice content, trust/grant/request confirmation contracts, and five note-traceability checks.
- Existing chat-2 UX tests were **not removed or weakened**.
- Five previously missing route notes were written in `docs/audit/ux/`; all remaining 37 notes already existed.
- Source checks for no `text-primary-text` and no nested `<main>` passed across all 42 route files in the changed branch. Dialog tests are authored, not executed.

## Counts and verdict

| Status | BLOCKER | MAJOR | MINOR | NIT |
|---|---:|---:|---:|---:|
| Identified | **2** | **53** | 0 | 0 |
| Source fixes committed | **2** | **53** | 0 | 0 |
| Open in inspected source | **0** | **0** | 0 | 0 |

**Verdict: PASS — source-level WITH FIXES.** Runtime acceptance is not yet certified. All 55 identified actionable issues were addressed in code or traceable page notes. Do not mark tests green or publish a 100-point WCAG rating without the orchestrator running CI and native-device/browser checks.

## Three highest-risk unverified areas

1. **Modal UX under real browser/WebView:** focus trap/return, keyboard Escape, software keyboard/safe areas and the revised permission-change confirmations need 320/360/390px device and screen-reader captures.
2. **Server permission and mutation integration:** college tenancy, origin protections, stale version rejection, exact POST side effects, notification preferences and mixed ACTIVE/REVOKED grants require an authenticated database/service test. No server authorization code was altered.
3. **Source-to-legacy complete parity and long lists:** the legacy catalogue is not replayed line-for-line by automation here; real content, pagination >100 records, all statuses and error/loading variants need a deployed UX walkthrough.

## Exact audited routes (by ordered list)

85. `/tpo/reports/by-branch`  
86. `/tpo/reports/by-company`  
87. `/tpo/reports/ctc`  
88. `/tpo/reports/failure-reasons`  
89. `/tpo/reports/intelligence`  
90. `/tpo/reports/joining-followups`  
91. `/tpo/reports/joining-status`  
92. `/tpo/reports/leads`  
93. `/tpo/reports/offers-acceptance`  
94. `/tpo/reports/offers-expiry`  
95. `/tpo/reports/placed-branch`  
96. `/tpo/reports/placement-summary`  
97. `/tpo/reports/season-pipeline`  
98. `/tpo/reports/unplaced`  
99. `/tpo/requests`  
100. `/tpo/settings`  
101. `/tpo/settings/after-college`  
102. `/tpo/settings/blocked-dates`  
103. `/tpo/settings/branding`  
104. `/tpo/settings/job-types`  
105. `/tpo/settings/notices`  
106. `/tpo/settings/notifications`  
107. `/tpo/settings/prep-readiness`  
108. `/tpo/settings/public-link`  
109. `/tpo/settings/public-page`  
110. `/tpo/settings/recruiters`  
111. `/tpo/settings/rules`  
112. `/tpo/settings/season`  
113. `/tpo/settings/see`  
114. `/tpo/settings/team`  
115. `/tpo/settings/templates`  
116. `/tpo/settings/trusted`  
117. `/tpo/students`  
118. `/tpo/students/[membershipId]/history`  
119. `/tpo/students/[membershipId]/participation`  
120. `/tpo/students/preparation-plan`  
121. `/tpo/students/preparation-prep`  
122. `/tpo/students/requests`  
123. `/tpo/team`  
124. `/tpo/team/[threadId]`  
125. `/tpo/team/everyone`  
126. `/tpo/verification`
