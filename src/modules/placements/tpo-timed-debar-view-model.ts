/** Client-safe, already-college-scoped debarment view. */
export type TpoTimedDebarRow={
 id:string;reason:string;untilDate:string|null;untilDrives:number|null;
 drivesCounted:number;createdAt:string;liftedAt:string|null;liftedReason:string|null;
 active:boolean;
};
