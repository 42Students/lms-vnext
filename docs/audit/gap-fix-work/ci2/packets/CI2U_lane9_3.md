# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-placements-student-lookup-01.test.ts (1 failing)
- /college/placements/student-lookup UX > UX-college-placements-student-lookup-01 preserves the new accessible state and responsive contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'caption="Student placement applicatio…'
  - Expected
  + Received
  - caption="Student placement applications"
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
  ```

## tests/unit/UX-college-term-mapping-scroll-chat17.test.ts (1 failing)
- UX-UNOWNED-GRID-09 college semester mapping remains keyboard- and touch-accessible > maintains drag-to-reorder and button alternatives without sub-44px targets

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'import { ScrollCue } from "@/componen…'
  - Expected
  + Received
  - import { ScrollCue } from "@/components/ui/scroll-cue"
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/UX-hr-tracker-overlays-chat15-01.test.ts (4 failing)
- UX-chat15 overlay behaviours > UX-tracker-quick-report-01 uses native focus-trapping Drawer while retaining Alt+B

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Drawer open={open} onOpenChange={set…'
  - Expected
  + Received
  - <Drawer open={open} onOpenChange={setOpen} title="Report an issue">
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {useEffect,useState} from "react";
  ```
- UX-chat15 overlay behaviours > UX-hr-bell-01 has labelled dialog, retry, touch controls and scroll cues

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'role="dialog"'
  - Expected
  + Received
  - role="dialog"
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-chat15 overlay behaviours > UX-hr-request-cancel-01 confirms consequences, locks doubles and maps errors

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'if(lock.current)return'
  - Expected
  + Received
  - if(lock.current)return
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- UX-chat15 overlay behaviours > UX-verification-drawer-01 wraps focus, restores opener, blocks saving Escape and cues scroll

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'role="dialog" aria-modal="true"'
  - Expected
  + Received
  - role="dialog" aria-modal="true"
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/UX-mentor-projects-projectId-01.test.ts (1 failing)
- Mentor UX cross-audit /mentor/projects/[projectId] > UX-mentor-projects-projectId-02 preserves route copy and live recovery/workflow

  ```
  AssertionError: expected 'import { MentorProjectsUnavailable } …' to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  + import Link from "next/link";
  ```

## tests/unit/UX-teach-courses-coverage-01.test.ts (1 failing)
- UX-teach-courses-01 /teach/courses keeps report scope and state contracts

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain '<PageHeader\n        eyebrow="Faculty…'
  - Expected
  + Received
  - <PageHeader
  -         eyebrow="Faculty"
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyCourseList } from "@/components/courses/faculty-course-list";
  + import { getFacultyCourseList } from "@/modules/courses/faculty-course-list-service";
  ```

## tests/unit/UX-teacher-native-font-shared-round8.test.ts (5 failing)
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-01 keeps 16px text in interactive fields

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-shared-round8.test.ts:14:19
  12|    checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  13|   }
  14|   expect(checked).toBeGreaterThan(0);
  |                   ^
  15|  });
  16|  it("UX-teacher-native-font-shared-02 keeps 16px text in interactive f…
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-02 keeps 16px text in interactive fields

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-shared-round8.test.ts:24:19
  22|    checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  23|   }
  24|   expect(checked).toBeGreaterThan(0);
  |                   ^
  25|  });
  26|  it("UX-teacher-native-font-shared-03 keeps 16px text in interactive f…
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-03 keeps 16px text in interactive fields

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-shared-round8.test.ts:34:19
  32|    checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  33|   }
  34|   expect(checked).toBeGreaterThan(0);
  |                   ^
  35|  });
  36|  it("UX-teacher-native-font-shared-04 keeps 16px text in interactive f…
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-04 keeps 16px text in interactive fields

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-shared-round8.test.ts:44:19
  42|    checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  43|   }
  44|   expect(checked).toBeGreaterThan(0);
  |                   ^
  45|  });
  46|  it("UX-teacher-native-font-shared-05 keeps 16px text in interactive f…
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-05 keeps 16px text in interactive fields

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-shared-round8.test.ts:54:19
  52|    checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  53|   }
  54|   expect(checked).toBeGreaterThan(0);
  |                   ^
  55|  });
  56| });
  ```
