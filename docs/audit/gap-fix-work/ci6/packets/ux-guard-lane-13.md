# ci6 packet lane 13: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [x] src/app/campaign-unsubscribe/confirmed/loading.tsx:5: unverified-touch-class
- [x] src/components/college/college-student-bulk-module-access.tsx:84: small-touch-target
- [x] src/components/placements/college-drive-create-dialog.tsx:10: native-popup
- [x] src/components/shell/topbar/organization-switcher.tsx:84: unverified-touch-class
- [x] src/components/ui/popover.tsx:63: unverified-touch-class
