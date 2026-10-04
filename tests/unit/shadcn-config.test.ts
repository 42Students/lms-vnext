import fs from "node:fs";
import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

const config = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "components.json",
    ),
    "utf8",
  ),
) as {
  style: string;
  rsc: boolean;
  tsx: boolean;
  tailwind: {
    config: string;
    css: string;
    baseColor: string;
    cssVariables: boolean;
  };
  aliases: Record<string, string>;
};

const globals = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/globals.css",
  ),
  "utf8",
);

describe("shadcn configuration", () => {
  it("targets the existing Tailwind v4/RSC project structure", () => {
    expect(config).toMatchObject({
      style: "new-york",
      rsc: true,
      tsx: true,
      tailwind: {
        config: "",
        css: "src/app/globals.css",
        baseColor: "neutral",
        cssVariables: true,
      },
      aliases: {
        components: "@/components",
        ui: "@/components/ui",
        lib: "@/lib",
        utils: "@/lib/class-names",
        hooks: "@/hooks",
      },
    });
  });

  it("maps shadcn semantic tokens back to canonical LMS tokens", () => {
    for (const mapping of [
      "--primary: var(--lms-primary);",
      "--primary-foreground: var(--lms-white);",
      "--background: var(--lms-page-background);",
      "--card: var(--lms-surface);",
      "--muted: var(--lms-neutral-100);",
      "--accent: var(--lms-primary-subtle);",
      "--destructive: var(--lms-error);",
      "--border: var(--lms-border);",
      "--ring: var(--lms-primary);",
    ]) {
      expect(globals).toContain(mapping);
    }
  });

  it("does not import a default shadcn theme over the LMS palette", () => {
    expect(globals).not.toContain(
      '@import "shadcn/tailwind.css"',
    );
    expect(globals).not.toContain(
      '@import "tw-animate-css"',
    );
  });
});
