import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect,vi} from "vitest";
import GlobalError from "@/app/global-error";

describe("Root Custom 500 global-error boundary",()=>{
 it("renders the public heading, semantic retry and safe recovery links",()=>{
  const reset=vi.fn();
  const markup=renderToStaticMarkup(createElement(GlobalError,{
   error:Object.assign(new Error("SECRET_STACK_MARKER: DB password hidden"),{digest:"secret-digest"}),
   reset,
  }));
  expect(markup).toMatch(/<h1[^>]*>Server Error<\/h1>/);
  expect(markup).toContain("Try again");
  expect(markup).toContain("Go back");
  expect(markup).toContain("Go to Home");
  expect(markup).toContain("<html");
  expect(markup).toContain("<body");
  expect(markup).not.toContain("SECRET_STACK_MARKER");
  expect(markup).not.toContain("secret-digest");
  expect(markup).not.toContain("password hidden");
  expect(reset).not.toHaveBeenCalled();
 });
 it("does not expose a stack trace even if the Error has sensitive fields",()=>{
  const error=Object.assign(new Error("internal SQL failure"),{
   stack:"Error: /srv/private/app/db.ts at Database.connect SECRET_STACK_MARKER",
   digest:"db-query-unsafe",
  });
  const markup=renderToStaticMarkup(createElement(GlobalError,{error,reset:vi.fn()}));
  expect(markup).toContain("Something went wrong on our side");
  expect(markup).not.toContain("internal SQL failure");
  expect(markup).not.toContain("SECRET_STACK_MARKER");
  expect(markup).not.toContain("/srv/private");
  expect(markup).not.toContain("db-query-unsafe");
 });
});
