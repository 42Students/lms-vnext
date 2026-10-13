import { describe, expect, it } from "vitest";
import {
  availableLearnerJobFacets,
  filterLearnerPlacementJobs,
  DEFAULT_LEARNER_JOB_FILTERS as defaults,
} from "@/modules/placements/learner-jobs-browse-model";

const job = (id: string, company: string, type: string,
  location: string, ctc: number, deadline: string | null, canApply = true) => ({
  job: { id, title: "Campus Drive", description: "Software role", applicationDeadline: deadline },
  company: { name: company },
  roleOption: {
    id, title: id, employmentType: type, locations: [location],
    minimumAnnualCtcInr: ctc, maximumAnnualCtcInr: ctc,
  },
  canApply, deadlinePassed: false,
});
const jobs = [
  job("a", "Acme", "FULL_TIME", "Hyderabad", 700000, "2026-10-18T00:00:00Z"),
  job("b", "Beta", "INTERNSHIP", "Bengaluru", 900000, null),
  job("c", "Acme", "FULL_TIME", "Chennai", 500000, "2026-10-16T00:00:00Z", false),
];

describe("Learner job browsing filters", () => {
  it("finds company, role and location text without mutating source", () => {
    expect(filterLearnerPlacementJobs(jobs, {...defaults, search:"acme"}).map(x=>x.job.id)).toEqual(["c","a"]);
    expect(filterLearnerPlacementJobs(jobs, {...defaults, search:"bengaluru"}).map(x=>x.job.id)).toEqual(["b"]);
    expect(jobs.map(x=>x.job.id)).toEqual(["a","b","c"]);
  });
  it("combines employment type, location and eligibility", () => {
    expect(filterLearnerPlacementJobs(jobs, {
      ...defaults, employmentType:"FULL_TIME", eligibleOnly:true,
    }).map(x=>x.job.id)).toEqual(["a"]);
    expect(filterLearnerPlacementJobs(jobs, {
      ...defaults, location:"Chennai", eligibleOnly:true,
    })).toEqual([]);
  });
  it("sorts by earliest deadline with missing deadlines last", () => {
    expect(filterLearnerPlacementJobs(jobs,defaults).map(x=>x.job.id)).toEqual(["c","a","b"]);
  });
  it("supports compensation and title sorting", () => {
    expect(filterLearnerPlacementJobs(jobs,{...defaults,sort:"ctc"}).map(x=>x.job.id))
      .toEqual(["b","a","c"]);
    expect(filterLearnerPlacementJobs(jobs,{...defaults,sort:"title"}).map(x=>x.job.id))
      .toEqual(["a","b","c"]);
  });
  it("derives facets from real job rows", () => {
    expect(availableLearnerJobFacets(jobs)).toEqual({
      types:["FULL_TIME","INTERNSHIP"],
      locations:["Bengaluru","Chennai","Hyderabad"],
    });
  });
});
