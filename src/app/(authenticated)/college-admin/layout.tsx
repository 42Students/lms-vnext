import "@/styles/college-admin-north-star.css";

/** Apply the College Admin skin to legacy alias route fallbacks as well. */
export default function CollegeAdminAliasLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="lms-college-portal">{children}</div>;
}
