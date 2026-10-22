# Unit-test repair queue (unit12): lane chat-13

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat11-tpo-communication-adversarial.test.ts` (1 failing)
- [ ] `tests/unit/chat6-superadmin-people-verified-closure.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat11-tpo-communication-adversarial.test.ts

```
 FAIL  tests/unit/chat11-tpo-communication-adversarial.test.ts > TPO-settings-audit-DOUBLE-01 college communication editors > SMS caps, email signatures and recruiter durations cannot issue two writes before React renders pending
AssertionError: expected 4 to be 3 // Object.is equality

- Expected
+ Received

- 3
+ 4

 ❯ tests/unit/chat11-tpo-communication-adversarial.test.ts:87:56
     85|   const source=readFileSync("src/components/tpo/tpo-communication-sett…
     86|   const count=(str:string,needle:string)=>str.split(needle).length-1;
     87|   expect(count(source,"const inFlight=useRef(false)")).toBe(3);
       |                                                        ^
     88|   expect(count(source,"inFlight.current=true;setBusy(true)")).toBe(3);
     89|   expect(count(source,"inFlight.current=false;setBusy(false)")).toBe(3…
```

### tests/unit/chat6-superadmin-people-verified-closure.test.ts

```
 FAIL  tests/unit/chat6-superadmin-people-verified-closure.test.ts > chat-6 selected-college People gap verification > G2-15-027-052 keeps legacy department and faculty type in import preview and report
Error: No faculty records were found.
 ❯ parseFacultyBulkCsv src/modules/people/faculty-bulk-import-model.ts:65:25
     63|   const data=rows.slice(1);
     64|   if(data.length>500)throw new Error("The maximum batch size is 500 fa…
     65|   if(!data.length)throw new Error("No faculty records were found.");
       |                         ^
     66|   const issues:string[]=[];
     67|   const valid:FacultyBulkRow[]=[];
 ❯ tests/unit/chat6-superadmin-people-verified-closure.test.ts:24:14

```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-017-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
