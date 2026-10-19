export function CourseDisplayReadOnly({
  introductionText,
  bodyHtml,
  takeaways,
  fallbackDescription,
}: {
  introductionText: string | null;
  bodyHtml: string | null;
  takeaways: readonly string[];
  fallbackDescription: string | null;
}) {
  const hasContent =
    Boolean(introductionText?.trim()) ||
    Boolean(bodyHtml?.trim()) ||
    takeaways.length > 0 ||
    Boolean(fallbackDescription?.trim());

  if (!hasContent) return null;

  return (
    <section
      className="border-b border-border pb-5"
      aria-label="Course overview"
    >
      <h2 className="m-0 text-lg font-semibold text-foreground">
        About this course
      </h2>

      {introductionText?.trim() ? (
        <p className="mt-2 text-sm font-medium leading-6 text-foreground">
          {introductionText}
        </p>
      ) : null}

      {takeaways.length > 0 ? (
        <div className="mt-4">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            What you&apos;ll learn
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {takeaways.map((takeaway, index) => (
              <li
                key={`${index}:${takeaway}`}
                className="flex items-start gap-2 text-sm text-body"
              >
                <span aria-hidden="true" className="mt-0.5 text-primary-text">
                  ✓
                </span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {bodyHtml ? (
        <div
          className="mt-4 space-y-2 text-sm leading-6 text-body [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : fallbackDescription?.trim() ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {fallbackDescription}
        </p>
      ) : null}
    </section>
  );
}
