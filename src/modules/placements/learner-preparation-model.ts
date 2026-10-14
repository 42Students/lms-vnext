import { z } from "zod";

export const learnerPreparationQuerySchema = z.object({
  view: z.enum(["ALL", "RECORDED", "MISSING"]).default("ALL"),
}).strict();

export type LearnerPreparationQuery = z.infer<typeof learnerPreparationQuerySchema>;

export type LearnerPreparationSignal = {
  hasEnrollment: boolean;
  hasContact: boolean;
  hasSkills: boolean;
  applicationCount: number;
};

export type LearnerPreparationItem = {
  id: "enrollment" | "contact" | "skills" | "applications";
  title: string;
  description: string;
  href: string;
  recorded: boolean;
};

/**
 * Factual, self-only profile/activity evidence. This is NOT a placement
 * eligibility or hiring-readiness score. No private field value is returned.
 */
export function buildLearnerPreparationChecklist(
  signals: LearnerPreparationSignal, query: LearnerPreparationQuery,
) {
  const items: LearnerPreparationItem[] = [
    {
      id:"enrollment",title:"Academic enrollment",
      description:"An active program enrollment is recorded in your college.",
      href:"/learn/profile",recorded:signals.hasEnrollment,
    },
    {
      id:"contact",title:"Contact information",
      description:"At least one contact method is recorded in your profile.",
      href:"/learn/profile?section=contacts",recorded:signals.hasContact,
    },
    {
      id:"skills",title:"Profile skills",
      description:"At least one skill is recorded in your Learner profile.",
      href:"/learn/profile?section=skills",recorded:signals.hasSkills,
    },
    {
      id:"applications",title:"Application activity",
      description:"At least one placement application exists in your history, including withdrawn applications.",
      href:"/learn/my-placements/applications",recorded:signals.applicationCount>0,
    },
  ];
  const totalRecorded=items.filter(item=>item.recorded).length;
  return {
    query,
    total:items.length,
    recorded:totalRecorded,
    missing:items.length-totalRecorded,
    applicationCount:signals.applicationCount,
    items:items.filter(item=>
      query.view==="ALL" ||
      (query.view==="RECORDED" && item.recorded) ||
      (query.view==="MISSING" && !item.recorded)),
  };
}

export function learnerPreparationHref(query:LearnerPreparationQuery) {
  return "/learn/my-placements/preparation" +
    (query.view==="ALL" ? "" : "?view="+query.view);
}
