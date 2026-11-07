import type { Metadata } from "next";
import { RecruiterInviteLanding } from "@/components/tpo/recruiter-invite-landing";

/** This page contains a bearer invitation token in its URL. Never pre-render,
 * index, archive, or disclose its URL as a cross-site referrer. */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Recruiter invitation | 42LMS",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

type PageProps = { params: Promise<{ token: string }> };

export default async function RecruiterInvitePage({ params }: PageProps) {
  const { token } = await params;
  return <RecruiterInviteLanding token={token} />;
}
