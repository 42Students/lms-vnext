/** Content helpers for the 2026 TPO email composer.
 * These are copy suggestions, NOT provider-approved template keys and never send mail. */
export const TPO_CAMPAIGN_COMPOSE_PRESETS=[
 {id:"season-dates",title:"Season dates",description:"Your weeks, pick one",
  subject:"Placement season dates and availability",
  body:"Hello {name},\n\nWe are planning our next campus placement season and would like to coordinate suitable dates with {company}.\n\nCould you share your preferred weeks and any campus requirements?\n\nRegards,\nPlacement cell"},
 {id:"introduce-college",title:"Introduce the college",description:"First email to a new company",
  subject:"Campus recruitment introduction",
  body:"Hello {name},\n\nWe would like to introduce our college and explore campus recruitment opportunities with {company}.\n\nPlease let us know who on your team coordinates university hiring and what information would help you evaluate a visit.\n\nRegards,\nPlacement cell"},
 {id:"welcome-back",title:"Welcome back",description:"To previous recruiters",
  subject:"Welcome back — campus recruitment",
  body:"Hello {name},\n\nThank you for your previous engagement with our placement cell. We would be pleased to explore another campus hiring opportunity with {company}.\n\nWould you like us to share our updated placement calendar?\n\nRegards,\nPlacement cell"},
 {id:"thank-you",title:"Thank you after a drive",description:"After results are out",
  subject:"Thank you for your campus drive",
  body:"Hello {name},\n\nThank you to you and the {company} hiring team for spending time with our students. We appreciate the opportunity to work together.\n\nPlease share any feedback or remaining next steps when convenient.\n\nRegards,\nPlacement cell"},
] as const;
export type TpoCampaignComposePreset=(typeof TPO_CAMPAIGN_COMPOSE_PRESETS)[number];
export function tpoCampaignMergeToken(text:string,token:"name"|"company"){
 return text+(text&&!/\s$/.test(text)?" ":"")+"{"+token+"}";
}
