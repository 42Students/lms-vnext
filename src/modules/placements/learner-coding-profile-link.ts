import {codingProfilePlatformSchema,normalizeCodingProfile} from "./tpo-coding-profile-model";

/** Resolve validated platform profiles to their canonical HTTPS destination.
 * Legacy HTTP profile URLs are normalized rather than navigated directly. */
export function learnerCodingProfileLink(platform:unknown,raw:unknown){
 const key=codingProfilePlatformSchema.safeParse(platform);
 if(!key.success||typeof raw!=="string")return null;
 return normalizeCodingProfile(key.data,raw);
}
