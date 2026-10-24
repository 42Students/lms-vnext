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
  it("sandboxes common README, source-code and text evidence while keeping office files external",()=>{
    for(const file of ["README.md","source.ts","source.tsx","query.sql",
      "data.json","overview.txt","metrics.csv","config.yaml","script.py"]){
      expect(mentorEvidenceDisplayKind("https://files.example/"+file+"?grant=short",""))
        .toBe("TEXT");
    }
    expect(mentorEvidenceDisplayKind("https://files.example/download","text/plain"))
      .toBe("TEXT");
    expect(mentorEvidenceDisplayKind("https://files.example/download","application/json"))
      .toBe("TEXT");
    expect(mentorEvidenceDisplayKind("https://files.example/trial.xlsx",""))
      .toBe("EXTERNAL");
    expect(mentorEvidenceDisplayKind("https://files.example/results.ods",""))
      .toBe("EXTERNAL");
    expect(mentorEvidenceDisplayKind("https://files.example/download",""))
      .toBe("EXTERNAL");
  });
  it("does not frame active HTML/SVG or unsupported executable script MIME types",()=>{
    for(const file of ["payload.html","vector.svg","binary.exe","macro.xlsm"]){
      expect(mentorEvidenceDisplayKind("https://files.example/"+file,""))
        .toBe("EXTERNAL");
    }
    expect(mentorEvidenceDisplayKind("https://files.example/download","text/html"))
      .toBe("EXTERNAL");
    expect(mentorEvidenceDisplayKind("https://files.example/download","image/svg+xml"))
      .toBe("EXTERNAL");
  });
  it("never previews script, credential-bearing or absent URLs",()=>{
    for(const url of ["javascript:alert(1)","file:///etc/passwd",
      "https://user:pass@example.com/demo.mp4","not a link",null]){
      expect(mentorEvidenceDisplayKind(url,"video/mp4")).toBe("EXTERNAL");
    }
  });
});
