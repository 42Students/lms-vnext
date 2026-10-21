import { Badge } from "@/components/ui/badge";

/** Source crosswalk for later audited legacy imports:
 * legacy overview JSON -> overview.goal/deliverables/definitionOfDone;
 * legacy delivery JSON -> submission settings (retained separately);
 * scalar courseLabel/phase/status/lifecycleStatus -> legacy scalar metadata.
 * Never coerce unknown legacy lifecycle enums into publish permissions.
 */
type ProjectTemplateBlueprintView = {
  legacy?: {
    courseLabel?:string|null;phase?:string|null;status?:string|null;
    lifecycleStatus?:string|null;
  };
  submission?: {instructions?:string;requiredEvidence?:readonly string[]};
  overview?: {
    goal?: string;
    deliverables?: readonly string[];
    definitionOfDone?: readonly string[];
  };
  releases?: readonly {
    key?: string;
    title?: string;
    description?: string;
  }[];
  sprints?: readonly {
    key?: string;
    title?: string;
    description?: string;
    releaseKey?: string;
  }[];
  tasks?: readonly {
    key?: string;
    title?: string;
    description?: string;
    sprintKey?: string;
    priority?: string;
  }[];
  resources?: readonly {
    key?: string;
    title?: string;
    description?: string;
    url?: string | null;
    required?: boolean;
  }[];
};

function list(
  value: readonly string[] | undefined,
) {
  if (!value?.length) {
    return (
      <p className="m-0 text-sm text-muted-foreground leading-[22px]">
        None recorded.
      </p>
    );
  }

  return (
    <ul className="m-0 min-w-0 space-y-1 pl-5 text-sm text-body break-words">
      {value.map((item, index) => (
        <li key={index} className="break-words">{item}</li>
      ))}
    </ul>
  );
}

export function ProjectTemplateView({
  blueprint,
}: {
  blueprint: unknown;
}) {
  const data =
    blueprint &&
    typeof blueprint === "object"
      ? (blueprint as ProjectTemplateBlueprintView)
      : {};

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <section className="min-w-0 border-b border-border pb-4">
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          Overview
        </h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
          {data.overview?.goal?.trim() ||
            "No project goal recorded."}
        </p>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--lms-heading)]">
              Deliverables
            </h3>
            {list(data.overview?.deliverables)}
            {(!data.overview?.deliverables?.some(value=>value.trim()))?
              <p role="alert" className="mt-2 text-sm font-semibold text-warning-text">Add at least one deliverable.</p>:null}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--lms-heading)]">
              Definition of done
            </h3>
            {list(data.overview?.definitionOfDone)}
          </div>
        </div>
      </section>

      {data.legacy ? <section aria-label="Imported template metadata" className="border-b border-border pb-4">
        <h2 className="font-semibold">Source template metadata</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt>Course</dt><dd>{data.legacy.courseLabel||"Not recorded"}</dd></div>
          <div><dt>Phase</dt><dd>{data.legacy.phase||"Not recorded"}</dd></div>
          <div><dt>Status</dt><dd>{data.legacy.status||"Not recorded"}</dd></div>
          <div><dt>Lifecycle</dt><dd>{data.legacy.lifecycleStatus||"Not recorded"}</dd></div>
        </dl>
      </section> : null}
      {data.submission?<section className="border-b border-border pb-4" aria-label="Template submission settings">
        <h2 className="font-semibold">Submission settings</h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{data.submission.instructions||"No instructions recorded."}</p>
        {list(data.submission.requiredEvidence)}
      </section>:null}
      <section className="grid min-w-0 grid-cols-1 gap-4">
        <TemplateRows
          title="Releases"
          rows={data.releases}
        />
        <TemplateRows
          title="Sprints"
          rows={data.sprints}
        />
        <TemplateRows
          title="Tasks"
          rows={data.tasks}
        />
        <TemplateRows
          title="Resources"
          rows={data.resources}
        />
      </section>
    </div>
  );
}

function TemplateRows({
  title,
  rows,
}: {
  title: string;
  rows:
    | readonly {
        key?: string;
        title?: string;
        description?: string;
        priority?: string;
        required?: boolean;
      }[]
    | undefined;
}) {
  return (
    <section className="border-b border-border pb-[16px]">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          {title}
        </h2>
        <Badge tone="neutral">
          {rows?.length ?? 0}
        </Badge>
      </div>
      {!rows?.length ? (
        <p className="mb-0 mt-3 text-sm text-muted-foreground leading-[22px]">
          None configured.
        </p>
      ) : (
        <div className="mt-3 min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
          {rows.map((row, index) => (
            <article
              key={row.key ?? index}
              className="min-w-0 py-[var(--lms-space-3)]"
            >
              <p className="m-0 break-words text-sm font-semibold text-foreground leading-[22px]">
                {row.title?.trim() ||
                  row.key?.trim() ||
                  "Untitled"}
              </p>
              {row.description ? (
                <p className="mt-1 break-words text-xs text-body leading-[20px]">
                  {row.description}
                </p>
              ) : null}
              {row.priority ? (
                <p className="mb-0 mt-2 break-words text-xs text-muted-foreground leading-[20px]">
                  Priority: {row.priority}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
