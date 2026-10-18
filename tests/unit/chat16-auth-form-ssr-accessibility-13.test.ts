import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LoginForm } from "@/components/auth/login-form";

const html = (options: Parameters<typeof LoginForm>[0]) =>
  renderToStaticMarkup(createElement(LoginForm, options));

describe("chat-16 OTP form real SSR accessibility and tenant channel contracts", () => {
  it("AUTH-FORM-UX-01 renders reachable email and phone tabs with one active selected method", () => {
    const markup = html({
      collegeName: "IIT Dharwad", defaultChannel: "EMAIL",
      allowedChannels: ["EMAIL", "PHONE"],
    });
    expect(markup).toContain('aria-label="Sign in to IIT Dharwad"');
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup).toContain('aria-selected="false"');
    expect(markup).toContain('type="email"');
    expect(markup).toContain("Privacy Policy");
    expect(markup).toContain("Continue");
    expect(markup).not.toContain('name="code"');
  });

  it("AUTH-FORM-UX-02 a phone-only tenant does not display an email switch or email field", () => {
    const markup = html({
      collegeName: "IIT Dharwad", defaultChannel: "PHONE",
      allowedChannels: ["PHONE"],
    });
    expect(markup).toContain('type="tel"');
    expect(markup).toContain("Mobile number");
    expect(markup).not.toContain('role="tablist"');
    expect(markup).not.toContain('type="email"');
  });

  it("AUTH-FORM-UX-03 an email-only tenant cannot accidentally show a phone login method", () => {
    const markup = html({ allowedChannels: ["EMAIL"], defaultChannel: "EMAIL" });
    expect(markup).toContain('type="email"');
    expect(markup).not.toContain('type="tel"');
    expect(markup).not.toContain('role="tablist"');
    expect(markup).toContain("Use your registered email address.");
  });
});
