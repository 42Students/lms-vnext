# ci6 packet lane 7: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [x] src/app/(authenticated)/tpo/drive-day/page.tsx:90: white-on-teal
- [x] src/app/(authenticated)/tpo/drive-day/page.tsx:120: white-on-teal
- [x] src/app/(authenticated)/tpo/drive-day/page.tsx:191: white-on-teal
- [x] src/components/admin/college-branding-preview.tsx:229: white-on-teal
- [x] src/components/electives/college-elective-offering-manager.tsx:57: native-popup
- [x] src/components/electives/college-elective-offering-manager.tsx:220: native-popup
- [x] src/components/projects/project-admin-audit-page.tsx:295: white-on-teal
- [x] src/components/ui/input-group.tsx:24: unverified-touch-class
- [x] src/components/ui/input-group.tsx:34: unverified-touch-class
- [x] src/components/ui/input-group.tsx:38: unverified-touch-class
