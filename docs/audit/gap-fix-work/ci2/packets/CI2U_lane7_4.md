# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-shared-submit-buttons-round9.test.ts (10 failing)
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-01 retains GET filters and action label

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-02 retains GET filters and action label

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'import {Button} from "@/components/ui…'
  - Expected
  + Received
  - import {Button} from "@/components/ui/button"
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-03 retains GET filters and action label

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  +
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-04 retains GET filters and action label

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import { Select } from "@/components/ui/select";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-05 retains GET filters and action label

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-06 retains GET filters and action label

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'import {Button} from "@/components/ui…'
  - Expected
  + Received
  - import {Button} from "@/components/ui/button"
  + import Link from "next/link";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-07 retains GET filters and action label

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-08 retains GET filters and action label

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-09 retains GET filters and action label

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- Faculty route primary actions use shared Button focus ring and 44px hitbox > UX-teacher-shared-submit-10 retains GET filters and action label

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/UX-tpo-calendar-export-01.test.ts (1 failing)
- UX-tpo-calendar-export-01 /tpo/calendar/export > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Input} from \"@/components/ui/input\";
  import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  ```

## tests/unit/UX-tpo-home-01.test.ts (1 failing)
- UX-tpo-home-01 /tpo/home > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import { Badge } from \"@/components/ui/badge\";
  import Link from \"next/link\";
  import {TpoHomeReturnRefresh} from \"@/components/tpo/tpo-home-return-refresh\";
  import {eq} from \"drizzle-orm\";
  ```

## tests/unit/admin-dashboard-navigation.test.ts (1 failing)
- W06 legacy admin Dashboard navigation fidelity > does not erroneously restore a full setup guide to Super Admin

  ```
  AssertionError: expected [ 'Tenant setup', …(3) ] to deeply equal [ 'Tenant Setup', …(3) ]
  - Expected
  + Received
  [
  -   "Tenant Setup",
  +   "Tenant setup",
  +   "Feature controls",
  +   "Activity log",
  ```

## tests/unit/chat11-college-setup-integrity-round11.test.ts (2 failing)
- College academic setup prerequisites and mutation validation > COL-academic-setup-06 refuses invalid curriculum credits 0

  ```
  
  ```
- College academic setup prerequisites and mutation validation > COL-academic-setup-06 refuses invalid curriculum credits 11

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat11-super-admin-public-branding-safe.test.ts (1 failing)
- SA-tenants-modules-BRAND-06 public college-branding output hygiene > sanitizes before anonymous exposure while keeping the scoped logo proxy

  ```
  AssertionError: expected 'export async function getPublicColleg…' to contain 'sanitizePublicCollegeBranding(view)'
  - Expected
  + Received
  - sanitizePublicCollegeBranding(view)
  + export async function getPublicCollegeBranding(collegeId: string) {
  +   // Only a missing/inactive college resolves to absent branding. A storage
  +   // outage must propagate instead of looking like an unknown public tenant.
  +   let college: Awaited<ReturnType<typeof loadCollege>>;
  ```
