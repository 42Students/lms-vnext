import { buildPublishChecklist } from "@/components/tpo/drive/publishPreflight";

const NOW = Date.UTC(2026, 9, 6, 0, 0, 0);
const base = { jobType: "FULL_TIME", roleOptionsJson: [{ name: "SDE", ctcLpa: 6 }], applicationDeadline: "2026-10-20T12:00:00", driveMode: "ON_CAMPUS", eligibilityJson: { minCgpa: 7 } };
const keys = (job) => buildPublishChecklist(job, [{ id: 1 }], NOW).blocking.map((b) => b.key);

describe("publish checklist matches what the server refuses", () => {
  it("a complete drive has nothing blocking", () => expect(keys(base)).toEqual([]));
  it("the job type is asked for (the server refused it after the window said all clear)", () => expect(keys({ ...base, jobType: null })).toEqual(["type"]));
  it("a stipend counts as pay", () => expect(keys({ ...base, roleOptionsJson: [{ name: "Intern", stipendPerMonth: 15000 }] })).toEqual([]));
  it("a deadline already gone blocks", () => expect(keys({ ...base, applicationDeadline: "2026-10-01T12:00:00" })).toEqual(["deadline-past"]));
  it("a drive recorded after it happened needs no deadline or link", () =>
    expect(keys({ ...base, recordedOutside: true, applicationDeadline: null, driveMode: "OFF_CAMPUS" })).toEqual([]));
});
