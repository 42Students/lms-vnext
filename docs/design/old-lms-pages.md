# Old LMS page anatomy (observed live on the local legacy stack, TPO portal, 2026-10-19)

Goal (owner, north star): vNext must look the same as the old LMS so stakeholders do not see "a new app" and trust is kept. Companion files: `old-lms-shell-spec.md` (measurements) and `old-lms-shell.css` (exact shell rules).

## Shared page anatomy (every TPO page followed this)
1. One white canvas (radius 12, 1px #e5e9f0 border, padding 24) on the #f1f4f9 shell background. No per-section cards for ordinary content.
2. Page head on ONE row: bold title (h1 ~30px, weight 600, color #172033) with a one-line grey subtitle right next to it, and the page's primary action(s) aligned top-right ("Import" secondary + "+ Add recruiter lead" primary; "+ Create drive"; "Import academic details").
3. "Needs doing:" row of small pill chips (counts, e.g. "Waiting for your review 1", "Live with no deadline 1", "Follow-ups due 2") under the head; they act as quick filters.
4. Tabs with counts directly on the canvas (Requests 1 / Drafts 2 / Live 2 / Closed 6; Table / Board / Companies (11) / Emails) with a teal underline for the active tab.
5. A list toolbar: search box with button, then "Filters", "Views", "Columns", "Export" as small outlined buttons; below it a "N items in this view" strip with an "Act on all N" action.
6. Tables sit directly on the canvas inside a hairline-bordered area; hairline row separators, compact rows, checkbox column, status shown as small coloured pills ("Needs your review", "Registered", "Looking for a job", "Not verified").
7. Banners are slim pale-yellow strips with an info dot, one sentence, and an outlined action button ("Open Placement eligibility").
8. Funnels/summary strips: one light-bordered strip with big numbers, small captions and tiny arrows between steps ("51 In placements > 40 Registered > 40 Applying > 6 Placed"), with small amber "n not ..." pills between steps.
9. Cards appear ONLY for genuinely separate objects: the "Next up" panel and grouped row list on Home; report option tiles (Placement summary, By branch, By company, Packages...) on Reports. Section headings on Reports have a short grey explanation line under them.

## Pages seen
- Home: date line, greeting "Good morning, NSRIT", "Four things need you today.", left "Next up" panel with one primary action, right grouped list of 7 rows (icon, title, one-line detail, amber "Needs you" pill, chevron).
- Students: head + "Import academic details"; yellow banner; four filter selects (batches, programs, departments, classes); journey funnel strip; toolbar; table (Student, Roll no., Batch, Branch, Stage, After college, Profile) with column filter icons.
- Engage: head + Import + "Add recruiter lead"; "Needs doing" chips; tabs; toolbar; table (Contact, Status, Stage, Company, Flags, Owner, Last activity).
- Drives: head + "Create drive"; chips; tabs with counts; toolbar; table (Drive, Job type, Pay, Applied, Deadline, Status, row menu).
- Reports: head; funnel strip; sections "Overview and performance", "Offers, joining and readiness gaps" with explanation lines and card tiles.

## Behaviour notes
- Sidebar: icon rail that expands on hover (see spec); active item has a 3px teal inset bar and tinted background; group headings appear only when expanded.
- Top bar: command search with Ctrl K hint, "+ New" primary, Messages and Notifications icon buttons with red count badges, organisation name, circular initials avatar.
- First visit to a page in dev mode shows a small dotted spinner while the page compiles; not relevant to the UI spec.
