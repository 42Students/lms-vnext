// Course Overview building blocks.
//
// This barrel previously exported 14 components of which 12 had zero references anywhere outside
// this directory (~52KB of JSX), while all of their SCSS was still shipping. That was the residue
// of an earlier dashboard design — a progress hero, a stat row, a progress ring — that was gutted
// without the page being redesigned to fill the space, and it made design intent indistinguishable
// from abandoned work. The unreferenced components have been removed; they remain in git history
// if the richer dashboard is ever reinstated deliberately.

export { default as InThisCourseSection } from "./InThisCourseSection";
export { default as UnifiedActivityList } from "./UnifiedActivityList";
export { default as AtRiskStudentsCard } from "./AtRiskStudentsCard";
export { default as PerformanceCard } from "./PerformanceCard";
