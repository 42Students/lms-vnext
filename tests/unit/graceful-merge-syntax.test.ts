import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as ts from "typescript";
import { browserErrorSchema } from "@/modules/log-alerts/client-report";

/** No execution of the UI is required for a TSX parse-only merge gate. */
function syntaxErrors(file: string): string[] {
  const result = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  return (result.diagnostics ?? [])
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
}

describe("graceful merge syntax and integration contracts", () => {
  it("GR-53 parses the merged login form and keeps guarded request parentheses balanced", () => {
    const file = "src/components/auth/login-form.tsx";
    const source = readFileSync(file, "utf8");
    expect(syntaxErrors(file)).toEqual([]);
    expect(source.match(/runGuarded\(\(\) => post</g)).toHaveLength(3);
    expect(source).toContain("It expires in 5 minutes.");
    expect(source).toContain('safeReturnTo(result.data.next)');
    expect(source).toContain("window.clearTimeout(slowNotice)");
  });

  it("GR-11 parses the root boundaries and reports only schema-approved properties", () => {
    for (const file of [
      "src/components/public/graceful-error-boundary.tsx",
      "src/app/error.tsx",
      "src/app/global-error.tsx",
    ]) {
      expect(syntaxErrors(file), file).toEqual([]);
    }
    const report = {
      message: "A page could not be displayed.",
      name: "RenderFailure",
      component: "GracefulErrorBoundary",
      event: "render",
      path: "/learn/dashboard",
      requestId: "00000000-0000-4000-8000-0000abcd1234",
    };
    expect(browserErrorSchema.safeParse(report).success).toBe(true);
    expect(browserErrorSchema.safeParse({ ...report, kind: "render" }).success).toBe(true);
    expect(browserErrorSchema.safeParse({ ...report, kind: "unknown_kind" }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ ...report, exception: "private details" }).success).toBe(false);
  });
});
