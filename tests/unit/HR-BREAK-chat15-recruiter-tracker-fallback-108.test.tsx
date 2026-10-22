import {describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactElement,type ReactNode} from "react";
import RecruiterLoading from "@/app/(authenticated)/recruiter/loading";
import RecruiterError from "@/app/(authenticated)/recruiter/error";
import RecruiterNotFound from "@/app/(authenticated)/recruiter/not-found";
import TrackerLoading from "@/app/(authenticated)/tracker/loading";
import TrackerError from "@/app/(authenticated)/tracker/error";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import {GracefulErrorBoundary} from "@/components/public/graceful-error-boundary";
import {GracefulScreen} from "@/components/public/graceful-screen";
import {PageBackLink} from "@/components/ui/page-back-link";
import {PageHeader} from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

function elements(node:ReactNode):ReactElement[]{
 if(Array.isArray(node))return node.flatMap(elements);
 if(!isValidElement(node))return [];
 const p=node.props as {children?:ReactNode};
 return [node,...elements(p.children)];
}
function words(node:ReactNode):string{
 if(Array.isArray(node))return node.map(words).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 return words((node.props as {children?:ReactNode}).children);
}
describe("HR-TRACKER-FALLBACK-108 bounded recruiter and tracker page recovery",()=>{
 it("loading routes delegate to the shared bounded loading state instead of a blank page",()=>{
  for(const screen of [RecruiterLoading(),TrackerLoading()]){
   expect(elements(screen).some(el=>el.type===GracefulPageLoading)).toBe(true);
  }
 });
 it("errors keep their own retry handler and use the private-safe shared boundary",()=>{
  const reset=vi.fn();const error=new Error("secret SQL token") as Error & {digest?:string};
  error.digest="private-digest";
  const recruiter=RecruiterError({error,reset});
  const tracker=TrackerError({error,reset});
  for(const result of [recruiter,tracker]){
   expect(result.type).toBe(GracefulErrorBoundary);
   expect((result.props as {reset:()=>void}).reset).toBe(reset);
  }
 });
 it("not-found route has actionable legacy fallback with no private object disclosure",()=>{
  const fallback=RecruiterNotFound();
  expect(elements(fallback).some(el=>el.type===PageHeader &&
    (el.props as {title:string}).title==="Page not found")).toBe(true);
  expect(elements(fallback).some(el=>el.type===PageBackLink &&
    (el.props as {href:string}).href==="/hr/home")).toBe(true);
 });
 it("visible retry button invokes its provided reset exactly once",()=>{
  const reset=vi.fn();
  const output=GracefulScreen({title:"Temporarily unavailable",
   message:"Try again shortly.",retry:reset,homeHref:"/recruiter"});
  const retry=elements(output).find(el=>(el.type===Button&&
   words((el.props as {children?:ReactNode}).children).includes("Try again")));
  expect(retry).toBeDefined();
  (retry!.props as {onClick:()=>void}).onClick();
  expect(reset).toHaveBeenCalledTimes(1);
  expect(words(output)).not.toContain("secret SQL token");
 });
});