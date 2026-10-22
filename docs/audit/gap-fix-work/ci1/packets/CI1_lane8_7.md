# CI fix packet (round 1): src/modules/people/faculty-admin-document-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/people/faculty-admin-document-service.ts

- [tsc] line 203:43 error TS2345: Argument of type '"FACULTY_PROFILE_DOCUMENT_INVALID"' is not assignable to parameter of type 'PeopleServiceErrorCode'.
- [tsc] line 207:43 error TS2345: Argument of type '"FACULTY_PROFILE_DOCUMENT_INVALID"' is not assignable to parameter of type 'PeopleServiceErrorCode'.
- [tsc] line 211:42 error TS2345: Argument of type '"FACULTY_PROFILE_DOCUMENT_INVALID"' is not assignable to parameter of type 'PeopleServiceErrorCode'.
- [tsc] line 216:42 error TS2345: Argument of type '"FACULTY_PROFILE_DOCUMENT_INVALID"' is not assignable to parameter of type 'PeopleServiceErrorCode'.
- [tsc] line 222:42 error TS2345: Argument of type '"FACULTY_PROFILE_DOCUMENT_INVALID"' is not assignable to parameter of type 'PeopleServiceErrorCode'.
- [tsc] line 304:32 error TS2345: Argument of type '"FACULTY_PROFILE_DOCUMENT_INVALID"' is not assignable to parameter of type 'PeopleServiceErrorCode'.
- [tsc] line 329:44 error TS2345: Argument of type '"FACULTY_PROFILE_DOCUMENT_INVALID"' is not assignable to parameter of type 'PeopleServiceErrorCode'.
- [tsc] line 357:5 error TS18047: 'context.membership' is possibly 'null'.
- [tsc] line 414:5 error TS18047: 'context.membership' is possibly 'null'.
