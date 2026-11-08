import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageLoading } from "@/components/ui/page-loading";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Pagination } from "@/components/ui/pagination";

describe("UX-G164 shared accessible UI states", () => {
  it("announces standalone skeletons but keeps nested placeholders decorative", () => {
    const standalone = renderToStaticMarkup(<Skeleton label="Loading roster" count={2} />);
    const hidden = renderToStaticMarkup(<Skeleton decorative label="Duplicate loading" />);
    expect(standalone).toContain('role="status"');
    expect(standalone).toContain("Loading roster");
    expect(hidden).toContain('aria-hidden="true"');
    expect(hidden).not.toContain('role="status"');
    expect(hidden).not.toContain("Duplicate loading");
  });
  it("has exactly one announcement per nested loading component", () => {
    for (const html of [
      renderToStaticMarkup(<GracefulPageLoading label="Loading directory" shape="directory" />),
      renderToStaticMarkup(<PageLoading label="Loading cards" variant="card" count={3} />),
    ]) {
      expect((html.match(/role="status"/g) ?? [])).toHaveLength(1);
      expect(html).toContain('aria-hidden="true"');
    }
  });
  it("keeps form labels, existing hints and validation error associations", () => {
    const html = renderToStaticMarkup(<FormField id="workspace-name" label="Workspace name"
      helper="Use a clear name" required error="A name is required.">
      {field => <Input {...field} aria-describedby="existing-tip" />}
    </FormField>);
    expect(html).toContain('for="workspace-name"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-errormessage="workspace-name-error"');
    expect(html).toContain("existing-tip workspace-name-hint workspace-name-error");
  });
  it("aligns live priority with an explicitly overridden notice role", () => {
    const quiet = renderToStaticMarkup(<InlineNotice tone="error" role="status" message="Try again" />);
    const urgent = renderToStaticMarkup(<InlineNotice tone="error" message="Review error" />);
    expect(quiet).toContain('role="status"');
    expect(quiet).toContain('aria-live="polite"');
    expect(urgent).toContain('role="alert"');
    expect(urgent).toContain('aria-live="assertive"');
  });
  it("never shows a non-existent result as visible on an old filtered page", () => {
    const html = renderToStaticMarkup(<Pagination page={9} pageCount={10}
      totalItems={3} pageSize={5} hrefForPage={page => "/results?page=" + page} />);
    expect(html).toContain("Showing 0–0 of 3");
    expect(html).toContain('aria-current="page"');
    const unsafe = renderToStaticMarkup(<Pagination page={2} pageCount={4}
      hrefForPage={() => "https://example.org/unsafe"} />);
    expect(unsafe).not.toContain('href="https://example.org/unsafe"');
  });
});
