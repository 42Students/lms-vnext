import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import LoginError from "@/app/login/error";
import PlacementsError from "@/app/placements/error";
import PrivacyError from "@/app/privacy-policy/error";
import QuizError from "@/app/quiz/error";
import PlatformError from "@/app/platform/error";
import LoginLoading from "@/app/login/loading";
import {GracefulErrorBoundary} from "@/components/public/graceful-error-boundary";

vi.mock("@/components/public/graceful-error-boundary",()=>({
 GracefulErrorBoundary:({homeHref="/dashboard"}:{homeHref?:string})=>
  <div role="alert" data-home-href={homeHref}>This page is temporarily unavailable</div>,
}));
vi.mock("@/components/ui/graceful-page-loading",()=>({
 GracefulPageLoading:()=> <div role="status">Loading your page</div>,
}));

const outage=Object.assign(new Error("PRIVATE_PROVIDER_KEY_OR_SQL"),{digest:"private-digest"});
const reset=()=>undefined;

describe("chat-16 public/auth route-level error, recovery and responsive states",()=>{
 it("UX-chat16-login-loading-05 retains the mobile-first width and a visible loading state",()=>{
  const html=renderToStaticMarkup(<LoginLoading/>);
  expect(html).toContain('role="status"');
  expect(html).toContain("max-w-xl");
  expect(html).toContain("sm:py-12");
 });
 it("UX-chat16-login-error-06 directs login recovery to the public sign-in entry only",()=>{
  const html=renderToStaticMarkup(<LoginError error={outage} reset={reset}/>);
  expect(html).toContain("max-w-xl");
  expect(html).toContain('data-home-href="/"');
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("PRIVATE_PROVIDER_KEY_OR_SQL");
  expect(html).not.toContain("private-digest");
 });
 it("UX-chat16-public-route-errors-07 renders retry fallbacks rather than exposing server exceptions",()=>{
  for(const ErrorPage of [PlacementsError,PrivacyError,QuizError,PlatformError]){
   const html=renderToStaticMarkup(<ErrorPage error={outage} reset={reset}/>);
   expect(html).toContain('role="alert"');
   expect(html).toContain("This page is temporarily unavailable");
   expect(html).not.toContain("PRIVATE_PROVIDER_KEY_OR_SQL");
   expect(html).not.toContain("private-digest");
  }
 });
 it("UX-chat16-public-route-errors-08 passes a known shared error component for each route",()=>{
  expect(GracefulErrorBoundary).toBeDefined();
  const html=renderToStaticMarkup(<PlacementsError error={outage} reset={reset}/>);
  expect(html).toContain('data-home-href="/dashboard"');
 });
});
