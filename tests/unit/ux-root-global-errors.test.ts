import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { friendlyReference } from "@/lib/friendly-error";
import { isStaleChunkError } from "@/components/public/graceful-error-boundary";

const source = (path: string) => readFileSync(path, "utf8");

describe("UX-G185 root error recovery invariants", () => {
  it("keeps genuine root and global error boundaries using sanitized reporting", () => {
    expect(source("src/app/error.tsx")).toContain("GracefulErrorBoundary");
    expect(source("src/app/global-error.tsx")).toContain("GracefulErrorBoundary");
    const boundary = source("src/components/public/graceful-error-boundary.tsx");
    expect(boundary).toContain('message: "A page could not be displayed."');
    expect(boundary).toContain("requestId: reportId");
    expect(boundary).toContain("sessionStorage.setItem(key, \"yes\")");
    expect(boundary).toContain('data-root-error="true"');
    expect(boundary).toContain('id="root-error-status"');
    expect(boundary).toContain("RootErrorReference");
    expect(isStaleChunkError(new Error("ChunkLoadError"))).toBe(true);
  });

  it("shows only locally generated support codes, never raw error messages", () => {
    expect(friendlyReference("a1b2c3d4")).toBe("Reference: a1b2c3d4");
    expect(friendlyReference("database.password")).toBeNull();
    expect(friendlyReference("")).toBeNull();
    const copySource = source("src/components/public/root-error-reference.tsx");
    expect(copySource).toContain('navigator.clipboard.writeText(code)');
    expect(copySource).toContain("Copy isn't available here.");
    expect(copySource).not.toContain("error.message");
    expect(copySource).not.toContain("error.digest");
  });
});

describe("UX-G186 global fallback invariants", () => {
  it("provides a standalone document, anti-indexing and no app layout dependencies", () => {
    const global = source("src/app/global-error.tsx");
    expect(global).toContain('<html lang="en" data-lms-global-error="true">');
    expect(global).toContain('<title>Page unavailable · 42LMS</title>');
    expect(global).toContain('<meta name="robots" content="noindex,nofollow" />');
    expect(global).toContain('<style>{fallbackCss}</style>');
    expect(global).toContain('min-height: 100dvh');
    expect(global).toContain(":focus-visible");
    expect(global).not.toContain("error.message");
    expect(global).not.toContain("error.digest");
  });

  it("keeps browser fixture disabled in production under all flags", () => {
    const fixture = source("src/app/e2e/ux-root-error-fixture/page.tsx");
    expect(fixture).toContain('process.env.NODE_ENV !== "development"');
    expect(fixture).toContain('env.UX_ROOT_ERROR_FIXTURE !== "1"');
    expect(fixture).toContain("notFound()");
  });
});
