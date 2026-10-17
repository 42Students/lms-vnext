import { redirect } from "next/navigation";
import { safeReturnTo } from "@/lib/return-to";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ recruiter?: string | string[]; returnTo?: string | string[] }>;
}) {
  const { recruiter, returnTo } = await searchParams;
  const selected = Array.isArray(recruiter) ? recruiter[0] : recruiter;
  // Old recruiter invitation links intentionally open the email-first form.
  const requested = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const target = safeReturnTo(requested);
  const prefix = selected === "email" ? "/?recruiter=email" : "/";
  redirect(target ? `${prefix}${prefix.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(target)}` : prefix);
}
