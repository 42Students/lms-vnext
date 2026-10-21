import MovedPage from "@/components/Placements/student/MovedPage";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";

// The rules live in Placement cell now, as a list of plain points (student redesign, 14 Oct 2026).
export default function Moved() {
  return <MovedPage to="/learn/my-placements/placement#rules" />;
}

Moved.getLayout = (page) => PlacementsTabsLayout(page);
