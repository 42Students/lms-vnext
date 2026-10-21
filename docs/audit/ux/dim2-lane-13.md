# Dimension 2 / lane 13 — responsive values

| File | Instances checked | Spec vs code 375 / 768 / 1280 | Fixes |
|---|---:|---|---|
| `src/app/(authenticated)/activity/page.tsx` | 18 | 375 min 44px touch ↔ 8 min-h-11 (44px); 768 at 768px ↔ 13 md:/min-[768px] rules; 1280 non-overflow ↔ 10 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/academics/page.tsx` | 8 | 375 min 44px touch ↔ 3 min-h-11 (44px); 768 at 768px ↔ 2 md:/min-[768px] rules; 1280 non-overflow ↔ 4 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/announcements/page.tsx` | 18 | 375 min 44px touch ↔ 5 min-h-11 (44px); 768 at 768px ↔ 9 md:/min-[768px] rules; 1280 non-overflow ↔ 10 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/batch-promotion/page.tsx` | 27 | 375 min 44px touch ↔ 9 min-h-11 (44px); 768 at 768px ↔ 17 md:/min-[768px] rules; 1280 non-overflow ↔ 10 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/batches/page.tsx` | 22 | 375 min 44px touch ↔ 11 min-h-11 (44px); 768 at 768px ↔ 17 md:/min-[768px] rules; 1280 non-overflow ↔ 9 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/classes/page.tsx` | 25 | 375 min 44px touch ↔ 13 min-h-11 (44px); 768 at 768px ↔ 18 md:/min-[768px] rules; 1280 non-overflow ↔ 11 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx` | 15 | 375 min 44px touch ↔ 8 min-h-11 (44px); 768 at 768px ↔ 9 md:/min-[768px] rules; 1280 non-overflow ↔ 4 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` | 27 | 375 min 44px touch ↔ 9 min-h-11 (44px); 768 at 768px ↔ 20 md:/min-[768px] rules; 1280 non-overflow ↔ 13 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/colleges/page.tsx` | 15 | 375 min 44px touch ↔ 7 min-h-11 (44px); 768 at 768px ↔ 11 md:/min-[768px] rules; 1280 non-overflow ↔ 6 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/companies/page.tsx` | 56 | 375 min 44px touch ↔ 21 min-h-11 (44px); 768 at 768px ↔ 28 md:/min-[768px] rules; 1280 non-overflow ↔ 12 min-w-0/max-w-full containers | none |
| `src/app/(authenticated)/admin/course-progress/page.tsx` | 21 | 375 ≥44px ↔ 8 min-h-11=44px; 768 transition ↔ 11 md:768px rules; 1280/375 fit ↔ 8 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/course-progress/students/page.tsx` | 9 | 375 ≥44px ↔ 2 min-h-11=44px; 768 transition ↔ 7 md:768px rules; 1280/375 fit ↔ 7 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/electives/page.tsx` | 23 | 375 ≥44px ↔ 8 min-h-11=44px; 768 transition ↔ 9 md:768px rules; 1280/375 fit ↔ 7 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/features/[collegeId]/page.tsx` | 30 | 375 ≥44px ↔ 13 min-h-11=44px; 768 transition ↔ 20 md:768px rules; 1280/375 fit ↔ 8 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx` | 24 | 375 ≥44px ↔ 9 min-h-11=44px; 768 transition ↔ 8 md:768px rules; 1280/375 fit ↔ 8 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx` | 32 | 375 ≥44px ↔ 12 min-h-11=44px; 768 transition ↔ 21 md:768px rules; 1280/375 fit ↔ 13 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/features/page.tsx` | 44 | 375 ≥44px ↔ 14 min-h-11=44px; 768 transition ↔ 15 md:768px rules; 1280/375 fit ↔ 16 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/inbound-mail/page.tsx` | 23 | 375 ≥44px ↔ 6 min-h-11=44px; 768 transition ↔ 15 md:768px rules; 1280/375 fit ↔ 15 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/lecture-halls/page.tsx` | 33 | 375 ≥44px ↔ 13 min-h-11=44px; 768 transition ↔ 18 md:768px rules; 1280/375 fit ↔ 20 zero-min/maximum-width rules | none |
| `src/app/(authenticated)/admin/lessons/page.tsx` | 29 | 375 ≥44px ↔ 11 min-h-11=44px; 768 transition ↔ 17 md:768px rules; 1280/375 fit ↔ 17 zero-min/maximum-width rules | none |

Shared responsive primitive correction: `src/components/ui/error-state.tsx`, `src/components/ui/empty-state.tsx` — legacy 375px minimum action hit area 44 × 44px vs prior bare inline link with text-height only; add mobile-only `min-h-11 min-w-11 inline-flex items-center` to anchor children; at 768/1280 shared wrapper values unchanged. Applies to page recovery states without changing their markup.
| `src/app/(authenticated)/admin/module-access/page.tsx` | 23 | 375 tap ≥44px ↔ 6 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 9 md:/min-[768px] rules; 1280/375 width-fit ↔ 12 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/organizations/page.tsx` | 17 | 375 tap ≥44px ↔ 5 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 8 md:/min-[768px] rules; 1280/375 width-fit ↔ 8 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/people/directory/page.tsx` | 34 | 375 tap ≥44px ↔ 14 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 15 md:/min-[768px] rules; 1280/375 width-fit ↔ 15 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/people/page.tsx` | 21 | 375 tap ≥44px ↔ 8 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 12 md:/min-[768px] rules; 1280/375 width-fit ↔ 12 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/people/unassigned/page.tsx` | 20 | 375 tap ≥44px ↔ 8 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 9 md:/min-[768px] rules; 1280/375 width-fit ↔ 14 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/placements/analytics/page.tsx` | 34 | 375 tap ≥44px ↔ 6 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 11 md:/min-[768px] rules; 1280/375 width-fit ↔ 22 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/placements/drives/page.tsx` | 22 | 375 tap ≥44px ↔ 10 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 12 md:/min-[768px] rules; 1280/375 width-fit ↔ 11 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx` | 29 | 375 tap ≥44px ↔ 13 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 15 md:/min-[768px] rules; 1280/375 width-fit ↔ 16 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/placements/student-lookup/page.tsx` | 17 | 375 tap ≥44px ↔ 6 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 7 md:/min-[768px] rules; 1280/375 width-fit ↔ 10 min-w-0/max-w-full/scroll rules | none |
| `src/app/(authenticated)/admin/projects/templates/page.tsx` | 21 | 375 tap ≥44px ↔ 9 explicit min-h-11 (44px); 768 tablet breakpoint 768px ↔ 13 md:/min-[768px] rules; 1280/375 width-fit ↔ 9 min-w-0/max-w-full/scroll rules | none |
