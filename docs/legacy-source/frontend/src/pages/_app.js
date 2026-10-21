import "@/styles/main.scss";
import React, { useRef } from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { ConfigProvider } from "antd";
import { CalendarContextProvider } from "@/contexts/calendar-context";
import { Provider } from "react-redux";
import store from "../redux/store";
import { QueryClient, QueryClientProvider } from "react-query";
import AdminLayout from "@/layouts/AdminLayout";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import Layout from "@/layouts/layout";
import { getTenantBootstrap } from "@/api/Services/TenantService";
import { saveTenantBootstrapToStorage } from "@/utils/tenantUtils";
import { isLocalDevelopmentHost, normalizeHostOnly } from "@/utils/tenantUtils";
import ImpersonationBanner from "@/components/Global/ImpersonationBanner/ImpersonationBanner";
import TrackerQuickReportLauncher from "@/components/tracker/TrackerQuickReportLauncher";
import { initClientErrorReporting, reportReactBoundaryError } from "@/utils/clientErrorReporting";
import PageErrorBoundary from "@/components/ErrorBoundary/PageErrorBoundary";
import NetworkStatusBanner from "@/components/Common/NetworkStatusBanner";
import { useRouteScrollRestoration } from "@/hooks/useRouteScrollRestoration";
import { PanelEmpty } from "@/components/Common/PanelStates";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, info) {
    reportReactBoundaryError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "max(20px, 5vw)",
            textAlign: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "clamp(1.2rem, 5vw, 2rem)", marginBottom: "1rem" }}>
            Something went wrong.
          </h2>
          <p style={{ marginBottom: "2rem", maxWidth: "90vw" }}>
            Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              minWidth: "44px",
              minHeight: "44px",
              padding: "12px 24px",
              fontSize: "16px",
              cursor: "pointer",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function renderGlobalEmpty(componentName) {
  const optionSurface = ["Select", "TreeSelect", "Cascader", "Transfer"].includes(componentName);
  return (
    <PanelEmpty
      compact
      title={optionSurface ? "No options available" : "Nothing here yet"}
      description={
        optionSurface
          ? "Try a different search or filter."
          : "There are no items to show in this view."
      }
    />
  );
}

function NestedLayout({ Component, pageProps }) {
  if (typeof Component.getLayout === "function") {
    return Component.getLayout(<Component {...pageProps} />);
  }
  return <Component {...pageProps} />;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  useRouteScrollRestoration(router);

  useEffect(() => {
    initClientErrorReporting();
  }, []);

  // Native shells keep the same zoomable viewport semantics as the browser. Do not suppress
  // pinch/multi-touch magnification: users may rely on platform zoom even when the app shell
  // provides its own navigation chrome.


  // Global tenant bootstrap + canonical domain redirect (prevents alias-domain confusion).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const REDIRECT_KEY = "lms_canonical_redirect_done_v1";
    const REDIRECT_TTL_MS = 30 * 1000;

    const currentHost = normalizeHostOnly(window.location.host);
    if (!currentHost) return;
    if (isLocalDevelopmentHost(currentHost)) return;

    // Avoid infinite loops / repeated redirects.
    try {
      const raw = sessionStorage.getItem(REDIRECT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const ageMs = Date.now() - (Number(parsed?.at) || 0);
        const isFresh = ageMs >= 0 && ageMs <= REDIRECT_TTL_MS;
        if (parsed?.from === currentHost && isFresh) return;
        sessionStorage.removeItem(REDIRECT_KEY);
      }
    } catch (_) {}

    getTenantBootstrap()
      .then((b) => {
        saveTenantBootstrapToStorage(b);
        if (b?.mode !== "TENANT") return;
        const canonical = normalizeHostOnly(b?.canonicalHost);
        const should = b?.shouldRedirectToCanonicalHost === true;
        if (!should || !canonical || canonical === currentHost) return;

        try {
          sessionStorage.setItem(REDIRECT_KEY, JSON.stringify({ from: currentHost, to: canonical, at: Date.now() }));
        } catch (_) {}

        const newUrl = `${window.location.protocol}//${canonical}${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.replace(newUrl);
      })
      .catch(() => {
        // ignore bootstrap failures globally; login page will handle banners if needed
      });
  }, []);

  // Create QueryClient once per app lifecycle (useRef avoids SSR data leakage)
  const queryClientRef = useRef(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            // Don't retry on client errors (4xx)
            if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
            return failureCount < 2;
          },
          staleTime: 30 * 1000,
        },
      },
    });
  }

  const renderPage = () => {
    if (Component.adminLayout) {
      return (
        <AdminLayout>
          <PageErrorBoundary resetKey={router.asPath}>
            <Component {...pageProps} />
          </PageErrorBoundary>
        </AdminLayout>
      );
    }
    if (Component.superAdminLayout) {
      return (
        <SuperAdminLayout>
          <PageErrorBoundary resetKey={router.asPath}>
            <Component {...pageProps} />
          </PageErrorBoundary>
        </SuperAdminLayout>
      );
    }
    if (Component.nolayout === true) {
      return <Component {...pageProps} />;
    }
    return (
      <Layout>
        <PageErrorBoundary resetKey={router.asPath}>
          <NestedLayout Component={Component} pageProps={pageProps} />
        </PageErrorBoundary>
      </Layout>
    );
  };

  return (
    // Reset only the boundary's error state on route change. Do not key/remount the entire
    // provider + layout tree: preserving the shell keeps navigation state stable and allows
    // route transitions to animate in place instead of behaving like a full page replacement.
    // BE-0205: keyed by the real address (asPath), so moving to another drive or course on the same page template clears a crash.
    <AppErrorBoundary resetKey={router.asPath}>
      <Provider store={store}>
        <ConfigProvider renderEmpty={renderGlobalEmpty}>
          <QueryClientProvider client={queryClientRef.current}>
            <CalendarContextProvider>
              <NetworkStatusBanner />
              <ImpersonationBanner />
              {renderPage()}
              <TrackerQuickReportLauncher />
            </CalendarContextProvider>
          </QueryClientProvider>
        </ConfigProvider>
      </Provider>
    </AppErrorBoundary>
  );
}
