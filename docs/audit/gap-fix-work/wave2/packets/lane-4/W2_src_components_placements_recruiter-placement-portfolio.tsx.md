# Work packet (wave 2): edit src/components/placements/recruiter-placement-portfolio.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md

## G2-11-003-008  [P2] GAP  facet F02  effort S
- Legacy: Every row independent hoverable Ant Card `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:195`
- vNext now: Desktop AG Grid / mobile border-bottom article `src/components/placements/recruiter-placement-portfolio.tsx:99`
- Fix: Use legacy cards, hover and action placement

## G2-11-003-016  [P2] GAP  facet F03  effort S
- Legacy: Button Open `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:221`
- vNext now: CTA Open hiring flow `src/components/placements/recruiter-placement-portfolio.tsx:179`
- Fix: Use exact Open

## G2-11-003-020  [P2] GAP  facet F04  effort S
- Legacy: Show CTC only when truthy `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:209`
- vNext now: VNext CTC not specified placeholder `src/components/placements/recruiter-placement-portfolio.tsx:134`
- Fix: Suppress absent pay field

## G2-11-003-021  [P2] GAP  facet F04  effort S
- Legacy: If missing applicants display Applicants unavailable `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:210`
- vNext now: VNext 0 shared applicants `src/components/placements/recruiter-placement-portfolio.tsx:150`
- Fix: Differentiate unknown from numeric zero

## G2-11-003-022  [P2] GAP  facet F04  effort S
- Legacy: Only show offers if >0 `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:211`
- vNext now: VNext always shows n offers incl zero `src/components/placements/recruiter-placement-portfolio.tsx:155`
- Fix: Conditional count

## G2-11-003-023  [P2] GAP  facet F04  effort S
- Legacy: Open questions copy The placement cell asked about N things `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:214`
- vNext now: VNext Answer N open requests arrow `src/components/placements/recruiter-placement-portfolio.tsx:161`
- Fix: Restore warning sentence

## G2-11-003-061  [P2] GAP  facet F11  effort S
- Legacy: Title is keyboard-focusable Link `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:205`
- vNext now: VNext Open hiring flow link, heading not itself linked `src/components/placements/recruiter-placement-portfolio.tsx:174`
- Fix: Link the drive role heading

## G2-11-003-063  [P2] GAP  facet F12  effort S
- Legacy: Row card clickable and title link separately accessible `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:200`
- vNext now: vNext article not clickable, Open link separately `src/components/placements/recruiter-placement-portfolio.tsx:99`
- Fix: Restore card affordance without nested links

## G2-11-003-075  [P2] GAP  facet F15  effort S
- Legacy: Open question attention warning displayed in list `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:214`
- vNext now: VNext Answer n open requests callout `src/components/placements/recruiter-placement-portfolio.tsx:161`
- Fix: Exact warning wording

## G2-11-003-078  [P2] GAP  facet F16  effort S
- Legacy: Legacy row cards vertical single column at all widths `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:202`
- vNext now: VNext AG Grid sheet desktop and cards mobile `src/components/placements/recruiter-placement-portfolio.tsx:94`
- Fix: Use cards on tablet/desktop

## G2-11-003-079  [P2] GAP  facet F16  effort S
- Legacy: Button action cluster alongside card text `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:219`
- vNext now: VNext nav links under mobile article `src/components/placements/recruiter-placement-portfolio.tsx:182`
- Fix: Align action grouping

## G2-11-003-084  [P2] GAP  facet F17  effort S
- Legacy: Hoverable entire card with click handler `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:195`
- vNext now: Article with link, no whole-row click `src/components/placements/recruiter-placement-portfolio.tsx:99`
- Fix: Match mouse affordance without trap

## G2-11-003-089  [P2] GAP  facet F18  effort S
- Legacy: Copy placement cell asked about N things `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:214`
- vNext now: Answer N open requests `src/components/placements/recruiter-placement-portfolio.tsx:161`
- Fix: Exact copy

## G2-11-003-090  [P2] GAP  facet F18  effort S
- Legacy: Next: status-derived detail sentence `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:216`
- vNext now: Next: synthetic available-path sentence `src/components/placements/recruiter-placement-portfolio.tsx:164`
- Fix: Exact status copy
