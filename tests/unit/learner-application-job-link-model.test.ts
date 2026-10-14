import {describe,expect,it} from "vitest";
import {ownApplicationJobHref} from "@/modules/placements/learner-application-job-link-model";
const id="81818181-8181-4818-8818-818181818181";
describe("application job detail navigation",()=>{
  it("builds the exact selected job route from an owned saved application",()=>{
    expect(ownApplicationJobHref(id)).toBe("/learn/my-placements/jobs/"+id);
  });
  it("does not construct an internal navigation URL from forged or incomplete IDs",()=>{
    expect(ownApplicationJobHref("not-uuid")).toBeNull();
    expect(ownApplicationJobHref("../other-college")).toBeNull();
    expect(ownApplicationJobHref(undefined)).toBeNull();
  });
});
