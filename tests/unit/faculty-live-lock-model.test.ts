import {describe,expect,it} from "vitest";
import {facultyLiveDeliveryLockKey} from "@/modules/courses/faculty-live-lock-model";
describe("Blueprint co-teacher scheduling lock",()=>{
 it("serializes instructors on the same delivery independent of user",()=>{
  const id="00000000-0000-4000-8000-000000000001";
  expect(facultyLiveDeliveryLockKey(id)).toBe(facultyLiveDeliveryLockKey(id));
  expect(facultyLiveDeliveryLockKey(id)).not.toBe(facultyLiveDeliveryLockKey("00000000-0000-4000-8000-000000000002"));
 });
});
