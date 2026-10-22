# ci6 packet lane 12: UX anti-drift guard violations (lint job fails on these)

The CI lint job runs `npm run ux:guard` (scripts/check-ux-anti-drift.mjs). Fix the CODE so each line below passes; read that script for each rule. Do NOT add baseline waivers, do not edit the guard, do not weaken it. Keep the old-LMS look and wording; accessibility wins on mechanics (owner decision "Same look, accessible").

Rules: unsafe-target = target=_blank needs rel="noopener noreferrer" (or drop target); small-touch-target / unverified-touch-class = interactive control needs the shared >=44px touch class the guard recognises; white-on-teal = white text on #26bac7 fails contrast, use the approved darker token; native-popup = replace window.confirm/alert/prompt with the shared dialog component.

- [x] src/app/campaign-unsubscribe/[token]/loading.tsx:5: unverified-touch-class
- [x] src/components/college/college-faculty-reassign-action.tsx:42: native-popup
- [x] src/components/college/college-faculty-reassign-action.tsx:47: native-popup
- [x] src/components/college/college-faculty-reassign-action.tsx:68: native-popup
- [x] src/components/placements/college-application-pipeline-controls.tsx:418: small-touch-target
- [x] src/components/shell/topbar/account-menu.tsx:113: unverified-touch-class
- [x] src/components/shell/topbar/account-menu.tsx:119: unverified-touch-class
- [x] src/components/ui/page-size-select.tsx:17: unverified-touch-class
