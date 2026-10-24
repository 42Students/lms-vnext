import type { NextConfig } from "next";
import { BASE_SECURITY_HEADERS } from "./src/security/headers";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    // Retired mentor paths remain safe for old bookmarks; no token handoff.
    return [
      { source: "/mentor/profile", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/contacts", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/contacts/:path*", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/allQuizzes", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/fileExplorer", destination: "/mentor/projects", permanent: false },
      // Legacy faculty bookmarks must resolve before authorization on /teacher/courses.
      { source: "/teacher/fileExplorer", destination: "/teacher/courses", permanent: false },
      { source: "/mentor/courses", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/courses/:path*", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/quizzes", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/quizzes/:path*", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/allQuizzes/:path*", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/fileExplorer/:path*", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/files", destination: "/mentor/projects", permanent: false },
      { source: "/mentor/files/:path*", destination: "/mentor/projects", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...BASE_SECURITY_HEADERS],
      },
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
