import {codingProfilePlatformSchema,normalizeCodingProfile} from "./tpo-coding-profile-model";

/** Normalize legacy HTTP profile URLs to HTTPS only after the platform-specific
 * hostname has passed validation. Never navigate to an unverified host. */
export function learnerCodingProfileLink(platform:unknown,raw:unknown){
 const key=codingProfilePlatformSchema.safeParse(platform);
 if(!key.success||typeof raw!=="string")return null;
 return normalizeCodingProfile(key.data,raw);
}
