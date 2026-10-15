import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getOwnLearnerVerificationStatus } from "@/modules/placements/learner-verification-status-service";

const details = [
  { key: "education", heading: "Education", edit: "/learn/profile?section=education" },
  { key: "identity", heading: "Identity", edit: "/learn/profile?section=identity" },
] as const;

export default async function LearnerVerificationPage() {
  const context = await getCurrentRequestContext();
  const status = await getOwnLearnerVerificationStatus(context);
  const label = {
    NOT_SUBMITTED: "Not submitted", WAITING: "Waiting for review",
    SENT_BACK: "Sent back", VERIFIED: "Verified", UPDATE_PENDING: "Update waiting for review",
  } as const;
  return <main className="min-w-0 space-y-6">
    <Link href="/learn/profile" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">← Profile</Link>
    <header><h1 className="text-2xl font-semibold text-foreground">Profile verification</h1>
      <p className="mt-2 text-sm text-body">Your own Education and Identity review status. A saved detail does not mean it is verified.</p>
    </header>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">{details.map(item => {
      const row = status[item.key];
      return <section key={item.key} className="min-w-0 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{item.heading}</h2>
        <p className="mt-2 text-sm font-semibold text-body">{label[row.status]}</p>
        {row.status === "SENT_BACK" ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
          Reason: {row.reason ?? "Contact the placement cell for the review reason."}
        </p> : null}
        <p className="mt-3 text-xs text-muted-foreground">Updating your details does not automatically submit evidence for re-verification.</p>
        <Link href={item.edit} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Review {item.heading.toLowerCase()} details</Link>
      </section>;
    })}</div>
  </main>;
}
