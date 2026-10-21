import React from "react";
import VerifiedJobDetailContent from "@/components/Placements/VerifiedJobDetailContent";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";

// The drive's rules checklist sits inside the page's "Can you apply" card now (it was a second banner above the page).
export default function MyPlacementsJobDetail() {
  return <VerifiedJobDetailContent basePath="/learn/my-placements" />;
}

MyPlacementsJobDetail.getLayout = (page) => PlacementsTabsLayout(page);
