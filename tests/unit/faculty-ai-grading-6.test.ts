import {it,expect} from "vitest";
import {readFacultyAiGradingJson,FacultyAiGradingBodyTooLarge,FacultyAiGradingBadMediaType} from "@/modules/courses/faculty-ai-grading-request";
it("streams and bounds request bytes before parsing JSON",async()=>{
 const okay=new Request("https://example.edu/api/ai-grading/suggest",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({rubric:"safe"})});
 expect(await readFacultyAiGradingJson(okay)).toEqual({rubric:"safe"});
 const huge=new Request("https://example.edu",{method:"POST",headers:{"content-type":"application/json"},body:"x".repeat(70000)});
 await expect(readFacultyAiGradingJson(huge)).rejects.toBeInstanceOf(FacultyAiGradingBodyTooLarge);
 const bad=new Request("https://example.edu",{method:"POST",headers:{"content-type":"text/plain"},body:"hi"});
 await expect(readFacultyAiGradingJson(bad)).rejects.toBeInstanceOf(FacultyAiGradingBadMediaType);
});
