# Work packet: edit src/app/(authenticated)/hr/calendar/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u005-recruiter-calendar.md

## G2-5-005-005  [P1] GAP  facet F02 Layout/section order  effort L
- Legacy: Only days with events rendered as compact AntD Cards in agenda (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:92-124)
- vNext now: Desktop seven-column calendar grid, mobile stacked cards, separate agenda tab (src/app/(authenticated)/hr/calendar/page.tsx:430-560; src/app/(authenticated)/hr/calendar/page.tsx:562-615)
- Fix: Default to seven-day nonempty-day agenda at all widths; move grid to optional mode.

## G2-5-005-017  [P1] GAP  facet F04 Data shown/formatting  effort L
- Legacy: Legacy foldWeek includes slot count in title line (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:115)
- vNext now: Grid renders each interview slot individually (src/modules/placements/recruiter-calendar-model.ts:141-153; src/app/(authenticated)/hr/calendar/page.tsx:514-537)
- Fix: Aggregate slots under parent round for default week view.

## G2-5-005-020  [P1] GAP  facet F05 Tables/lists  effort M
- Legacy: foldWeek collapses slot events into round once with N slots (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:100-120; docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:24-30)
- vNext now: Each slot own event and box, duplicates related round (src/modules/placements/recruiter-calendar-model.ts:141-153; src/app/(authenticated)/hr/calendar/page.tsx:514-537)
- Fix: Use same foldWeek grouping rules to collapse slots.
