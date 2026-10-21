/** Scoped entity types displayed by the legacy Deleted Items selector. */
export const RECOVERY_ENTITY_TYPES=[
 {value:"organization",label:"Organization",platformLevel:true,implemented:true},
 {value:"college",label:"College",platformLevel:true,implemented:false},
 {value:"department",label:"Department",platformLevel:false,implemented:false},
 {value:"program",label:"Program",platformLevel:false,implemented:false},
 {value:"class",label:"Class",platformLevel:false,implemented:false},
 {value:"semester",label:"Semester",platformLevel:false,implemented:false},
 {value:"lecture-hall",label:"Lecture Hall",platformLevel:false,implemented:false},
 {value:"quiz",label:"Quiz",platformLevel:false,implemented:false},
 {value:"notification",label:"Notification",platformLevel:false,implemented:false},
] as const;
export type RecoveryEntityType=typeof RECOVERY_ENTITY_TYPES[number]["value"];
export function isRecoveryEntityType(value:unknown):value is RecoveryEntityType{
 return typeof value==="string"&&RECOVERY_ENTITY_TYPES.some(item=>item.value===value);
}
