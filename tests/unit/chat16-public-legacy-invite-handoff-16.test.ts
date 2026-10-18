import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound, redirect } from "next/navigation";
import LegacyHrInvite from "@/app/hr-invite/[token]/page";
import RetiredHandoffPage from "@/app/auth/handoff/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => { throw new Error("NEXT_REDIRECT:" + href); }),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));
beforeEach(() => vi.clearAllMocks());

describe("chat-16 legacy invitation and handoff page-level journeys", () => {
  it("UX-hr-invite-direct-16 maps a valid token to an internal first-party invitation", async () => {
    await expect(LegacyHrInvite({
      params: Promise.resolve({ token: "abcdefgh1234" }),
    })).rejects.toThrow("NEXT_REDIRECT:/recruiter-invite/abcdefgh1234");
    expect(redirect).toHaveBeenCalledWith("/recruiter-invite/abcdefgh1234");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("UX-hr-invite-denied-16 makes malformed, foreign and oversized invitation URLs not-found", async () => {
    for (const token of ["../admin", "https://attacker.example.com", "a".repeat(513), "short"]) {
      await expect(LegacyHrInvite({
        params: Promise.resolve({ token }),
      })).rejects.toThrow("NEXT_NOT_FOUND");
    }
    expect(redirect).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalledTimes(4);
  });

  it("UX-handoff-direct-16 ignores legacy cross-host credentials and never accepts token exchange", () => {
    expect(() => RetiredHandoffPage()).toThrow("NEXT_REDIRECT:/?auth=handoff-retired");
    expect(redirect).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/?auth=handoff-retired");
  });
});
