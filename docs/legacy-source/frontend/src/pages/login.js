import Head from "next/head";
import LoginPage from "../loginPages/Login";

export default function Login() {
  return (
    <div className="login-page">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" type="image/x-icon" href="/favicon.svg" />
      </Head>
      <main>
        <LoginPage />
      </main>
    </div>
  );
}

// Login must not be wrapped in authenticated dashboard layout (Sidebar/TopPanel).
Login.nolayout = true;
