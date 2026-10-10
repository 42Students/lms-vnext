import { StatusBadge } from "@/components/ui/status-badge";

type ProjectTemplateBlueprintView = {
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
      <p className="m-0 text-sm text-muted-foreground">
        None recorded.
      </p>
    );
  }

  return (
    <ul className="m-0 space-y-1 pl-5 text-sm text-body">
      {value.map((item, index) => (
        <li key={index}>{item}</li>
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
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-lg font-semibold text-foreground">
          Overview
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
          {data.overview?.goal?.trim() ||
            "No project goal recorded."}
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Deliverables
            </h3>
            {list(data.overview?.deliverables)}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Definition of done
            </h3>
            {list(data.overview?.definitionOfDone)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
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
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold text-foreground">
          {title}
        </h2>
        <StatusBadge tone="neutral">
          {rows?.length ?? 0}
        </StatusBadge>
      </div>
      {!rows?.length ? (
        <p className="mb-0 mt-3 text-sm text-muted-foreground">
          None configured.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {rows.map((row, index) => (
            <article
              key={row.key ?? index}
              className="rounded-lg border border-border bg-muted p-3"
            >
              <p className="m-0 text-sm font-semibold text-foreground">
                {row.title?.trim() ||
                  row.key?.trim() ||
                  "Untitled"}
              </p>
              {row.description ? (
                <p className="mt-1 text-xs leading-5 text-body">
                  {row.description}
                </p>
              ) : null}
              {row.priority ? (
                <p className="mb-0 mt-2 text-xs text-muted-foreground">
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
