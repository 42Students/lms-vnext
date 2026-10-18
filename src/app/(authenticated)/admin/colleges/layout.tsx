import "@/styles/college-admin-north-star.css";

export default function CollegeTenantsSkinLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="lms-college-portal">{children}</div>;
}
