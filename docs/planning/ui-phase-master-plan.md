# UI Phase Master Plan — Exact Clone Parity

**Owner:** Full ownership delegated — every decision made per this document, no exceptions.
**Standard:** vNext must be pixel-identical to legacy LMS. Zero invented UI. Zero "good enough".
**Frozen legacy SHA:** `83347e29b1f5c66d497dc5d99060e098338b382f` (lms-dev-2026-frontend HEAD)

---

## Mandate

vNext UI is an **exact clone** of the legacy LMS — not an approximation, not a redesign, not "inspired by". Every pixel, every string, every flow must match. If the legacy LMS has a bug or an ugly UI, vNext ships that same bug and ugly UI. The goal is zero user surprise at switchover.

---

## What "done" means for a UI surface

A surface is DONE when ALL of the following pass in CI:

1. **File exists** — `page.tsx` / modal component / form component exists at the correct path
2. **Route resolves** — navigating to the URL renders the correct component, not a 404
3. **Visual parity** — Playwright screenshot of vNext matches legacy screenshot (diff < 0.5% pixel variance)
4. **String parity** — every string on the surface matches the legacy string catalogue exactly
5. **Role gate** — correct roles can access it; wrong roles get the correct error/redirect
6. **Data loads** — real data from the dev DB appears (not empty, not mocked)
7. **All modals open** — every modal trigger (button click, row click, icon) opens the correct modal
8. **All forms submit** — every form submits and produces the correct DB change + success toast
9. **Empty state** — correct empty state shows when there is no data
10. **Error state** — API error produces correct error message/toast (not a blank screen or JS error)
11. **Mobile** — page renders correctly at 375px width (no overflow, no broken layout)
12. **Loading** — skeleton/spinner shows during data fetch (no flash of empty content)

A surface with 11/12 is NOT done. All 12 must pass.

---

## Surface types — exhaustive taxonomy

Every surface in the legacy LMS falls into one of these types. Every type has a defined acceptance checklist.

### TYPE-1: List Page
A page showing a table/grid of records.
- [ ] Table has exact same columns as legacy (same order, same headers)
- [ ] Each column has same data type rendering (date format, truncation, badges)
- [ ] Sort — same default sort column and direction
- [ ] Pagination — same page size default, same controls
- [ ] Search/filter — same filter fields, same placeholder text
- [ ] Row actions — same action buttons/icons per row (edit, delete, view, etc.)
- [ ] Bulk actions — same checkboxes, same bulk action buttons
- [ ] Empty state — same empty state message and illustration
- [ ] Loading state — skeleton rows during fetch
- [ ] "Add new" button — same label, same position (top-right vs inline)

### TYPE-2: Detail/View Page
A page showing a single record's full details.
- [ ] Same section layout (same sections in same order)
- [ ] Same field labels and values
- [ ] Same action buttons (Edit, Delete, Back, etc.) with exact same labels
- [ ] Same tabs (if tabbed) — same tab labels in same order
- [ ] Same related sub-tables (same columns)
- [ ] Breadcrumbs match legacy

### TYPE-3: Create/Edit Form (inline page)
A full-page form for creating or editing a record.
- [ ] Same fields in same order
- [ ] Same field labels (exact string match)
- [ ] Same field types (text/select/date/multiselect/radio/checkbox)
- [ ] Same placeholder text
- [ ] Same validation rules (required, min/max, pattern)
- [ ] Same validation error messages (exact string match)
- [ ] Same submit button label
- [ ] Same cancel behaviour (goes back to same previous page)
- [ ] Same success toast message (exact string match)
- [ ] Same error toast message (exact string match)

### TYPE-4: Modal (create/edit/confirm/detail)
A dialog opened by clicking a button/row/icon.
- [ ] Same trigger — same button label/icon that opens it
- [ ] Same modal title (exact string)
- [ ] Same fields (same order, same labels, same types)
- [ ] Same placeholder text
- [ ] Same confirm button label
- [ ] Same cancel button label
- [ ] Same validation messages
- [ ] Same success/error toast after submission
- [ ] Modal closes correctly on success
- [ ] Modal stays open on validation error
- [ ] Clicking outside / pressing Escape closes it (if legacy does)

### TYPE-5: Confirmation Dialog
A simple "Are you sure?" dialog.
- [ ] Same title
- [ ] Same body text (exact string — often includes the item name)
- [ ] Same confirm button label (often "Delete", "Remove", "Confirm")
- [ ] Same cancel button label
- [ ] Same consequence (what happens after confirm)
- [ ] Same error handling if action fails

### TYPE-6: Dashboard/Home Page
A page with widgets, counts, charts, quick-links.
- [ ] Same widgets in same layout positions
- [ ] Same widget titles
- [ ] Same count/metric labels
- [ ] Same quick-link items
- [ ] Same chart types (if any)
- [ ] Same "recent activity" items (same format)

### TYPE-7: Empty State
Shown when a list/section has no data.
- [ ] Same illustration (or no illustration if legacy has none)
- [ ] Same heading text
- [ ] Same subtext
- [ ] Same CTA button (if any) with same label

### TYPE-8: Error/Permission State
Shown when user lacks access or an error occurs.
- [ ] Same error message text
- [ ] Same redirect destination
- [ ] 403 shows correct "not authorized" message
- [ ] 404 shows correct "not found" message

### TYPE-9: Navigation
Sidebar, topbar, breadcrumbs.
- [ ] Same sidebar items per role (same labels, same icons, same order)
- [ ] Same active state styling
- [ ] Same nested/expandable sections
- [ ] Same topbar (profile menu, notifications bell, etc.)
- [ ] Same breadcrumb format
- [ ] Mobile: same hamburger menu behaviour

### TYPE-10: Notification/Toast
Success, error, warning toasts triggered by actions.
- [ ] Same position on screen
- [ ] Same duration
- [ ] Same message text for every action (exact strings catalogued)

---

## Role matrix — surfaces per role

Every surface is tagged with which role(s) can access it. The role matrix must be complete before any implementation starts.

| Role | Legacy pages | Key domains |
|------|-------------|-------------|
| SuperAdmin | 113 pages | College management, tenant setup, global settings, all admin sections |
| College Admin | 59 pages | Batches, programs, courses, assignments, schedule, attendance, grades |
| Faculty/Mentor | 13 pages | My courses, attendance marking, grade entry, schedule |
| Learner | 19 pages | Dashboard, courses, assignments, placements, profile, groups |
| TPO | 9 pages | Placement drives, job postings, student tracking, company CRM |
| HR/Recruiter | 3 pages | Company portal, job browsing, applications |
| Public/Auth | ~50 pages | Login, signup, forgot password, OTP, shared |
| **Total** | **~266 legacy pages** | |

**vNext page.tsx count: 596** (562 authenticated) — must all be reconciled.

**Surface multiplier:** each page typically has 3-8 additional surfaces (modals, forms, drawers, empty states). Estimated total surfaces: **~800–1200**.

**Legacy framework:** Next.js Pages Router, React, Redux, Ant Design
**vNext framework:** Next.js App Router, React 19, Jotai, Tailwind

**Shared sections pattern:** 113 superadmin + 59 college-admin pages share ~47 section components (Batches.js, Programs.js, etc.) — both role variants must be tested separately even when they share the component.

**Existing legacy audit docs (goldmines — read before implementing each domain):**
- `COLOR_AUDIT.md` — color system
- `COURSE_UI_AUDIT_FINDINGS.md` — known course UI gaps
- `NOTIFICATION_DRAWER_AUDIT.md` — notification drawer
- `DESIGN-SYSTEM-BLUEPRINT.md` — design system reference
- `LEARNER_MODULE_AUDIT_REPORT.md` — learner module
- `MY-PLACEMENTS-CSS-AUDIT.md` — placements CSS

---

## String catalogue — mandatory

Every string in the legacy LMS UI must be extracted and catalogued before implementation begins. No vNext string may differ from the catalogue.

Format: `docs/planning/ui-strings-{domain}.json`
```json
{
  "domain": "academics",
  "frozenLegacySha": "...",
  "strings": {
    "batch.list.title": "Batches",
    "batch.list.addButton": "Add Batch",
    "batch.list.emptyState": "No batches found",
    "batch.create.modalTitle": "Create Batch",
    "batch.create.nameLabel": "Batch Name",
    "batch.create.namePlaceholder": "Enter batch name",
    "batch.create.successToast": "Batch created successfully",
    "batch.delete.confirmTitle": "Delete Batch",
    "batch.delete.confirmBody": "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.",
    "batch.delete.confirmButton": "Delete",
    "batch.delete.successToast": "Batch deleted successfully"
  }
}
```

String catalogue files are the **single source of truth** for all UI text. Tests must verify vNext component text matches the catalogue exactly.

---

## Visual snapshot protocol

CI uses Playwright for visual snapshots. Protocol:

1. **Legacy screenshots** taken at SHA freeze time, stored in `tests/ui-snapshots/legacy/`
2. **vNext screenshots** taken at test run time, compared against legacy
3. **Diff threshold:** < 0.5% pixel variance (allows for antialiasing differences)
4. **Viewport:** 1440×900 desktop (primary) + 375×812 mobile (secondary)
5. **State:** authenticated as the correct role, with seed data loaded
6. **Coverage:** full-page screenshot + cropped screenshots for each modal/form

---

## Milestone structure (UI-01 through UI-10)

Each milestone covers one domain, matching the API milestones exactly.

### Per-milestone deliverables (ALL required before done=true)

**P01 — Surface inventory JSON**
File: `docs/planning/ui-inventory-ui{XX}.json`
Contains every surface in this domain: route, role, type (LIST/DETAIL/FORM/MODAL/etc.), legacy component path, vNext page.tsx path, disposition (MATCHED/REDESIGNED/MISSING), surface count.

**P02 — String catalogue JSON**
File: `docs/planning/ui-strings-ui{XX}.json`
Every string for every surface in this domain, extracted from legacy source code.

**P03 — Source parity test**
File: `tests/ui{XX}-source-parity.test.mjs`
Node:test, no browser needed:
- Every MATCHED surface has a vNextPath that exists on disk
- Every string in catalogue has a corresponding usage in vNext component files
- Every modal trigger button has the correct label
- Every form field has the correct label
- Route guard covers the correct roles

**P04 — Playwright visual parity test**
File: `tests/ui{XX}-visual-parity.spec.ts`
Playwright test:
- Navigate to every surface as each role
- Screenshot and diff against legacy snapshot
- Assert < 0.5% pixel variance
- Assert all modals open and match
- Assert all forms submit and show correct toast

**P05 — CI workflow**
File: `.github/workflows/ui{XX}-parity.yml`
Runs P03 (source-only, fast) + P04 (Playwright, needs app running).

**Acceptance evidence:**
- kind: `EXECUTED_EXACT_CLONE_VISUAL_PARITY_UI_{XX}`
- Must include: commitSha, runUrl, jobId, surfaceCount, missingCount, visualDiffMaxPercent

---

## Milestones

### UI-01: Auth, admin shell, tenant setup
**Surfaces:** Login page, OTP page, Forgot password, College selection screen, SuperAdmin dashboard, College management CRUD, Tenant domain management, Feature flags page, User impersonation flow
**Roles:** Public, SuperAdmin
**Depends on:** API-01

### UI-02: Academics — batches, programs, schedule
**Surfaces:** Batch list/create/edit/delete, Program list/create/edit, Semester management, Class schedule grid, Lecture hall management, Department list, Group management (admin + learner views), Elective selection
**Roles:** Admin, Learner
**Depends on:** API-02

### UI-03: Learner & faculty profiles
**Surfaces:** Learner profile view/edit, Profile sections (education, experience, skills, documents), Faculty profile, Profile verification workflow, Photo upload, Document upload, Learner directory
**Roles:** Learner, Faculty, Admin
**Depends on:** API-03

### UI-04: Courses & content
**Surfaces:** Course list/detail, Lesson list/player, Content editor (faculty), Course enrollment, Progress tracking, Resource library, Skill tags, Bulk course import UI
**Roles:** Admin, Faculty, Learner
**Depends on:** API-04

### UI-05: Assignments, quizzes, attendance
**Surfaces:** Assignment list/create/edit/submit, Quiz builder/attempt/review, Attendance marking (faculty), Attendance view (learner), Grade entry, Gradebook, Attendance policy management
**Roles:** Admin, Faculty, Learner
**Depends on:** API-05

### UI-06: Projects & mentorship
**Surfaces:** Project workspace, Project submission, Template library, Mentor assignment, Mentor dashboard, Project history, Comment threads, File attachments
**Roles:** Admin, Faculty, Learner
**Depends on:** API-06

### UI-07: Placements — learner & admin
**Surfaces:** Job listings, Apply flow, Application status, Offer management, Placement drive list, Drive registration, Company profiles, Interview schedule, Placement stats dashboard
**Roles:** Learner, Admin, TPO
**Depends on:** API-07

### UI-08: TPO & recruiter CRM
**Surfaces:** TPO dashboard, Student tracking hub, HR access portal, Company CRM, Drive creation wizard, Eligibility criteria builder, Communication log, Placement analytics
**Roles:** TPO, HR/Recruiter
**Depends on:** API-08

### UI-09: Notifications & operations
**Surfaces:** Notification bell/drawer, Announcement list/detail, Notification preferences, SMS log (admin), Announcement pin/unpin, Discussion threads (course-scoped), Skill catalogue
**Roles:** All roles
**Depends on:** API-09

### UI-10: Global visual regression & clone certification
**Surfaces:** Cross-cutting — navigation consistency, mobile layout for all milestones, permission boundary enforcement, 404/403 pages, loading states global audit
**Roles:** All roles
**Depends on:** UI-01 through UI-09
**This is the final gate. API-10 equivalent. Must pass before UI phase is closed.**

---

## What MISSING means

If a surface is MISSING in vNext it must be **built** before the milestone can close. The UI phase does not accept MISSING surfaces as "documented gaps" the way the API crosswalk phase did. Every surface must exist. No exceptions.

If a surface is MISSING, the milestone is blocked until it is built and passes visual parity.

---

## CI gate structure per milestone

```
UI{XX}-P03 (source parity, no browser) — runs on every push
  ↓ passes
UI{XX}-P04 (Playwright visual, needs app) — runs on PR or manual trigger
  ↓ passes
Milestone marked done in tracker
```

P03 is fast (< 30s), runs always.
P04 is slow (2-5 min per milestone), runs on demand or nightly.

---

## Acceptance criteria — the bar

A milestone is done when:
- [ ] UI inventory JSON exists with every surface catalogued
- [ ] String catalogue JSON exists with every string extracted from legacy
- [ ] Zero MISSING surfaces (every surface in inventory has a vNext file on disk)
- [ ] Source parity test passes in CI (P03 green)
- [ ] Playwright visual parity test passes in CI (P04 green)
- [ ] Max pixel diff < 0.5% on every surface
- [ ] Every modal opens and matches legacy screenshot
- [ ] Every form submits and shows correct toast (exact string match)
- [ ] Correct roles enforced (403 for wrong role)
- [ ] Mobile layout verified at 375px
- [ ] Evidence recorded in tracker.json with real CI run URL and SHA

---

## What is explicitly NOT allowed

- "Close enough" visual matches — must be < 0.5% diff
- Invented UI (new patterns not in legacy) — copy legacy exactly
- Reworded strings — copy legacy strings verbatim
- Missing modals — every modal in legacy must exist in vNext
- Skipped empty states — every empty state must match
- Skipped error states — every error message must match
- "We'll fix it later" deferrals — nothing is deferrable in the UI phase

---

## Tools

- **Playwright** — visual snapshots, browser automation
- **pixelmatch** — pixel-level diff (already in devDependencies or add it)
- **node:test** — source parity tests (no browser)
- **Vitest** — component-level tests if needed
- **bun dev** — dev server for Playwright tests (port 8080 per CLAUDE.md)

---

## Execution order

1. Run full legacy UI surface inventory (all milestones in parallel)
2. Extract string catalogues (all milestones in parallel)
3. Build any MISSING surfaces (parallel per domain)
4. Run source parity tests (P03) per milestone
5. Run Playwright visual parity (P04) per milestone
6. Fix any diffs > 0.5%
7. Close milestones sequentially (UI-01 first, UI-10 last)
8. UI phase certified

**Target: zero pixel diff. Zero missing strings. Zero missing surfaces.**
