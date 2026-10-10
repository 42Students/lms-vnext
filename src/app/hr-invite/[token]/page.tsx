import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ token: string }> };

export default async function LegacyHrInviteAlias({ params }: PageProps) {
  const { token } = await params;
  redirect("/recruiter-invite/" + encodeURIComponent(token));
}
