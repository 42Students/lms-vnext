import {describe,expect,it} from "vitest";
import {learnerCourseAboutSource} from "@/modules/courses/learner-course-about-model";
describe("Course About text source transparency",()=>{
  it("uses explicitly authored HTML before catalogue and learning-path fallbacks",()=>{
    expect(learnerCourseAboutSource({
      safeBodyHtml:"<p>Authored</p>",courseDescription:"Catalogue",
      learningPathDescription:"Path",
    }).source).toBe("AUTHORED");
    expect(learnerCourseAboutSource({
      safeBodyHtml:null,courseDescription:"Catalogue",learningPathDescription:"Path",
    }).source).toBe("CATALOGUE");
    expect(learnerCourseAboutSource({
      safeBodyHtml:null,courseDescription:null,learningPathDescription:"Path",
    }).source).toBe("PATH");
  });
  it("recognizes authored introduction or outcomes even without a body",()=>{
    expect(learnerCourseAboutSource({
      safeBodyHtml:null,courseDescription:null,learningPathDescription:null,
      introductionText:"Welcome to the course",takeaways:[],
    }).source).toBe("SUMMARY");
    expect(learnerCourseAboutSource({
      safeBodyHtml:null,courseDescription:null,learningPathDescription:null,
      introductionText:" ",takeaways:["Build a model"],
    }).source).toBe("SUMMARY");
    expect(learnerCourseAboutSource({
      safeBodyHtml:null,courseDescription:"Catalogue",learningPathDescription:null,
      introductionText:"Welcome",takeaways:[],
    }).source).toBe("CATALOGUE");
  });
  it("does not claim a description where none is published",()=>{
    expect(learnerCourseAboutSource({
      safeBodyHtml:" ",courseDescription:" ",learningPathDescription:null,
    })).toEqual({source:"NONE",hasDescription:false,label:"No description has been published"});
  });
});
