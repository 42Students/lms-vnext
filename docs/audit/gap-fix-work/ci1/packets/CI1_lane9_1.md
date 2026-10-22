# CI fix packet (round 1): src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts

- [tsc] line 10:2 error TS2305: Module '"@/modules/courses/learner-course-file-reference-service"' has no exported member 'parseLearnerCourseMaterialIndex'.
- [tsc] line 10:34 error TS2724: '"@/modules/courses/learner-course-file-reference-service"' has no exported member named 'LearnerCourseFileReferenceInputError'. Did you mean 'getLearnerCourseFileReference'?
- [tsc] line 46:32 error TS18046: 'error' is of type 'unknown'.
- [tsc] line 47:5 error TS18046: 'error' is of type 'unknown'.
- [tsc] line 48:13 error TS18046: 'error' is of type 'unknown'.
