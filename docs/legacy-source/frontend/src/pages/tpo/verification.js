import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Typography } from "antd";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import VerificationWorkspace from "@/components/verification/VerificationWorkspace";
import { appAction } from "@/redux/store";

/** Profile verification for the placement cell, when the college admin allows it. */
export default function TpoVerification() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(appAction.setActiveMenuItem("verification")); }, [dispatch]);
  return (
    <div className="scroll-container tpo-verification" data-testid="tpo.verification">
      <PageShell>
        <ListingPageHeader title="Verification"
          subtitle={<Typography.Text type="secondary">Check students&apos; education and identity against their documents. Verified marks are what eligibility uses.</Typography.Text>} />
        <VerificationWorkspace />
      </PageShell>
    </div>
  );
}
