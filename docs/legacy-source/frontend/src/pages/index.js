import Head from "next/head";
import LoginPage from "../loginPages/Login";
import Header from "@/components/Header/LoginHeader";
import JntuLogin from "../loginPages/JntuLogin";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "@/redux/store";
import { OrgConst } from "@/common/subDomains";
import DgipucLogin from "@/loginPages/DgipucLogin";

export default function Login({ tenant }) {
  const loginUser = useSelector(state => state.loginUser);
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === "emedha.jntukelearn.in") {
      dispatch(loginUserAction.handleUserData({ currOrg: OrgConst.JNTU }));
    } else if (hostname === "dgi.42lms.com") {
      dispatch(loginUserAction.handleUserData({ currOrg: OrgConst.DGIPUC }));
    }
  }, [dispatch]);

  return (
    <div
      className={
        loginUser?.currOrg === OrgConst.JNTU
          ? " login-page login-page--jntu"
          : "login-page"
      }
    >
      <Head>
        <title>42 LMS</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta property="og:title" content="42 LMS" />
        <meta
          property="og:description"
          content="Digitize every aspect of teaching and learning"
        />
        <meta
          property="og:image"
          content="https://42lms.com/assets/images/login/logoo.png"
        />
        <link rel="icon" type="image/x-icon" href="/favicon.svg" />
      </Head>
      {/* The default sign-in page carries its own brand; only the DGIPUC page keeps the old header. */}
      {loginUser?.currOrg === OrgConst.DGIPUC && <Header />}
      <main>{getLoginPage()}</main>
    </div>
  );

  function getLoginPage() {
    switch (loginUser?.currOrg) {
      case OrgConst.JNTU:
        return <JntuLogin />;
      case OrgConst.DGIPUC:
        return <DgipucLogin />;
      default:
        return <LoginPage />;
    }
  }
}

// Root route is the login entrypoint; it must not use the authenticated dashboard layout.
Login.nolayout = true;

Login.nolayout = true;

Login.getInitialProps = async ctx => {
  return { tenant: ctx?.req?.headers.host };
};
