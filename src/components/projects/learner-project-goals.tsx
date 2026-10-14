import type { LearnerProjectGoalSummary } from "@/modules/projects/learner-project-goals-model";
export function LearnerProjectGoals({overview}: {overview:LearnerProjectGoalSummary}) {
  const hasContent=Boolean(overview.goal || overview.description || overview.deliverables.length);
  return (
    <section aria-label="Project goals and deliverables" className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">Goals and deliverables</h2>
      {!hasContent ? (
        <p className="mt-2 text-sm text-muted-foreground">No authored goal or deliverables have been recorded for this Project.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {overview.goal ? <div><h3 className="text-sm font-semibold text-foreground">Project goal</h3>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-body">{overview.goal}</p></div> : null}
          {overview.description ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-body">{overview.description}</p> : null}
          {overview.deliverables.length > 0 ? (
            <div><h3 className="text-sm font-semibold text-foreground">Expected deliverables</h3>
              <ul className="mt-2 list-inside list-disc space-y-2 text-sm leading-6 text-body">
                {overview.deliverables.map((item,index)=><li key={index} className="break-words">{item}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
