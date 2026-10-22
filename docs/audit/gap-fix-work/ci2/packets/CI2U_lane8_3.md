# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-placements-jobs-jobId-shortlisted-01.test.ts (2 failing)
- /college/placements/jobs/[jobId]/shortlisted UX > UX-college-placements-jobs-shortlisted-01 preserves the new accessible state and responsive contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'caption="Shortlisted students"'
  - Expected
  + Received
  - caption="Shortlisted students"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- /college/placements/jobs/[jobId]/shortlisted UX > UX-college-placements-jobs-shortlisted-02 preserves the new accessible state and responsive contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No shortlisted students'
  - Expected
  + Received
  - No shortlisted students
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/UX-college-students-register-01.test.ts (1 failing)
- /college/students/register UX > UX-college-students-register-01 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import { redirect } from "next/navigation";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/UX-hr-round-editor-chat15-01.test.ts (2 failing)
- UX-hr-round-editor-chat15-01 > round create, edit and removal use a native shared modal with keyboard focus and dismiss guards

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'title={active?"Change round":"Add a r…'
  - Expected
  + Received
  - title={active?"Change round":"Add a round"}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```
- UX-hr-round-editor-chat15-01 > shared Dialog and ScrollCue provide native Escape, labelled title, focus return and conditional fades

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-mentor-legacy-navigation-01.test.ts (1 failing)
- UX-mentor-legacy-navigation-01 bookmark compatibility > routes /mentor/courses to the role-appropriate live workspace without rendering stale data

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/mentor")'
  - Expected
  + Received
  - redirect("/mentor")
  + import {redirect} from "next/navigation";
  +
  + /** MEN-projects-meetings-74: legacy mentor bookmark compatibility. */
  + export default function MentorLegacyRedirect(){
  ```

## tests/unit/UX-superadmin-login-01.test.ts (1 failing)
- UX-superadmin-login-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/")'
  - Expected
  + Received
  - redirect("/")
  + import { redirect } from "next/navigation";
  +
  + /** Legacy Super Admin bookmark: the shared sign-in handles privileged second factor. */
  + export default function LegacySuperAdminLoginPage() {
  ```

## tests/unit/UX-teacher-native-font-16px-round7.test.ts (8 failing)
- Faculty native input text remains 16px across breakpoints > UX-teacher-calendar-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:14:17
  12|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  13|   }
  14|   expect(count).toBeGreaterThan(0);
  |                 ^
  15|  });
  16|  it("UX-teacher-contacts-contactsTab-03 keeps 16px text on fields at a…
  ```
- Faculty native input text remains 16px across breakpoints > UX-teacher-contacts-contactsTab-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:24:17
  22|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  23|   }
  24|   expect(count).toBeGreaterThan(0);
  |                 ^
  25|  });
  26|  it("UX-teacher-courses-deliveryId-assessment-health-03 keeps 16px tex…
  ```
- Faculty native input text remains 16px across breakpoints > UX-teacher-courses-deliveryId-assessment-health-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:34:17
  32|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  33|   }
  34|   expect(count).toBeGreaterThan(0);
  |                 ^
  35|  });
  36|  it("UX-teacher-courses-deliveryId-discussion-history-03 keeps 16px te…
  ```
- Faculty native input text remains 16px across breakpoints > UX-teacher-courses-deliveryId-discussion-history-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:44:17
  42|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  43|   }
  44|   expect(count).toBeGreaterThan(0);
  |                 ^
  45|  });
  46|  it("UX-teacher-courses-deliveryId-gradebook-03 keeps 16px text on fie…
  ```
- Faculty native input text remains 16px across breakpoints > UX-teacher-courses-deliveryId-gradebook-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:54:17
  52|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  53|   }
  54|   expect(count).toBeGreaterThan(0);
  |                 ^
  55|  });
  56|  it("UX-teacher-courses-deliveryId-reports-03 keeps 16px text on field…
  ```
- Faculty native input text remains 16px across breakpoints > UX-teacher-courses-deliveryId-reports-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:64:17
  62|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  63|   }
  64|   expect(count).toBeGreaterThan(0);
  |                 ^
  65|  });
  66|  it("UX-teacher-live-classes-03 keeps 16px text on fields at all width…
  ```
- Faculty native input text remains 16px across breakpoints > UX-teacher-live-classes-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:74:17
  72|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  73|   }
  74|   expect(count).toBeGreaterThan(0);
  |                 ^
  75|  });
  76|  it("UX-teacher-profile-teaching-03 keeps 16px text on fields at all w…
  ```
- Faculty native input text remains 16px across breakpoints > UX-teacher-profile-teaching-03 keeps 16px text on fields at all widths

  ```
  AssertionError: expected 0 to be greater than 0
  ❯ tests/unit/UX-teacher-native-font-16px-round7.test.ts:84:17
  82|    count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  83|   }
  84|   expect(count).toBeGreaterThan(0);
  |                 ^
  85|  });
  86| });
  ```
