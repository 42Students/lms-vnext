# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/shared-public-pages.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/shared-public-pages.md

## G2-20-031-066  [P2] GAP  facet F14  effort S
- Legacy: Legacy privacy references Android package com.lms42.app and provides mailto privacy contact (`docs/legacy-source/frontend/src/pages/privacy-policy.js:3-8`, `docs/legacy-source/frontend/src/pages/privacy-policy.js:50-59`, `docs/legacy-source/frontend/src/pages/privacy-policy.js:160-168`)
- vNext now: Static privacy displays contact mailto but intro has no explicit package line (`public/assets/static/privacy-policy-view.html:24-29`, `public/assets/static/privacy-policy-view.html:123-143`)
- Fix: Restore explicit Android package ID in visible summary

## G2-20-031-077  [P2] GAP  facet F17  effort S
- Legacy: Legacy privacy TOC nav has aria-label Privacy policy sections (`docs/legacy-source/frontend/src/pages/privacy-policy.js:61-67`)
- vNext now: New static HTML details lacks nav label; only details summary (`public/assets/static/privacy-policy-view.html:31-49`)
- Fix: Add semantic labeled nav for policy anchors

## G2-20-031-080  [P3] GAP  facet F18  effort S
- Legacy: Legacy privacy quick links numbering '1. Overview' etc. (`docs/legacy-source/frontend/src/pages/privacy-policy.js:10-24`, `docs/legacy-source/frontend/src/pages/privacy-policy.js:61-67`)
- vNext now: New static uses '1) Overview' etc. (`public/assets/static/privacy-policy-view.html:31-49`)
- Fix: Restore dot numbering and anchor label format
