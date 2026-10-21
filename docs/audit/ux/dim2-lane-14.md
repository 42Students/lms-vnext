# Lane 14 — responsive layout values at 375/768/1280

Spec: `docs/design/old-lms-shell.css`, `docs/design/ui-clone-checklist.md`; source inspection, no CI.
src/app/(authenticated)/activity/[eventId]/page.tsx | 34 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/assignments/page.tsx | 18 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/audit/page.tsx | 6 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx | 12 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx | 17 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx | 14 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx | 10 instances | 375px: min control 44px ↔ min-h-11=44px; 375px: heading/actions stack ↔ shared PageHeader flex-col; 768px: head actions row ↔ md:flex-row | none
src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx | 9 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
