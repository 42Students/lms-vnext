export type TpoThreadPreferenceAction="FOLLOW"|"UNFOLLOW"|"MUTE"|"UNMUTE";
export type TpoThreadPreferenceState={following:boolean;mutedAt:Date|null};

/** Defaults live only in the read model; don't insert a row for a no-op.
 * A second MUTE must preserve the first timestamp, not invent a new change. */
export function planTpoThreadPreferenceChange(
 current:Readonly<TpoThreadPreferenceState>|null,
 action:TpoThreadPreferenceAction,
 at:Date,
):TpoThreadPreferenceState&{changed:boolean}{
 const following=action==="FOLLOW"?true:action==="UNFOLLOW"?false:current?.following??true;
 const mutedAt=action==="MUTE"?(current?.mutedAt??at):
  action==="UNMUTE"?null:current?.mutedAt??null;
 const changed=(current?.following??true)!==following||
  Boolean(current?.mutedAt)!==Boolean(mutedAt);
 return {following,mutedAt,changed};
}
