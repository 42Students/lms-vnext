import React from "react";
import { jdFileProblem } from "@/components/tpo/JdUpload";
import { buildDriveForm } from "@/pages/recruiter/drives/new";

const file = (name, type, size = 1000) => ({ name, type, size });

describe("job description file rules", () => {
  it("accepts a PDF and Word files", () => {
    expect(jdFileProblem(file("jd.pdf", "application/pdf"))).toBeNull();
    expect(jdFileProblem(file("jd.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).toBeNull();
    expect(jdFileProblem(file("jd.doc", "application/msword"))).toBeNull();
    expect(jdFileProblem(file("jd.docx", ""))).toBeNull(); // some browsers send no type
  });
  it("refuses other files, big files and empty files, in words", () => {
    expect(jdFileProblem(file("pic.png", "image/png"))).toMatch(/PDF or a Word/);
    expect(jdFileProblem(file("big.pdf", "application/pdf", 6 * 1024 * 1024))).toMatch(/5 MB/);
    expect(jdFileProblem(file("empty.pdf", "application/pdf", 0))).toMatch(/empty/);
    expect(jdFileProblem(null)).toMatch(/Choose/);
  });
  it("a recruiter's request carries the file link only when there is one", () => {
    expect(buildDriveForm({ jobTitle: "A", jdUrl: "https://r2/x.pdf" }).jdUrl).toBe("https://r2/x.pdf");
    expect(buildDriveForm({ jobTitle: "A", jdUrl: "" }).jdUrl).toBeUndefined();
  });
});
