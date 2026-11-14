import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { JOBS, jobCredential } from "@/security/jobs";

const routeFiles = () =>
  execFileSync("git", ["grep", "-l", "internalRoute(", "--", "src/app"], { encoding: "utf8" }).split("\n").filter(Boolean);

function pathOf(file: string): string {
  return "/" + file.replace(/^src\/app\//, "").replace(/\/route\.ts$/, "");
}

describe("job registry", () => {
  it("lists exactly the machine-called routes that exist, at the paths they live at", () => {
    const fromSource = routeFiles().map(pathOf).sort();
    expect(JOBS.map((j) => j.path).sort()).toEqual(fromSource);
  });

  it("every route takes its name and credential from the registry, never inline", () => {
    for (const file of routeFiles()) {
      const source = readFileSync(file, "utf8");
      const name = /name:\s*"([^"]+)"/.exec(source)?.[1];
      const job = JOBS.find((j) => j.path === pathOf(file));
      expect(job, file).toBeDefined();
      expect(name, file).toBe(job!.name);
      expect(source, file).toContain(`credential: jobCredential("${job!.name}")`);
      expect(source, file).not.toMatch(/credential:\s*\{/);
      const method = /export const (GET|POST) = internalRoute\(/.exec(source)?.[1];
      expect(method, file).toBe(job!.method);
    }
  });

  it("job names are unique and each secret is a named environment variable", () => {
    expect(new Set(JOBS.map((j) => j.name)).size).toBe(JOBS.length);
    for (const job of JOBS) {
      expect(job.credential.secretEnv, job.name).toMatch(/^[A-Z][A-Z0-9_]+$/);
      if (job.credential.kind === "header") expect(job.credential.header, job.name).toMatch(/^x-[a-z-]+$/);
      expect(jobCredential(job.name)).toEqual(job.credential);
    }
  });
});
