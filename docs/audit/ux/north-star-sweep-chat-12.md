# North Star visual sweep — chat-12 (2026-10-19)

**Branch:** `chatgpt/chat-12-b` only. **Source:** `docs/orchestrator/queues/master-queue.md` North Star, `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, and old SCSS from `docs/design/legacy-styles/` (variables, button, form, dropdown, header, common, AntD overrides, typography).

## Required values and boundaries

- Authenticated shell remains owned by chat-17/19/13; do **not** modify `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**`, sidebar or top bar. Use shared tokens/components from those owners instead.
- A **single** white page canvas `#fff`, `1px solid #e5e9f0`, radius 12px, padding 24px on background `#f1f4f9`; ordinary sections use spacing and hairline dividers rather than redundant external cards. Keep genuine independent panels/tables/dialogs.
- Inter headings: h1 30px, 600, `#172033`. Buttons: shared primary `#0a7c88`, white text, 36px tall, radius 9px, weight 650, font-size 14px; minimum mobile tap areas remain accessible. Table/inputs/selects/tabs/status pills follow the shared kit and old SCSS.
- Preserve page contents, placement business logic, legacy wording, query parameters, table structures, and phone layouts. Remove only conflicting visual wrappers. No project code or CI runs.

## Exact file inventory and what to sweep

Every route below: inspect title weight, section nesting, page-level borders/background/padding, local link/button controls, hard-coded Tailwind colours, and table/filter surfaces. Do not change loading/error behaviour. Every component below: normalize local control, table/heading, card/divider and status styles to the shared kit while preserving semantics.

### Student routes (18)

- `src/app/(authenticated)/tpo/students/[membershipId]/history/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/[membershipId]/history/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/students/[membershipId]/participation/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/[membershipId]/participation/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/students/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/students/preparation-plan/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/preparation-plan/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/students/preparation-prep/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/preparation-prep/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/students/requests/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/requests/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/students/requests/page.tsx` — check page header, redundant section cards, buttons, fields and tables.

### Engage/recruiter routes (21)

- `src/app/(authenticated)/tpo/recruiters/[leadId]/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/[leadId]/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/recruiters/campaigns/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/new/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/new/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/recruiters/campaigns/preview/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/preview/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/campaigns/preview/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/recruiters/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/recruiters/page.tsx` — check page header, redundant section cards, buttons, fields and tables.

### Companies routes (22)

- `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/companies/[companyId]/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/feedback/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/feedback/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/companies/[companyId]/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/manage/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/manage/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/companies/[companyId]/people/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/people/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/companies/archived/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/archived/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/archived/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/companies/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/companies/page.tsx` — check page header, redundant section cards, buttons, fields and tables.

### Team and requests routes (13)

- `src/app/(authenticated)/tpo/requests/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/requests/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/requests/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/team/[threadId]/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/team/[threadId]/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/team/[threadId]/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/team/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/team/everyone/error.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/team/everyone/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/team/everyone/page.tsx` — check page header, redundant section cards, buttons, fields and tables.
- `src/app/(authenticated)/tpo/team/loading.tsx` — check state surface and inherited tokens.
- `src/app/(authenticated)/tpo/team/page.tsx` — check page header, redundant section cards, buttons, fields and tables.

### Owned TPO components (56)

- `src/components/tpo/recruiter-bulk-invite-controls.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-bulk-owner-controls.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-bulk-stage-controls.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-inline-owner.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-inline-stage.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-invite-landing.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-lead-csv-import.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-lead-detail-workspace.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-leads-workspace.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-roster-display-controls.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/recruiter-saved-view-controls.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-academic-import-preview.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-academic-import-workspace.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-after-college-bulk-editor.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-after-college-editor.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-bulk-action-panel.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-bulk-action-preview.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-company-create-form.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-company-memory-workspace.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-company-team-composer.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-company-team-conversation.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-company-visibility-editor.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-debounced-student-search.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-everyone-controls.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-grid-column-chooser.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-grid-filter-panel.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-new-recruiter-conversation.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-participation-decision-form.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-roster-verification-bulk.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-selected-review-queue.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-spreadsheet-grid.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-student-clipboard-actions.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-student-note-editor.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-student-nudge-panel.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-student-outcome-pill.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-student-quick-panel.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-student-saved-views.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-students-assign-prep.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-students-bulk-add.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-students-bulk-debar.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-students-drive-visibility.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-students-selection.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-students-spreadsheet.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-ask-panel.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-assign-unowned.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-away-form.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-decision-toggle.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-follow-controls.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-forms.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-handover.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-message-actions.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-message-scroll.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-open-read.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-rename.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-search.tsx` — check local controls, typography, colour and borders.
- `src/components/tpo/tpo-team-thread-details.tsx` — check local controls, typography, colour and borders.

### Global requests components (5)

- `src/components/placements/tpo-general-requests-panel.tsx` — check local controls, typography, colour and borders.
- `src/components/placements/tpo-request-decision-control.tsx` — check local controls, typography, colour and borders.
- `src/components/placements/tpo-request-bulk-decision.tsx` — check local controls, typography, colour and borders.
- `src/components/placements/tpo-sequential-request-review.tsx` — check local controls, typography, colour and borders.
- `src/components/placements/tpo-request-page-clipboard.tsx` — check local controls, typography, colour and borders.

## Source-level priority fixes

1. Students: `students/page.tsx` full-page filter forms and nested `rounded-xl border bg-surface` cards; roster spreadsheet/grid/status components; student history, participation and student requests.
2. Engage: `recruiter-leads-workspace.tsx` local `inputStyle`, `buttonStyle`, `primaryStyle` class strings and its table/board/company views; recruiters page and campaign routes. Keep all tabs and saved views.
3. Companies: `companies/page.tsx` form/filter areas and a primary button that currently combines `bg-primary` with `text-foreground`; detail/contact/team/archived views and local company components.
4. Team: `team/page.tsx` repeated bordered member/conversation item cards and local tab links; thread, everyone and company message pages, composer/handovers/forms.
5. Requests: `requests/page.tsx` repeat borders around ordinary sections, links/filters, decision panels; retain urgent-status behaviour.

## Completion checks

- [x] All 135 inventoried source files reviewed for local className/token mismatches (74 routes/states, 56 TPO components and five Requests components). Only files with mismatches were changed. Runtime visual verification remains separate.
- [x] Corrected identified dark-on-teal primary labels to `text-on-primary`, normalized local actionable control radii to measured 9px, and retained shared primary tokens.
- [x] Removed redundant enclosing cards from main roster, CRM, Team and Requests sections and toolbar/forms; retained table groups, alerts, status panels and one-time invite links.
- [x] Authored edits are confined to visual classes/section presentation; page copy, actions, permissions, data and table field definitions were not intentionally changed.
- [x] Changes kept within JSX string classes / opening tags, with no logic edits. TypeScript, dev app and CI/tests intentionally **not executed**; no compile or screenshot assertion is made.

## Execution report (2026-10-19)

- GitHub branch `chatgpt/chat-12-b` was fast-forwarded from main first; after other lanes updated main, a two-parent merge reconciled newer shared canvas/UI changes while retaining this lane's edits. All writes were directed to chat-12's branch.
- Current branch diff against main: **62 touched source files**; GitHub comparison 44 commits ahead / 0 behind at documentation update time (other lanes may keep advancing main).
- Headings: the shared `PageHeader` inherited from chat-17 now supplies Inter-scale 30px desktop h1 and `#172033`; patched standalone Recruiter leads and Companies invalid-filter titles. Student spreadsheet header now follows the neutral legacy table strip.
- Students: flattened first-party filter/tool sections, retained independent branch-intelligence table; availability warnings use a pale-yellow tokenized strip.
- Engage: normalized roster controls and needs/filters/toolbars; reconciled recruiter campaign pages with newer main changes.
- Companies: primary contrast fix, flatter detail and memory sections; preserved independent directory/status/list panels.
- Team and Requests: member/request rows use hairline dividers instead of per-row cards; decision/compose/edit controls share legacy radii and colors.
- **Intentional exceptions:** bordered alerts, unavailable-data banners, one-time invite link, modal/dialog internals and genuinely separate tables/panels keep their visual boundaries. Existing 44px minimum touch targets were retained where already present even though the measured desktop control height is 36px.
- **Cross-lane follow-up:** `src/app/(authenticated)/tpo/layout.tsx` still renders a TPO quick-access strip; reconcile duplication with the global top bar through chat-13's shell ownership rather than editing this shared portal layout from the chat-12 slice.
- **Not verified:** rendered screenshots against the running old LMS and full CI/typechecking were intentionally not performed (per owner instructions). Source sweep does not establish pixel-perfect parity by itself.
