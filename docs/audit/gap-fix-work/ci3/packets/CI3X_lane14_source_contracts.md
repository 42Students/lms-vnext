# CI infra packet (round 3): source-contracts (7 failing node:test checks)

This CI job fails on main. Fix the cause with the smallest correct change (the migrations 0000-0290 are the source of truth; staging SQL that was promoted into a registered migration must become idempotent or be retired with a note). Never weaken a guard test to make it pass.

```
# Subtest: no source-only audit implies actual Postgres has been verified
ok 43 - no source-only audit implies actual Postgres has been verified
not ok 172 - DB044 preserves vNext one-submission uniqueness
  error: |-
    The input was expected to not match the regular expression /semesterNumber|semester_number/. Input:
  name: 'AssertionError'
  expected:
  actual: |-
not ok 186 - DB053 explicitly records current producer/read cutover gaps instead of enabling runtime
  error: |-
  name: 'AssertionError'
  expected: true
  actual: false
not ok 196 - DB035 history models remain source-only and unregistered
  error: |-
    The input was expected to not match the regular expression /db06-history-staged/. Input:
  name: 'AssertionError'
  expected:
  actual: |-
not ok 207 - DB052 preserves active UNPUBLISH parity while current API still lacks it
  error: |-
    The input was expected to not match the regular expression /"UNPUBLISH"/. Input:
      '  expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),\n' +
  name: 'AssertionError'
  expected:
```
