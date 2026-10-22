# CI fix packet (round 4): src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx

- [tsc] line 126:53 error TS2741: Property 'sections' is missing in type '{ programs: { id: string; name: string; code: string; departmentName: string; }[]; cohorts: { id: string; name: string; code: string; programId: string; programName: string; status: "ACTIVE" | "ARCHIVED" | "PLANNED" | "COMPLETED"; }[]; }' but required in type 'PlacementAcademicTargetingOptions'.
- [tsc] line 136:20 error TS2741: Property 'legacyPostingDetails' is missing in type '{ id: string; title: string; description: string; employmentType: "FULL_TIME" | "INTERNSHIP" | "CONTRACT"; jobTypeLabel: string | null; workMode: "ONSITE" | "HYBRID" | "REMOTE"; locations: string[]; ... 5 more ...; applicationDeadline: string | null; }' but required in type '{ id: string; title: string; description: string; employme
- [tsc] line 147:11 error TS2741: Property 'allowedSectionIds' is missing in type '{ allowedProgramIds: string[]; allowedCohortIds: string[]; minCgpa: number | null; maxActiveBacklogs: number | null; maxPastBacklogs: number | null; minTenthPercentage: number | null; ... 5 more ...; missingEvidencePolicy: "ALLOW_WITH_FLAG" | "REQUIRE_COMPLETE"; }' but required in type '{ allowedProgramIds: string[]; allowedCohortIds: 
