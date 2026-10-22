# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-marketing-forbidden-pages-16.test.tsx (2 failing)
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-home-01 offers functional, named destinations without requiring an account

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'aria-label="Public navigation"'
  - Expected
  + Received
  - aria-label="Public navigation"
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-demo-04 retains explicit contact and no hidden form submission

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'href="mailto:hello@42lms.com?subject=…'
  Expected: "href="mailto:hello@42lms.com?subject=Request%20a%20Demo""
  Received: "<link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","u
  ```

## tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts (3 failing)
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > limits assignment joins to one college and a Section matching the course offering cohort and term

  ```
  TypeError: db.select(...).from(...).orderBy is not a function
  ❯ Module.listAdminFacultyAssignments src/modules/admin-ui/super-admin-faculty-assignments-service.ts:139:4
  137|    deliveryId:sql<string>`"admin_faculty_assignment_directory"."admin_…
  138|  }).from(source)
  139|   .orderBy(desc(sql<string>`"admin_faculty_assignment_directory"."admi…
  |    ^
  140|   .limit(query.pageSize).offset((page-1)*query.pageSize);
  141|  const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle…
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > clamps stale deep links to the current final page after a Faculty assignment was removed

  ```
  TypeError: db.select(...).from(...).orderBy is not a function
  ❯ Module.listAdminFacultyAssignments src/modules/admin-ui/super-admin-faculty-assignments-service.ts:139:4
  137|    deliveryId:sql<string>`"admin_faculty_assignment_directory"."admin_…
  138|  }).from(source)
  139|   .orderBy(desc(sql<string>`"admin_faculty_assignment_directory"."admi…
  |    ^
  140|   .limit(query.pageSize).offset((page-1)*query.pageSize);
  141|  const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle…
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > does not invent a page or incorrectly fetch off-page data from an empty college

  ```
  TypeError: db.select(...).from(...).orderBy is not a function
  ❯ Module.listAdminFacultyAssignments src/modules/admin-ui/super-admin-faculty-assignments-service.ts:139:4
  137|    deliveryId:sql<string>`"admin_faculty_assignment_directory"."admin_…
  138|  }).from(source)
  139|   .orderBy(desc(sql<string>`"admin_faculty_assignment_directory"."admi…
  |    ^
  140|   .limit(query.pageSize).offset((page-1)*query.pageSize);
  141|  const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle…
  ```
