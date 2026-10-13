import { ErrorPageView } from "@/components/public/error-page-view";

export default function NotFound() {
  return (
    <ErrorPageView
      code="404"
      title="Page Not Found"
      message="The page you are looking for doesn't exist or has moved."
    />
  );
}
