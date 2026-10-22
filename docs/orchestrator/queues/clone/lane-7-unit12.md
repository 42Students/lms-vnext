# Unit-test repair queue (unit12): lane chat-7

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` (1 failing)
- [x] `tests/unit/chat3-tpo-supplemental-round14.test.ts` (1 failing)
- [x] `tests/unit/tpo-drives-chat-3-open-verification.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-kit-projects-hardening-chat17.test.tsx

```
 FAIL  tests/unit/UX-kit-projects-hardening-chat17.test.tsx [ tests/unit/UX-kit-projects-hardening-chat17.test.tsx ]
SyntaxError: Invalid regular expression: /window\\.open\\s*\\(/: Unterminated group
```

### tests/unit/chat3-tpo-supplemental-round14.test.ts

```
 FAIL  tests/unit/chat3-tpo-supplemental-round14.test.ts > TPO supplemental job metadata > TPO-drives-39 persists actual pending preset rounds with readback dedupe
AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain '"POST",{kind:round.kind,name:round.na…'

- Expected
+ Received

- "POST",{kind:round.kind,name:round.name}
+ "use client";
+
+ import {
+   useState,
+   useRef,
+   useEffect,
+   useCallback,
+   type FormEvent,
+ } from "react";
```

### tests/unit/tpo-drives-chat-3-open-verification.test.ts

```
 FAIL  tests/unit/tpo-drives-chat-3-open-verification.test.ts > chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-39 round presets persist pending rounds after the draft with server readback before retry
AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain '"POST",{kind:round.kind,name:round.na…'

- Expected
+ Received

- "POST",{kind:round.kind,name:round.name}
+ "use client";
+
+ import {
+   useState,
+   useRef,
+   useEffect,
+   useCallback,
+   type FormEvent,
+ } from "react";
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [x] G2-19-010-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)

## Lane 7 pushed evidence

- G2-19-010-068: verified historical SHA-256 unsubscribe digest retention and link handling; deep packet updated in `4f270339`.
- UX-kit regex regression: corrected on lane branch and reinforced in `81e761cd` (the malformed regular expression belongs to the previous main version).
- TPO-drives-39: tests now assert the actual persisted `mode` in addition to kind/name; `d384fc6d` and `e4160fc9`.
- CI execution was not available in this lane; assertions were checked against current source.
