import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import RetiredHandoffPage from "@/app/auth/handoff/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => { throw new Error("REDIRECT:" + href); }),
}));
beforeEach(() => vi.clearAllMocks());

const visit = (search: {
  token?: string | string[];
  next?: string | string[];
  returnTo?: string | string[];
}) => RetiredHandoffPage({ searchParams: Promise.resolve(search) });

describe("UX-G026 retired handoff protects login destination", () => {
  it("drops cross-host targets, tokens and credentials", async () => {
    await expect(visit({
      token: "old-bearer-credential",
      next: "https://attacker.example/collect?token=old-bearer-credential",
    })).rejects.toThrow("REDIRECT:/login?auth=handoff-retired");
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/login?auth=handoff-retired");
  });

  it("keeps a safe first-party return path but strips unknown query secrets and fragments", async () => {
    const destination = "/learn/courses?tab=active&view=table&code=secret&access_token=stolen#private";
    await expect(visit({token:"old-bearer-credential",returnTo:destination}))
      .rejects.toThrow("REDIRECT:/login?auth=handoff-retired&returnTo=");
    const target = vi.mocked(redirect).mock.calls[0]?.[0];
    expect(target).toBeTruthy();
    const url = new URL(target!, "https://lms.invalid");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("auth")).toBe("handoff-retired");
    expect(url.searchParams.get("returnTo")).toBe("/learn/courses?tab=active&view=table");
    expect(target).not.toContain("old-bearer-credential");
    expect(target).not.toContain("secret");
    expect(target).not.toContain("stolen");
    expect(target).not.toContain("#private");
  });

  it.each(["/auth/handoff", "/auth/handoff?token=secret", "/api/admin", "//attacker.example", "/login", "javascript:alert(1)"])(
    "rejects a non-returnable target %s", async target => {
      await expect(visit({token:"secret",returnTo:target}))
        .rejects.toThrow("REDIRECT:/login?auth=handoff-retired");
    },
  );

  it("ignores array-valued and ambiguous return paths", async () => {
    await expect(visit({token:["old","credential"],returnTo:["/admin","/learn"]}))
      .rejects.toThrow("REDIRECT:/login?auth=handoff-retired");
  });
});
