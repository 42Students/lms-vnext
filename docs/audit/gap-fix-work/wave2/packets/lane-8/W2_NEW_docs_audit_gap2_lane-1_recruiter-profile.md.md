# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/recruiter-profile.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md

## G2-1-035-062  [P2] GAP  facet F16  effort S
- Legacy: src/components/hr/recruiter-profile-details-editor.tsx:75-82: at >=768 px all four fields in 2-column grid.
- vNext now: docs/legacy-source/frontend/src/pages/recruiter/profile.js:159-169: two name fields grouped, phone/title full-width.
- Fix: Make only name columns and card widths responsive.
