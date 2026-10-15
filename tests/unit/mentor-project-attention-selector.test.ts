import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const code=readFileSync(join(process.cwd(),"src/components/projects/project-participant-list-controls.tsx"),"utf8");
describe("Mentor project attention selector",()=>{
  it("renders all registered Mentor options in a single JSX fragment",()=>{
    expect(code).toContain("{mentor ? (\n              <>");
    for(const key of ["MENTOR_REVIEW","MENTOR_REQUESTED","MENTOR_STALLED","MENTOR_MEETING_SOON","MENTOR_ANY_ATTENTION","MENTOR_NO_ATTENTION"])
      expect(code).toContain('<option value="'+key+'">');
  });
});
