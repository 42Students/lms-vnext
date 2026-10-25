import {codingProfilePlatformSchema,normalizeCodingProfile} from "./tpo-coding-profile-model";

export function learnerCodingProfileLink(platform:unknown,raw:unknown){
  const key=codingProfilePlatformSchema.safeParse(platform);
  if(!key.success||typeof raw!=="string")return null;
  const value=raw.trim();
  // Keep the legacy form's HTTP-to-HTTPS normalization, but never turn
  // an unsafe stored link into a clickable learner-facing profile.
  if(/^[a-z][a-z\d+.-]*:\/\//i.test(value)){
    let url:URL;
    try{url=new URL(value);}catch{return null;}
    // The platform validator pins the exact host/path and returns HTTPS.
    // Accept legacy HTTP only as input; never expose a plain-HTTP link.
    if((url.protocol!=="https:"&&url.protocol!=="http:")||
      url.username||url.password||url.port)return null;
  }
  return normalizeCodingProfile(key.data,value);
}
