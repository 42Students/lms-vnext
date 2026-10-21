# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/l11-u031-cross-forms.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/l11-u031-cross-forms.md

## G2-11-031-007  [P2] GAP  facet F03  effort S
- Legacy: src/components/ui/form-field.tsx:33-34: red asterisk required marker and sr-only 'required'.
- vNext now: docs/legacy-source/frontend/src/pages/recruiter/profile.js:158: AntD requiredMark optional, different marker conventions.
- Fix: Mirror old optional vs required marker per screen.

## G2-11-031-043  [P3] GAP  facet F17  effort S
- Legacy: src/components/ui/select.tsx:16-50: native select keyboard and typeahead.
- vNext now: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:97-125: AntD Select searchable/modal behavior differs.
- Fix: Verify keyboard typeahead and focus restore.
