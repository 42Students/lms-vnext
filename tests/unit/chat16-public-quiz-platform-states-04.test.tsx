import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import LearnerQuizAttemptPage from "@/app/quiz/page";
import PlatformMarketingPage,{metadata as platformMetadata} from "@/app/platform/page";
import PublicPlacementNotFound from "@/app/placements/not-found";
import PlatformLoading from "@/app/platform/loading";
import QuizLoading from "@/app/quiz/loading";
import PlacementsLoading from "@/app/placements/loading";
import PrivacyLoading from "@/app/privacy-policy/loading";

vi.mock("@/components/courses/learner-quiz-attempt",()=>({
 LearnerQuizAttempt:()=> <section aria-label="Attempt workspace">Authorized attempt placeholder</section>,
}));
vi.mock("@/components/ui/graceful-page-loading",()=>({
 GracefulPageLoading:()=> <div role="status">Loading your page</div>,
}));

describe("chat-16 public routes, quiz entry and resilient loading surfaces",()=>{
 it("UX-chat16-public-quiz-page-01 preserves the legacy all-quizzes return route on mobile",()=>{
  const html=renderToStaticMarkup(<LearnerQuizAttemptPage/>);
  expect(html).toContain('href="/learn/allQuizzes"');
  expect(html).toContain("All Quizzes");
  expect(html).toContain("min-h-11");
  expect(html).toContain("sm:px-6");
  expect(html).toContain("Attempt workspace");
  expect(html).not.toContain("private student token");
 });
 it("UX-chat16-public-platform-page-02 offers distinct learner, faculty, mentor, placement and recruiter descriptions",()=>{
  const html=renderToStaticMarkup(<PlatformMarketingPage/>);
  expect(platformMetadata.title).toBe("Platform | 42 LMS");
  for(const text of ["Learner workspace","Faculty workspace","Mentor workspace",
   "Placement workspace","HR workspace","Connected platform pillars"]){
   expect(html).toContain(text);
  }
  expect(html).toContain("Discover needs");
  expect(html).toContain("Interview");
 });
 it("UX-chat16-public-placement-404-03 explains absent publication without leaking a tenant or query",()=>{
  const html=renderToStaticMarkup(<PublicPlacementNotFound/>);
  expect(html).toContain("This page isn");
  expect(html).toContain("hasn");
  expect(html).not.toContain("SQL");
  expect(html).not.toContain("not_found");
 });
 it("UX-chat16-public-loading-04 exposes recoverable loading for all public route families",()=>{
  for(const Page of [PlatformLoading,QuizLoading,PlacementsLoading,PrivacyLoading]){
   const html=renderToStaticMarkup(<Page/>);
   expect(html).toContain('role="status"');
   expect(html).toContain("Loading your page");
  }
  expect(GracefulPageLoading).toBeDefined();
 });
});
