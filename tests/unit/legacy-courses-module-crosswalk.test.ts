import {describe,expect,it} from "vitest";
import {LEGACY_COURSES_MODULE_CROSSWALK,OPTIONAL_MODULE_KEYS} from
 "@/modules/module-access/service";
import type {PlatformPermission} from "@/modules/permissions/policy";

describe("legacy Courses feature versus core academic product",()=>{
 it("maps the legacy feature without inventing a discretionary authorization toggle",()=>{
  const mapping=LEGACY_COURSES_MODULE_CROSSWALK;
  const read:PlatformPermission=mapping.readPermission;
  const write:PlatformPermission=mapping.managePermission;
  expect(mapping.legacyKey).toBe("courses");
  expect(mapping.optionalModule).toBe(false);
  expect(mapping.vNextProduct).toBe("CORE_COURSES");
  expect(read).toBe("courses.read");
  expect(write).toBe("courses.manage");
  expect(OPTIONAL_MODULE_KEYS).not.toContain(mapping.legacyKey);
  expect(mapping.legacyOverrideDisposition).toBe("REVIEW_BEFORE_IMPORT");
 });
});
