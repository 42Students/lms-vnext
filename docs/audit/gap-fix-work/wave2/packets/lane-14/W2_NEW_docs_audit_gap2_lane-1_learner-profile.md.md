# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/learner-profile.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile.md

## G2-1-031-022  [P2] GAP  facet F06  effort S
- Legacy: src/components/profile/learner-profile-workspace.tsx:61-121: form collection fields max/input types defined by schema and picker.
- vNext now: docs/legacy-source/frontend/src/components/profile/about.js:profile components use AntD Input, Select and DatePicker labels/format.
- Fix: Map exact per-field maxlength/default/date format in card matrix.

## G2-1-031-024  [P2] GAP  facet F06  effort S
- Legacy: src/modules/people/profile-validation.ts:75-95: date inputs require YYYY-MM-DD.
- vNext now: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:110-112: DOB date picker DD-MM-YYYY.
- Fix: Keep displayed DD-MM-YYYY for DOB while storing canonical ISO.

## G2-1-031-032  [P2] GAP  facet F09  effort S
- Legacy: src/components/profile/learner-profile-workspace.tsx:775-1030: modal dialogs for all collection edit/delete.
- vNext now: docs/legacy-source/frontend/src/components/profile/about.js:89-116, section children: AntD dialogs and Popconfirms.
- Fix: Compare modal title/buttons/overlay width, delete wording and focus.
