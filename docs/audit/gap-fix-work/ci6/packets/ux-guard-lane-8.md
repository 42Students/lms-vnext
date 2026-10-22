# ci6 packet lane 8: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [ ] src/app/(authenticated)/tpo/reports/branch-season/page.tsx:43: white-on-teal
- [ ] src/components/admin/managed-college-subdomain.tsx:135: unsafe-target
- [ ] src/components/hr/hr-drive-draft-form.tsx:257: native-popup
- [ ] src/components/hr/hr-drive-draft-form.tsx:845: unsafe-target
- [ ] src/components/projects/project-readiness-override-form.tsx:139: white-on-teal
- [ ] src/components/ui/input.tsx:21: unverified-touch-class
