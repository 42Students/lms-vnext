import {describe,it,expect} from "vitest";
import {filterLearnerScheduleUpcoming} from "@/modules/academics/learner-schedule-upcoming-model";
const now=Date.parse("2026-10-15T09:00:00Z");
const rows=[{id:"past",endsAt:"2026-10-15T08:00:00Z"},{id:"live",endsAt:"2026-10-15T09:01:00Z"},{id:"invalid",endsAt:"bad"}];
describe("learner upcoming classes",()=>{
 it("keeps live future-ended sessions without timezone inference",()=>{
  expect(filterLearnerScheduleUpcoming(rows,true,now).map(x=>x.id)).toEqual(["live"]);
 });
 it("does not change the previously authorized source list when off",()=>{
  expect(filterLearnerScheduleUpcoming(rows,false,now)).toEqual(rows);
  expect(rows).toHaveLength(3);
 });
});
