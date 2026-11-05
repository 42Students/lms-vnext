import type { LearnerProjectGoalSummary } from "@/modules/projects/learner-project-goals-model";
import styles from "./legacy-project-goals.module.css";
import { Heading } from "@/components/ui/heading";
export function LearnerProjectGoals({overview}: {overview:LearnerProjectGoalSummary}) {
  const hasContent=Boolean(overview.goal || overview.description || overview.deliverables.length || overview.definitionOfDone.length || overview.personas.length);
  return (
    <section aria-label="Project goals and deliverables" className="min-w-0 max-w-full border-b border-border pb-5">
      <Heading level={2} size="base" className="break-words text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">About this project</Heading>
      {!hasContent ? (
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">No authored goal or deliverables have been recorded for this Project.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {overview.goal ? <div><Heading level={3} size="sm" className="text-[var(--lms-heading)]">Project goal</Heading>
            <p className={"mt-1 whitespace-pre-wrap "+styles["richText"]}>{overview.goal}</p></div> : null}
          {overview.description ? <p className={"whitespace-pre-wrap "+styles["richText"]}>{overview.description}</p> : null}
          {overview.deliverables.length > 0 ? (
            <div><Heading level={3} size="sm" className="text-[var(--lms-heading)]">Deliverables</Heading>
              <ul className={"mt-2 "+styles["deliverables"]}>
                {overview.deliverables.map((item,index)=><li key={index} className={styles["deliverableItem"]}>{item}</li>)}
              </ul>
            </div>
          ) : <p className="text-sm text-muted-foreground leading-[22px]">No deliverables have been added yet.</p>}
          <div><Heading level={3} size="sm">Definition of done</Heading>
            {overview.definitionOfDone.length?<ul className="mt-2 list-disc pl-5 text-sm break-words">
              {overview.definitionOfDone.map((item,i)=><li key={i}>{item}</li>)}
            </ul>:<p className="mt-1 text-sm text-muted-foreground leading-[22px]">No definition of done has been added yet.</p>}
          </div>
          <div><Heading level={3} size="sm">Who&apos;s who</Heading>
            {overview.personas.length?<ul className="mt-2 list-disc pl-5 text-sm break-words">
              {overview.personas.map((item,i)=><li key={i}>{item}</li>)}
            </ul>:<p className="mt-1 text-sm text-muted-foreground leading-[22px]">No personas have been added yet.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
