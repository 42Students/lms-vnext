# Work packet: NEW / MISSING items from docs/audit/gap2/lane-14/l18-u029-semester-management.md

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l18-u029-semester-management.md

## G2-18-029-002  [P1] GAP  facet F02  effort M
- Legacy: Row gutter24: Create Card lg10, Semesters Card lg14 (legacy:408-465)
- vNext now: New stacked create disclosure and separate filter/table blocks (page:85-152)
- Fix: Restore 10/14 side-by-side card layout at lg, stack below breakpoint

## G2-18-029-005  [P1] GAP  facet F05  effort M
- Legacy: Inline table-card filter program select 200px, Search semesters, Refresh and CSV (legacy:462-505)
- vNext now: Separate advanced search/filter and toolbar sections (page:89-133)
- Fix: Recreate compact tools in list card header, including search placeholder

## G2-18-029-006  [P1] GAP  facet F06  effort M
- Legacy: Always-visible Create New Semester card, form Program/Number/Name, plus Create button (legacy:410-458)
- vNext now: Collapsible details, two-column form without plus icon (create-control:72-110)
- Fix: Open by default in bordered card, vertical fields and plus icon

## G2-18-029-007  [P1] MISSING  facet F07  effort M
- Legacy: Required messages plus red Alert with server field mappings and Retry delete (legacy:168-207,506-516)
- vNext now: Zod first error only and status notices without retry (create-control:44-70,149-165)
- Fix: Field-level errors, red alert headings, sticky failed-record Retry delete

## G2-18-029-013  [P1] GAP  facet F13  effort M
- Legacy: Stale request epoch, same-scope last data preserved on refresh error, separate program/list retries (legacy:61-158,518-532)
- vNext now: Server fetch failure renders whole-page Semesters unavailable ErrorState (page:65-79)
- Fix: Retain old same-scope rows and warning Couldn't refresh semesters

## G2-18-029-016  [P1] GAP  facet F16  effort M
- Legacy: XS full cards, LG 10/14, form Number half-width at sm, table max-content scroll (legacy:408-439,538)
- vNext now: New vertically stacked page, create md two-column (page:85-152; create-control:77-110)
- Fix: Apply old breakpoints and mobile horizontal table overflow

## G2-18-029-008  [P2] GAP  facet F08  effort S
- Legacy: Create success sets selectedProgram and refreshes scoped rows, exact toast (legacy:187-198)
- vNext now: Same copied success text but only reset name + router.refresh (create-control:60-68)
- Fix: After create select its program for visible new row; preserve toast
