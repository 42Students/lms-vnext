# ci6 packet lane 20: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [x] src/app/company-share/[token]/page.tsx:26: unverified-touch-class
- [x] src/app/company-share/[token]/page.tsx:31: unverified-touch-class
- [x] src/app/company-share/[token]/page.tsx:44: unverified-touch-class
- [x] src/app/company-share/[token]/page.tsx:65: unsafe-target
- [x] src/components/courses/faculty-course-item-viewer.tsx:36: unsafe-target
- [x] src/components/placements/public-join-preview-retry.tsx:11: unverified-touch-class
- [x] src/components/ui/button.tsx:29: unverified-touch-class
- [x] src/components/ui/status-badge.tsx:42: unverified-touch-class
