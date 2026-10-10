import { RecruiterInviteLanding } from "@/components/tpo/recruiter-invite-landing";

type PageProps = { params: Promise<{ token: string }> };

export default async function RecruiterInvitePage({ params }: PageProps) {
  const { token } = await params;
  return <RecruiterInviteLanding token={token} />;
}
