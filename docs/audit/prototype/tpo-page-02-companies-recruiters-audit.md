# TPO prototype page 02 — Companies → Recruiters

## Exact source evidence

- **Original reference:** user-supplied `42LMS pages prototype-png-tpo(1).zip`, member `Companies › Recruiters.png`, intrinsic **2880 × 2264**. This is the design target. The example names/counts shown in the PNG must **not** be reproduced as live records.
- **Current route:** `/tpo/recruiters`. Backed by TPO per-college lead service and the authenticated TPO shell.
- **Legacy implementation consulted:** `42Students/lms2-fe` on `lms-dev-2026`: `src/components/tpo/recruiters/RecruiterSidePanel.jsx`, `src/components/tpo/outreach/OutreachTab.jsx` and `src/pages/tpo/companies.js`.
- **vNext files:** `src/components/tpo/recruiter-leads-workspace.tsx`, `recruiter-prototype-roster.tsx`, `recruiter-prototype-stage-ribbon.tsx`, `recruiter-prototype-inspector.tsx`, `recruiter-lead-detail-workspace.tsx`.
- **Acceptance tests:** `tests/unit/tpo-prototype-recruiter-inspector-2026.test.ts` in `.github/workflows/tpo-prototype-source-acceptance.yml`.

## Source comparison

| Prototype element | Status / exact handling |
| --- | --- |
| Companies nav and **Today / Recruiters / Companies / Emails / Messages** tabs | Existing TPO section shell; active Recruiters route |
| Heading, actions **Import / Invite / Add recruiter lead** | Import and guarded lead creation retained. Visible Invite opens real existing advanced invite controls; no unsolicited email or simulated invitation |
| **Eight-stage counts** Everyone / Not contacted / In touch / Invited / Joined / Drive planned / Hired from you / Paused | All eight render genuine college-scoped per-stage totals, with stage filtering |
| **Search / Filters / Columns / Export**, count, **Act on all** | Search and Filter operate on the real authorized roster. Six screenshot columns default visible and can be toggled. Export uses existing CSV writer. Act on all selects the filtered visible roster and opens the advanced operation controls, but **never executes a mutation** |
| Six columns recruiter, company, where, next, last contact, handled by | Implemented as compact roster. The penultimate field now comes from the CRM’s contact-only last-contact aggregate (CALL / WHATSAPP / EMAIL / MEETING), separate from generic last-activity facts; absent contact remains an explicit missing value |
| Clicking anywhere in a row selects the recruiter to the right | Source now supports mouse/keyboard row selection, plus name button. Independent of existing bulk checkboxes. No silent substitution of another person for a stale selected ID |
| Right-side panel avatar, name, company, next step, Log activity / Call / Email, joined/last time/company/owner | Existing source-backed inspector; Log activity now deep-links to the actual persisted interaction form. When latest-note/history lacks a safe preview, use explicit record links instead of fictional visit notes |
| Opt-out and outreach permission | Direct email/phone options suppressed for unsubscribed contacts; no undocumented outreach sends |
| Filters, bulk actions, alternate board views and export formats better than prototype | Retained under Advanced, not deleted |
| Exact screenshot styling and live authenticated behavior | **OPEN** — a source/unit CI pass is not a real browser comparison |

## Source integrity constraints

1. Do not seed demo people, screenshot count 12, company names, or falsely-derived verification/trust.
2. Stage summaries are snapshots of the college's persisted recruiter CRM, not global totals or separate authorization scopes.
3. `Act on all N` means **select currently filtered authorized rows** for explicit subsequent choices; it does not send invitations, email or perform status/owner updates.
4. The *Last contact* column must use the per-college persisted outreach aggregate (CALL / WHATSAPP / EMAIL / MEETING), never an unrelated note or administrative activity.
5. The inspector's company-level placed and drive figures remain unavailable when not supported by an authorized linked company record.
6. Selecting/dismissing a row never changes CRM, company trust, job publishing policy or pending invitations.

## Remaining acceptance for true Page 02 closure

- Dedicated source acceptance on the **final** head: strict TypeScript check, updated reviewer unit tests and source contracts; record exact run URL and result.
- Authenticated TPO real-data browser: stage-filter counts and source freshness, row selection via click and keyboard, columns and filter round trips, selected stale row after refresh, importer, invitation with explicit authorization, lead creation, CSV export, opted-out contact, and no cross-tenant leakage.
- Fresh 1440 × 1132 viewport screenshot compared to 2880 × 2264 reference at 2×; ensure no unexpected second global search and that the main table/inspector occupy the same geometry. A mobile responsive screenshot is additional.
- Visual acceptance and real-provider sends/invitation receipt remain separate from static source test.

**Closure label:** CODE IMPLEMENTATION UPDATED; dedicated CI must be checked on the last relevant change. **Visual/browser acceptance not certified.**
