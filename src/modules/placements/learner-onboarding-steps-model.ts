export type LearnerPlacementOnboardingStep={label:string;detail:string;href:string};
/** A missing application read is unknown, not onboarding/zero applications. */
export function learnerPlacementOnboardingSteps(firstRun:boolean|null,preferencesAvailable:boolean):LearnerPlacementOnboardingStep[]{
  if(firstRun!==true)return [];
  const steps:LearnerPlacementOnboardingStep[]=[
    {label:"Understand placement rules",detail:"Read what is recorded about placement requirements and eligibility.",href:"/learn/my-placements/rules"},
    {label:"Explore published drives",detail:"Check opportunities and your per-role eligibility before applying.",href:"/learn/my-placements/jobs"},
  ];
  if(preferencesAvailable)steps.push({
    label:"Review job preferences",detail:"Choose roles, locations and the placement updates you want.",href:"/learn/my-placements#placement-job-preferences",
  });
  return steps;
}
