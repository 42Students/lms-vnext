# ci6 packet lane 4: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [ ] src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:119: unsafe-target
- [ ] src/components/academics/learner-class-schedule.tsx:788: unverified-touch-class
- [ ] src/components/courses/lesson-resource-materials-control.tsx:57: native-popup
- [ ] src/components/placements/tpo-week-hour-calendar.tsx:209: unverified-touch-class
- [ ] src/components/ui/drawer.tsx:63: unverified-touch-class
- [ ] src/components/ui/drawer.tsx:70: unverified-touch-class
