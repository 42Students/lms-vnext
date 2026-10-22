# ci6 packet lane 2: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [ ] src/app/(authenticated)/admin/companies/page.tsx:89: unsafe-target
- [ ] src/app/(authenticated)/admin/companies/page.tsx:110: unsafe-target
- [ ] src/app/(authenticated)/admin/companies/page.tsx:133: unsafe-target
- [ ] src/app/home/page.tsx:107: small-touch-target
- [ ] src/components/courses/faculty-submission-file-review.tsx:124: unsafe-target
- [ ] src/components/placements/tpo-accreditation-export-preflight.tsx:21: white-on-teal
- [ ] src/components/placements/tpo-accreditation-export-preflight.tsx:32: white-on-teal
- [ ] src/components/ui/dialog.tsx:71: small-touch-target
- [ ] src/components/ui/textarea.tsx:22: unverified-touch-class
