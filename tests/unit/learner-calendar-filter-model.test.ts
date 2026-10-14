import { describe,expect,it } from "vitest";
import { resolveOwnLearnerCalendarFilters } from "@/modules/academics/learner-calendar-filter-model";
const deliveryId="81818181-8181-4818-8818-818181818181";
const other="82828282-8282-4828-8828-828282828282";
const courses=[{deliveryId},{deliveryId:other}];
const today=new Date(2026,9,14);
describe("learner class calendar URL filters",()=>{
  it("accepts month/week with only persisted course deliveries",()=>{
    const month=resolveOwnLearnerCalendarFilters({view:"month",month:"2026-10",deliveryId},courses,today);
    expect(month).toMatchObject({view:"month",selectedDeliveryIds:[deliveryId]});
    expect(month?.anchor.getFullYear()).toBe(2026);
    expect(month?.anchor.getMonth()).toBe(9);
    expect(resolveOwnLearnerCalendarFilters({view:"week"},courses,today)?.selectedDeliveryIds).toEqual([deliveryId,other]);
  });
  it("denies forged, malformed and unexpected tenant filter parameters",()=>{
    for(const input of [
      {view:"year"},{view:"month",month:"2026-13"},{deliveryId:"fake"},
      {deliveryId:"83838383-8383-4838-8838-838383838383"},
      {deliveryId, collegeId:other},{deliveryId:[deliveryId]},
    ]) expect(resolveOwnLearnerCalendarFilters(input,courses,today)).toBeNull();
  });
});