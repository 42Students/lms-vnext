"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";

/** UX-G085: email-client CTA remains primary; copy is an accessible fallback. */
export function DemoContactActions({ email, mailtoHref }: {
  email: string;
  mailtoHref: string;
}) {
  const [copyFeedback, setCopyFeedback] = useState("");

  async function copyEmail() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      setCopyFeedback("Email address copied");
    } catch {
      setCopyFeedback("Copy isn't available here. Select the address below to copy it manually.");
    }
  }

  return <>
    <div className="mt-5 flex min-w-0 flex-wrap items-center justify-start gap-3">
      <ButtonLink variant="secondary" href={mailtoHref} className="min-h-11">
        Email us to book a demo
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </ButtonLink>
      <Button type="button" variant="secondary" onClick={() => void copyEmail()}
        className="min-h-11">
        Copy email address
      </Button>
    </div>
    <p role="status" aria-live="polite" className="mt-3 break-words text-sm leading-6 text-[color:var(--lms-on-primary)]">
      {copyFeedback}
    </p>
    <p className="mt-2 break-words text-sm leading-6 text-[color:color-mix(in_srgb,var(--lms-white)_85%,transparent)]">
      Or write to{" "}
      <TextLink href={"mailto:" + email} className="break-all text-[color:var(--lms-primary-light)]">
        {email}
      </TextLink>
    </p>
  </>;
}
