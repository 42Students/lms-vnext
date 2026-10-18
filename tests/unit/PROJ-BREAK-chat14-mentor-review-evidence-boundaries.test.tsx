import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import MentorReviewLoading from "@/app/(authenticated)/mentor/projects/[projectId]/review-completeness/loading";
import MentorReviewError from "@/app/(authenticated)/mentor/projects/[projectId]/review-completeness/error";

describe("Mentor review evidence loading and failed-read boundaries",()=>{
 it("PROJ-BREAK-MENTOR-387 shows accessible progress without private project information",()=>{
  const html=renderToStaticMarkup(<MentorReviewLoading />);
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain("Loading delivery review completeness");
  expect(html).not.toContain("learner");
  expect(html).not.toContain("/api/projects/");
 });
 it("PROJ-BREAK-MENTOR-388 failed review queries never imply an unsubmitted version or leak backend details",()=>{
  const html=renderToStaticMarkup(<MentorReviewError
   error={new Error("SQLSTATE 23505: HIDDEN_REVIEW_ROW")}
   reset={()=>{}} />);
  expect(html).toContain('role="alert"');
  expect(html).toContain("Delivery review read failed");
  expect(html).toContain("Unavailable records do not prove a missing submission");
  expect(html).toContain("Retry");
  expect(html).not.toContain("SQLSTATE");
  expect(html).not.toContain("HIDDEN_REVIEW_ROW");
 });
});
