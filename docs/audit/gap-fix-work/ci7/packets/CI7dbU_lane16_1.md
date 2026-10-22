# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/hr-job-activity.test.ts (1 failing)
- HR job activity PG scopes > reads own job publication but denies foreign employer and wrong role

  ```
  ReferenceError: publishPlacementJob is not defined
  ❯ make tests/integration/hr-job-activity.test.ts:29:4
  27|     title,description:"Fixture",employmentType:"FULL_TIME",workMode:"H…
  28|    await seedPublishableJobReadiness(j.id,tpo.user.id);
  29|    await publishPlacementJob(tpo,j.id);return j;
  |    ^
  30|   };
  31|   const own=await make(a.relationship.id,"HR Feed Own "+n);
  ```

## tests/integration/storage-files-courses-db.test.ts (10 failing)
- assignment submission files against PostgreSQL > runs upload, verification, submit, grants and audit end to end

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- assignment submission files against PostgreSQL > quarantines content that does not match its declared type and deletes the object

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- assignment submission files against PostgreSQL > fails a tampered upload (wrong size) and an unfinished upload without serving anything

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- assignment submission files against PostgreSQL > does not serve a READY file whose object was overwritten after attestation

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- assignment submission files against PostgreSQL > enforces per-learner staging limits, ownership and non-leaking denials

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- assignment submission files against PostgreSQL > lets the learner remove a staged file

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- lesson videos against PostgreSQL > keeps a verified draft away from learners until it is published and visible

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- lesson videos against PostgreSQL > rejects mismatched bytes, never publishes unverified videos and survives replacement

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- lesson videos against PostgreSQL > follows the linked lesson content visibility and returns the saved resume position

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
- lesson videos against PostgreSQL > supports an optional thumbnail that is returned only with a playback grant

  ```
  StorageFileError: STORAGE_NOT_FOUND
  ❯ authorizeOrNotFound src/modules/storage/file-access.ts:23:13
  21|       error instanceof AuthorizationError
  22|     ) {
  23|       throw new StorageFileError("STORAGE_NOT_FOUND");
  |             ^
  24|     }
  25|     throw error;
  ```
