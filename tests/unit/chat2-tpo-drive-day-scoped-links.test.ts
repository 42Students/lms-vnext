import {describe,it,expect} from "vitest";
import {tpoDriveDayRoundLinks} from "../../src/modules/placements/tpo-drive-day-navigation-model";
describe("TPO Drive Day actions",()=>{
 it("routes results through parent job and current round",()=>{
  expect(tpoDriveDayRoundLinks("job","round").results).toBe("/tpo/placements/jobs/job/rounds/round/results");
 });
 it("encodes unsafe path fragments instead of injecting navigation segments",()=>{
  const paths=tpoDriveDayRoundLinks("a/b","x y");
  expect(paths.schedule).toContain("a%2Fb/candidate-schedule");
  expect(paths.noShows).toContain("x%20y/no-shows");
 });
});
