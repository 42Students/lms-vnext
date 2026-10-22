import type { LearnerProjectGoalSummary } from "@/modules/projects/learner-project-goals-model";
import styles from "./legacy-project-goals.module.css";
export function LearnerProjectGoals({overview}: {overview:LearnerProjectGoalSummary}) {
  const hasContent=Boolean(overview.goal || overview.description || overview.deliverables.length || overview.definitionOfDone.length || overview.personas.length);
  return (
    <section aria-label="Project goals and deliverables" className="min-w-0 max-w-full border-b border-border pb-5">
      <h2 className="break-words font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">About this project</h2>
      {!hasContent ? (
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">No authored goal or deliverables have been recorded for this Project.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {overview.goal ? <div><h3 className="text-sm font-semibold text-[var(--lms-heading)]">Project goal</h3>
            <p className={"mt-1 whitespace-pre-wrap "+styles["richText"]}>{overview.goal}</p></div> : null}
          {overview.description ? <p className={"whitespace-pre-wrap "+styles["richText"]}>{overview.description}</p> : null}
          {overview.deliverables.length > 0 ? (
            <div><h3 className="text-sm font-semibold text-[var(--lms-heading)]">Deliverables</h3>
              <ul className={"mt-2 "+styles["deliverables"]}>
                {overview.deliverables.map((item,index)=><li key={index} className={styles["deliverableItem"]}>{item}</li>)}
              </ul>
            </div>
          ) : <p className="text-sm text-muted-foreground leading-[22px]">No deliverables have been added yet.</p>}
          <div><h3 className="text-sm font-semibold">Definition of done</h3>
            {overview.definitionOfDone.length?<ul className="mt-2 list-disc pl-5 text-sm break-words">
              {overview.definitionOfDone.map((item,i)=><li key={i}>{item}</li>)}
            </ul>:<p className="mt-1 text-sm text-muted-foreground leading-[22px]">No definition of done has been added yet.</p>}
          </div>
          <div><h3 className="text-sm font-semibold">Who&apos;s who</h3>
            {overview.personas.length?<ul className="mt-2 list-disc pl-5 text-sm break-words">
              {overview.personas.map((item,i)=><li key={i}>{item}</li>)}
            </ul>:<p className="mt-1 text-sm text-muted-foreground leading-[22px]">No personas have been added yet.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
