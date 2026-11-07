import type { Metadata } from "next";
import { LearnerRollNumberLogin } from "@/components/auth/learner-roll-number-login";
import { Heading } from "@/components/ui/heading";

export const metadata: Metadata = {
  title: "Student login | 42LMS",
  description: "Sign in using the roll number issued by your participating college.",
  robots: { index: false, follow: false },
};

/** UX-G086: public roll-number entry; the server still enforces tenant and OTP policy. */
export default function RollNumberLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-6 space-y-2 text-center sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
          College sign-in
        </p>
        <Heading level={1} size="2xl">Student login</Heading>
        <p className="mx-auto max-w-md text-sm leading-6 text-body">
          Use your college-issued roll number to receive a one-time verification code.
        </p>
      </header>
      <LearnerRollNumberLogin />
    </main>
  );
}
