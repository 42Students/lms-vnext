# ci6 packet lane 15: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [x] src/app/college-join/[token]/loading.tsx:6: unverified-touch-class
- [x] src/components/courses/admin-course-overview.tsx:104: unsafe-target
- [x] src/components/placements/learner-application-resume-link.tsx:30: unsafe-target
- [x] src/components/tpo/tpo-companies-spreadsheet.tsx:64: unsafe-target
- [x] src/components/ui/scroll-cue.tsx:66: unverified-touch-class
