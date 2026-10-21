import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import PlacementCellContent from "@/components/Placements/PlacementCellContent";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";

export default function MyPlacementsCell() {
  const router = useRouter();
  const learnerId = useSelector((state) => state.loginUser?.id);
  useEffect(() => {
    if (router.isReady && !learnerId) router.replace("/");
  }, [router, router.isReady, learnerId]);
  if (!learnerId) return null;
  return <PlacementCellContent />;
}

MyPlacementsCell.getLayout = (page) => PlacementsTabsLayout(page);
