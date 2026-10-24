export const mentorActivityCategoryChoices=[
 {value:"ALL",label:"Everything"},
 {value:"TASK",label:"Tasks"},
 {value:"SPRINT",label:"Sprints"},
 {value:"TEAM",label:"Team & meetings"},
 {value:"RESOURCE",label:"Resources"},
 {value:"SUBMISSION",label:"Submission"},
 {value:"PROJECT",label:"Project details"},
] as const;
export type MentorActivityCategory=(typeof mentorActivityCategoryChoices)[number]["value"];
/** Every known persisted Mentor workspace event class has one group. Rare
 * unrecognized/imported event types remain in Everything, not mislabelled.
 */
export function mentorActivityGroup(type:string):MentorActivityCategory|"OTHER"{
 const normalized=type.toLowerCase();
 if(/^(projects\.task\.|projects\.task_comment\.)/.test(normalized))return "TASK";
 if(/^(projects\.sprint\.|projects\.release\.)/.test(normalized))return "SPRINT";
 if(/^(projects\.team\.|projects\.team_member\.|projects\.member\.|projects\.mentor\.|projects\.meeting\.)/.test(normalized))
  return "TEAM";
 if(/^(projects\.resource\.|projects\.resource_file\.|projects\.file\.)/.test(normalized))
  return "RESOURCE";
 if(/^(projects\.delivery\.|projects\.submission\.)/.test(normalized))
  return "SUBMISSION";
 if(/^(projects\.project\.|projects\.readiness\.|projects\.evaluation\.|projects\.mentor_update\.)/.test(normalized))
  return "PROJECT";
 return "OTHER";
}
