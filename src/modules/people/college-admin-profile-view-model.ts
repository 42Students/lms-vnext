import type { OwnAccountSummary } from "./own-account-service";
export type CollegeProfileField={label:string;value:string|null};
export type CollegeProfileSection={key:"personal"|"contact"|"address"|"social";title:string;fields:readonly CollegeProfileField[];unavailable?:string};
export function collegeAdminProfileSections(account:OwnAccountSummary):readonly CollegeProfileSection[]{
  return [
    {key:"personal",title:"Personal",fields:[{label:"Name",value:account.displayName},{label:"College",value:account.college?.name??null}]},
    {key:"contact",title:"Contact",fields:[{label:"Email",value:account.email},{label:"Mobile",value:account.phoneE164}]},
    {key:"address",title:"Address",fields:[],unavailable:"Personal address is not recorded in this account view."},
    {key:"social",title:"Social",fields:[],unavailable:"Social links are not recorded in this account view."},
  ];
}
