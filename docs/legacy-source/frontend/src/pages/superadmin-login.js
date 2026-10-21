import Head from "next/head";
import SuperAdminLoginPage from "../loginPages/SuperAdminLogin";
import DefaultLoginBackground from "../loginPages/DefaultLoginBackground";
import Header from "@/components/Header/LoginHeader";

export default function SuperAdminLogin() {
  return (
    <div className="login-page">
      <Head>
        <title>Superadmin - 42 LMS</title>
        <meta name="description" content="Superadmin Login" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" type="image/x-icon" href="/favicon.svg" />
      </Head>
      <DefaultLoginBackground />
      <Header />
      <main>
        <SuperAdminLoginPage />
      </main>
    </div>
  );
}

// Keep superadmin login outside the authenticated app shell (Layout does session-restore redirects to "/").
SuperAdminLogin.nolayout = true;
