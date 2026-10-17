/** Super Admin Placements supplemental navigation — legacy main tabs remain in the account shell. */
export const SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY = [
  {href:"/admin/placements/drives",label:"All drives"},
  {href:"/admin/placements/calendar",label:"Interviews"},
  {href:"/admin/placements/applications",label:"Applications"},
  {href:"/admin/placements/shortlisted",label:"Shortlisted"},
  {href:"/admin/placements/retention",label:"Data retention report"},
  {href:"/admin/placements/analytics",label:"Placement Analytics"},
] as const;

export const SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL = [
  {href:"/admin/placements/job-settings",label:"Job Settings"},
  {href:"/admin/placements/hiring",label:"Hiring"},
  {href:"/admin/placements/offers",label:"Offers"},
  {href:"/admin/placements/joining",label:"Joining"},
  {href:"/admin/placements/seasons",label:"Seasons"},
  {href:"/admin/placements/screenings",label:"Screening"},
] as const;
