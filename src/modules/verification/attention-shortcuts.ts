export const verificationAttentionShortcuts=[
 {attention:"MISSING_MARKSHEET",label:"Missing marksheets"},
 {attention:"VERIFIED_DETAILS_CHANGED",label:"Changed verified details"},
 {attention:"WAITING_OVER_WEEK",label:"Waiting over a week"},
] as const;
export function verificationAttentionShortcutPatch(attention:(typeof verificationAttentionShortcuts)[number]["attention"]){
 return {tab:"WAITING",attention,page:"1",waitingState:"ALL",ageBand:"ANY",
  ...(attention==="MISSING_MARKSHEET"?{kind:"EDUCATION",marksheets:"ANY"}:{})};
}
