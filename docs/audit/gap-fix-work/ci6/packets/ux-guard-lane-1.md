# ci6 packet lane 1: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [ ] src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:83: unsafe-target
- [ ] src/app/company-share/[token]/share-code-form.tsx:14: small-touch-target
- [ ] src/components/courses/faculty-course-roster.tsx:151: unverified-touch-class
- [ ] src/components/placements/public-recruiter-join-form.tsx:197: unverified-touch-class
- [ ] src/components/ui/date-input.tsx:314: unverified-touch-class
- [ ] src/components/ui/date-input.tsx:326: unverified-touch-class
- [ ] src/components/ui/date-input.tsx:343: unverified-touch-class
- [ ] src/components/ui/date-input.tsx:367: unverified-touch-class
- [ ] src/components/ui/tabs.tsx:83: unverified-touch-class
- [ ] src/components/ui/tabs.tsx:90: unverified-touch-class
