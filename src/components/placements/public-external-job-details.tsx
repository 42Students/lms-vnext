import { ButtonLink } from "@/components/ui/button-link";
import { Heading } from "@/components/ui/heading";

export type PublicExternalJobSummary = {
  title: string;
  companyName: string;
  description: string;
  workMode: string;
  applyHref: string;
};

/** Public presentation only; the route's tenant, publishing and URL gates remain server-owned. */
export function PublicExternalJobDetails({ job }: { job: PublicExternalJobSummary }) {
  return <main className="mx-auto w-full max-w-3xl min-w-0 px-4 py-6 sm:px-6 sm:py-10">
    <article className="min-w-0 space-y-6 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 sm:p-8" aria-labelledby="external-job-title">
      <header className="min-w-0 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-primary-text">
          External employer opportunity
        </p>
        <Heading level={1} size="2xl" id="external-job-title" className="break-words">
          {job.title}
        </Heading>
        <p className="break-words text-base font-semibold text-body">{job.companyName}</p>
        <p className="text-sm text-body">
          <span className="font-semibold">Work mode:</span> {job.workMode.replaceAll("_", " ")}
        </p>
      </header>
      <section className="min-w-0 space-y-3" aria-labelledby="external-job-description">
        <Heading level={2} size="lg" id="external-job-description">About this role</Heading>
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-body">{job.description}</p>
      </section>
      <aside role="note" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-primary-subtle p-4 text-sm leading-6 text-body">
        You will apply directly on the employer's website. 42 LMS does not receive or confirm your application submission there.
      </aside>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-start">
        <ButtonLink variant="primary" href={job.applyHref} target="_blank"
          rel="noopener noreferrer" style={{ minHeight: 44 }} className="w-full sm:w-auto">
          Continue to employer website <span aria-hidden="true">↗</span>
        </ButtonLink>
        <p className="text-xs text-muted-foreground">The employer website opens in a new tab.</p>
      </div>
    </article>
  </main>;
}
