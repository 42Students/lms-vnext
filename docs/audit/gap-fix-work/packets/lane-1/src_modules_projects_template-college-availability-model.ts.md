# Work packet: edit src/modules/projects/template-college-availability-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-037  [P1] GAP  facet F10  effort L
- Legacy: colleges.js:86 getColleges({all:true}) shows all colleges across platform
- vNext now: template-college-availability-model.ts:37-40 filters by current adminScope
- Fix: Restore Super Admin global college access or clearly scope and explain limitation

## G2-7-033-068  [P1] GAP  facet F23  effort L
- Legacy: colleges.js:84-86 explicitly all:true bypasses selected-college limitation
- vNext now: template-college-availability-model.ts:37-40 intentionally narrows current adminScope
- Fix: Restore platform-wide template assignment task in Super Admin context
