import { describe, expect, it } from "vitest";
import {
  availableLearnerJobFacets,
  learnerDriveAvailability,
  learnerDriveAvailabilityCounts,
  learnerDriveAvailabilitySchema,
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
  it("sorts actionable deadlines before closed or malformed dates",()=>{
    const rows=[
      {...jobs[0]!,job:{...jobs[0]!.job,applicationDeadline:"bad-date"}},
      {...jobs[1]!,job:{...jobs[1]!.job,applicationDeadline:"2026-10-10T00:00:00Z"},deadlinePassed:true},
      {...jobs[2]!,job:{...jobs[2]!.job,applicationDeadline:"2026-10-17T00:00:00Z"},deadlinePassed:false},
    ];
    expect(filterLearnerPlacementJobs(rows,defaults).map(x=>x.job.id)).toEqual(["c","a","b"]);
    expect(rows[0]!.job.applicationDeadline).toBe("bad-date");
  });
    it("supports compensation and title sorting", () => {
    expect(filterLearnerPlacementJobs(jobs,{...defaults,sort:"ctc"}).map(x=>x.job.id))
      .toEqual(["b","a","c"]);
    expect(filterLearnerPlacementJobs(jobs,{...defaults,sort:"title"}).map(x=>x.job.id))
      .toEqual(["a","b","c"]);
  });
  it("sorts newest from persisted publication time, with unknown timestamps last", () => {
    const withPublished = [
      {...jobs[0]!, job: {...jobs[0]!.job, publishedAt: "2026-10-01T00:00:00Z"}},
      {...jobs[1]!, job: {...jobs[1]!.job, publishedAt: null}},
      {...jobs[2]!, job: {...jobs[2]!.job, publishedAt: "2026-10-12T00:00:00Z"}},
    ];
    expect(filterLearnerPlacementJobs(withPublished,{...defaults,sort:"newest"})
      .map(x=>x.job.id)).toEqual(["c","a","b"]);
    expect(withPublished.map(x=>x.job.id)).toEqual(["a","b","c"]);
  });
  it("separates open, unavailable and expired from persisted learner eligibility", () => {
    const a=jobs[0]!, b=jobs[1]!, c=jobs[2]!;
    const grouped=[
      {...a, deadlinePassed:false,canApply:true},
      {...b, deadlinePassed:false,canApply:false},
      {...c, deadlinePassed:true,canApply:false},
    ];
    expect(grouped.map(learnerDriveAvailability)).toEqual(["open","not-open","closed"]);
    expect(learnerDriveAvailabilityCounts(grouped)).toEqual({
      all:3,open:1,"not-open":1,closed:1,
    });
    expect(filterLearnerPlacementJobs(grouped,{
      ...defaults,availability:"not-open",
    }).map(x=>x.job.id)).toEqual(["b"]);
    expect(learnerDriveAvailabilitySchema.safeParse("other").success).toBe(false);
  });
  it("derives facets from real job rows", () => {
    expect(availableLearnerJobFacets(jobs)).toEqual({
      types:["FULL_TIME","INTERNSHIP"],
      locations:["Bengaluru","Chennai","Hyderabad"],
    });
  });
});
