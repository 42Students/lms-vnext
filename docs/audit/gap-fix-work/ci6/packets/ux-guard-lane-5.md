# ci6 packet lane 5: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [x] src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:151: unsafe-target
- [x] src/components/activity/learner-notifications-inbox.tsx:340: unsafe-target
- [x] src/components/courses/super-admin-content-actions.tsx:120: native-popup
- [x] src/components/projects/college-project-delivery-overview.tsx:91: unsafe-target
- [x] src/components/projects/college-project-delivery-overview.tsx:92: unsafe-target
- [x] src/components/projects/college-project-delivery-overview.tsx:93: unsafe-target
- [x] src/components/projects/college-project-delivery-overview.tsx:105: unsafe-target
- [x] src/components/ui/dropdown.tsx:124: unverified-touch-class
