import {describe,expect,it} from "vitest";
import nextConfig from "../../next.config";

describe("Retired Mentor navigation route parity",()=>{
 it("redirects old course, quiz, file, profile and contact URLs to Projects",async()=>{
  const redirects=await nextConfig.redirects?.();
  expect(redirects).toBeDefined();
  const route=(source:string)=>redirects?.find(row=>row.source===source);
  for(const source of ["/mentor/courses","/mentor/courses/:path*",
    "/mentor/quizzes","/mentor/quizzes/:path*","/mentor/allQuizzes",
    "/mentor/allQuizzes/:path*","/mentor/fileExplorer",
    "/mentor/fileExplorer/:path*","/mentor/files","/mentor/files/:path*",
    "/mentor/contacts","/mentor/contacts/:path*","/mentor/profile"]){
    expect(route(source)?.destination,source).toBe("/mentor/projects");
    expect(route(source)?.permanent,source).toBe(false);
  }
 });
});
