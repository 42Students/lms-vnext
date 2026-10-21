import { Result } from "antd";

/**
 * A recruiter account works inside one college's placement site (N1): sign-in is only on the college's own address. A session
 * without a college has nothing to show, so every page says the same thing.
 */
export default function NoCollegeSession() {
  return (
    <Result status="info" title="Open this on your college's placement address" data-testid="recruiter.no-college"
      subTitle="Your recruiter account works inside one college's placement site. Sign in there with your work email, from the link the placement cell sent you." />
  );
}
