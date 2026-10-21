# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md

## G2-14-030-001  [P1] MISSING  facet F01  effort L
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:50-60,258-265 invoked as an interview edit form, onSuccess/onCancel callbacks.
- vNext now: V/app/(authenticated)/admin/placements/interviews/page.tsx:1-12 shows read-only selected-college rounds; V/modules/admin-ui/super-admin-interview-detail-service.ts:8-33 read details.
- Fix: Provide selected-college super-admin Edit interview entry and writer with scoped authorization.

## G2-14-030-056  [P1] MISSING  facet F23  effort L
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:320-345 500 char description and 255 interviewer autocomplete; notes 1000 and request banner.
- vNext now: V/components/placements/college-interview-appointments.tsx:140-187 omits content and pending request banner.
- Fix: Restore or explicitly justify removal; include migration of existing recorded content.
