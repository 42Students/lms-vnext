import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import GlobalError from "@/app/global-error";

describe("GR-11 custom root error boundary", () => {
  it("GR-11 renders calm heading, retry and home recovery with no technical content", () => {
    const reset = vi.fn();
    const markup = renderToStaticMarkup(createElement(GlobalError, {
      error: Object.assign(new Error("SECRET_STACK_MARKER: DB password hidden"), { digest: "secret-digest" }),
      reset,
    }));
    expect(markup).toContain("This page is temporarily unavailable");
    expect(markup).toContain("Try again");
    expect(markup).toContain("Go to home");
    expect(markup).toContain("<html");
    expect(markup).toContain("<body");
    expect(markup).not.toContain("SECRET_STACK_MARKER");
    expect(markup).not.toContain("secret-digest");
    expect(markup).not.toContain("password hidden");
    expect(reset).not.toHaveBeenCalled();
  });
  it("GR-11 does not expose stack traces even if the error has sensitive fields", () => {
    const error = Object.assign(new Error("internal SQL failure"), {
      stack: "Error: /srv/private/app/db.ts at Database.connect SECRET_STACK_MARKER",
      digest: "db-query-unsafe",
    });
    const markup = renderToStaticMarkup(createElement(GlobalError, { error, reset: vi.fn() }));
    expect(markup).toContain("Something went wrong on our side");
    expect(markup).not.toContain("internal SQL failure");
    expect(markup).not.toContain("SECRET_STACK_MARKER");
    expect(markup).not.toContain("/srv/private");
    expect(markup).not.toContain("db-query-unsafe");
  });
});
