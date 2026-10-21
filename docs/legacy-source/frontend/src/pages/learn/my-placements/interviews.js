import MovedPage from "@/components/Placements/student/MovedPage";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";

// Moved into Schedule (student redesign, 14 Oct 2026).
export default function Moved() {
  return <MovedPage to="/learn/my-placements/schedule" />;
}

Moved.getLayout = (page) => PlacementsTabsLayout(page);
