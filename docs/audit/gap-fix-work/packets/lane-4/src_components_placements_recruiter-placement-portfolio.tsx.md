# Work packet: edit src/components/placements/recruiter-placement-portfolio.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md

## G2-11-003-015  [P1] GAP  facet F03  effort S
- Legacy: Primary Answer only if openRequests >0 `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:219`
- vNext now: Mobile action Answer link always rendered `src/components/placements/recruiter-placement-portfolio.tsx:188`
- Fix: Show Answer only when actionable

## G2-11-003-017  [P1] GAP  facet F03  effort S
- Legacy: Hire again only closed/rejected/cancelled `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:220`
- vNext now: Hire again with changes shown for published too `src/components/placements/recruiter-placement-portfolio.tsx:184`
- Fix: Gate based on completed lifecycle

## G2-11-003-019  [P1] GAP  facet F04  effort S
- Legacy: Row status from driveStatus mapping lifecycle `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:208`
- vNext now: VNext Live or Completed based job status `src/components/placements/recruiter-placement-portfolio.tsx:114`
- Fix: Map waiting/rejected/cancelled status

## G2-11-003-025  [P1] GAP  facet F04  effort S
- Legacy: Next helper derived driveNextAction `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:216`
- vNext now: VNext hard-coded per status/seen counts `src/components/placements/recruiter-placement-portfolio.tsx:164`
- Fix: Map legacy next-action conditions

## G2-11-003-056  [P1] GAP  facet F10  effort S
- Legacy: Legacy toReview count all APPLIED without recruiter current results `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:64`
- vNext now: VNext next-step based sharedApplicants, deadline and offers `src/components/placements/recruiter-placement-portfolio.tsx:78`
- Fix: Recreate toReview count for priority

## G2-11-003-062  [P1] GAP  facet F12  effort M
- Legacy: Open questions are highlighted and sorted to top `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:122`
- vNext now: VNext sorts priority only within current page `src/components/placements/recruiter-placement-portfolio.tsx:50`
- Fix: Apply prioritization before server pagination

## G2-11-003-064  [P1] GAP  facet F12  effort S
- Legacy: Answer action if positive openRequests only `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:219`
- vNext now: Extra Answer link on every mobile row `src/components/placements/recruiter-placement-portfolio.tsx:188`
- Fix: Do not route unanswered rows to empty messages

## G2-11-003-076  [P1] GAP  facet F15  effort S
- Legacy: Next work hint based driveNextAction `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:216`
- vNext now: VNext copied partial logic `src/components/placements/recruiter-placement-portfolio.tsx:164`
- Fix: Map next action accurately

## G2-11-003-081  [P1] GAP  facet F17  effort S
- Legacy: Drive role title keyboard-focusable actual Link `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:204`
- vNext now: VNext heading text not link `src/components/placements/recruiter-placement-portfolio.tsx:120`
- Fix: Make heading Link to details

## G2-11-003-048  [P2] GAP  facet F08  effort S
- Legacy: Row action Open `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:221`
- vNext now: Open hiring flow text `src/components/placements/recruiter-placement-portfolio.tsx:179`
- Fix: Match CTA
