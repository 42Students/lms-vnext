# CI fix packet (round 1): src/modules/courses/assignment-validation.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/courses/assignment-validation.ts

- [tsc] line 283:9 error TS2345: Argument of type 'ZodDiscriminatedUnion<[ZodObject<{ deliveryId: ZodString; submissionType: ZodLiteral<"TEXT">; textContent: ZodString; }, $strip>, ZodObject<{ deliveryId: ZodString; submissionType: ZodLiteral<...>; linkKind: ZodOptional<...>; submissionUrl: ZodString; }, $strip>, ZodObject<...>], "submissionType">' is not assignable to parameter of type '$ZodType<any, { deliveryId: 
