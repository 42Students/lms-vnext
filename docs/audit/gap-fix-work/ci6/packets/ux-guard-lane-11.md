# ci6 packet lane 11: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [ ] src/app/(authenticated)/tracker/mine/[publicId]/page.tsx:59: unsafe-target
- [ ] src/components/college/college-course-retake-action.tsx:22: native-popup
- [ ] src/components/people/faculty-profile-attachments.tsx:100: native-popup
- [ ] src/components/people/faculty-profile-attachments.tsx:149: unsafe-target
- [ ] src/components/projects/project-workspace.tsx:1930: unsafe-target
- [ ] src/components/projects/project-workspace.tsx:1940: unsafe-target
- [ ] src/components/projects/project-workspace.tsx:2335: unsafe-target
- [ ] src/components/ui/page-back-link.tsx:21: unverified-touch-class
