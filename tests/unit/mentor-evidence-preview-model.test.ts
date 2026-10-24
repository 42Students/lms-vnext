import {describe,expect,it} from "vitest";
import {mentorEvidenceDisplayKind} from
  "@/modules/projects/mentor-evidence-preview-model";

describe("Mentor final evidence inline preview classification",()=>{
  it("allows only recognized media extensions and MIME types",()=>{
    expect(mentorEvidenceDisplayKind("https://files.example/report.pdf","document"))
      .toBe("DOCUMENT");
    expect(mentorEvidenceDisplayKind("https://files.example/photo.webp",""))
      .toBe("IMAGE");
    expect(mentorEvidenceDisplayKind("https://files.example/demo.mp4",""))
      .toBe("VIDEO");
    expect(mentorEvidenceDisplayKind("https://files.example/download","video/webm"))
      .toBe("VIDEO");
  });
  it("requires external open for code, office files and opaque providers",()=>{
    expect(mentorEvidenceDisplayKind("https://files.example/trial.xlsx",""))
      .toBe("EXTERNAL");
    expect(mentorEvidenceDisplayKind("https://files.example/source.ts","text/plain"))
      .toBe("EXTERNAL");
    expect(mentorEvidenceDisplayKind("https://files.example/download",""))
      .toBe("EXTERNAL");
  });
  it("never previews script, credential-bearing or absent URLs",()=>{
    for(const url of ["javascript:alert(1)","file:///etc/passwd",
      "https://user:pass@example.com/demo.mp4","not a link",null]){
      expect(mentorEvidenceDisplayKind(url,"video/mp4")).toBe("EXTERNAL");
    }
  });
});
