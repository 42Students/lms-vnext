import {codingProfilePlatformSchema,normalizeCodingProfile} from "./tpo-coding-profile-model";

/** Public profile links must not navigate through an insecure pasted URL.
 * The profile editor may separately normalize legacy http input for storage. */
export function learnerCodingProfileLink(platform:unknown,raw:unknown){
 const key=codingProfilePlatformSchema.safeParse(platform);
 if(!key.success||typeof raw!=="string")return null;
 if(/^http:\/\//i.test(raw.trim()))return null;
 return normalizeCodingProfile(key.data,raw);
}
