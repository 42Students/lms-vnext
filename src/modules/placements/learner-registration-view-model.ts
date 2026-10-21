import { resolveRegistrationWindow } from "./batch-registration-policy";
/** Legacy ChoicesController lists these three literal values in this order.
 * Hints are descriptive only; the persisted choice remains unchanged. */
export const learnerPlacementChoices = [
  { value: "PLACEMENTS", label: "Placements", hint: "I want a job through campus drives" },
  { value: "HIGHER_STUDIES", label: "Higher studies", hint: "I'm going for a master's or similar" },
  { value: "NOT_INTERESTED", label: "Not interested", hint: "I'm not taking part this year" },
] as const;
export type LearnerPlacementChoice = typeof learnerPlacementChoices[number]["value"];
export const LEARNER_REGISTRATION_COPY = {
  title: "Registration",
  choice: "Your choice",
  consent: "I agree to share my academic details, resume and contact details with the companies I apply to.",
  register: "Register",
  update: "Save my new choice",
  success: "Registration saved",
  failure: "Could not save",
  notInvited: "Registration opens when the placement cell invites your batch. You'll get a notice.",
  closed: "Registration is closed. To change your choice, send a request below.",
  deadline: "You can change your choice until",
} as const;
export function resolveLearnerRegistrationDisplay(
  lifecycle: { invitedAt: Date | null; finishedAt: Date | null; deadline: Date | null } | null,
  recordedChoice: string | null,
  now: Date,
) {
  const window = resolveRegistrationWindow(lifecycle, now);
  const choice = learnerPlacementChoices.find(item => item.value === recordedChoice)?.value ?? null;
  return {
    stage: !window.invited ? "NOT_INVITED" as const :
      window.finished ? "FINISHED" as const :
      window.open ? "OPEN" as const : "CLOSED" as const,
    deadline: window.deadline?.toISOString() ?? null, choice,
  };
}

/** A safe projection of the old GET /mine 204 convention. New consumers
 * read {registration:{choice,stage,deadline}} instead of assuming an empty
 * HTTP body means the learner cannot participate in the current cohort.
 */
export function legacyRegistrationChoiceOrEmpty(choice:string|null|undefined):
 {choice:LearnerPlacementChoice}|null{
 const known=learnerPlacementChoices.find(option=>option.value===choice);
 return known?{choice:known.value}:null;
}
