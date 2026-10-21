import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { buildDriveForm, cleanRounds } from "@/pages/recruiter/drives/new";

describe("rounds in a drive request", () => {
  const v = { jobTitle: "Analyst", ctcLpa: 6 };
  it("sends only named rounds, and none at all when none were added", () => {
    expect(buildDriveForm(v, []).rounds).toBeUndefined();
    expect(buildDriveForm(v, [{ kind: "TEST", name: "  Aptitude " }, { kind: "GD", name: "  " }]).rounds).toEqual([{ kind: "TEST", name: "Aptitude" }]);
    expect(cleanRounds(undefined)).toEqual([]);
  });
  it("the form without rounds is exactly what it was before", () => {
    expect(Object.keys(buildDriveForm(v))).toEqual(["jobTitle", "jobDescription", "jdUrl", "location", "driveMode", "jobType", "roleOptions", "eligibility"]);
  });
});
