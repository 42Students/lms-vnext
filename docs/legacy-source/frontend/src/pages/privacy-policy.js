import Head from "next/head";

const EFFECTIVE_DATE = "April 20, 2026";
const LAST_UPDATED = "April 20, 2026";
const CONTACT_EMAIL = "privacy@42lms.com";
const WEBSITE = "https://42lms.com";
const APP_NAME = "42LMS";
const ANDROID_PACKAGE_NAME = "com.lms42.app";

const sections = [
  ["overview", "1. Overview"],
  ["data-we-collect", "2. Information we collect"],
  ["how-we-use", "3. How we use information"],
  ["how-we-share", "4. How we share information"],
  ["retention", "5. Data retention"],
  ["security", "6. Security"],
  ["choices", "7. Your choices and rights"],
  ["children", "8. Children's privacy"],
  ["changes", "9. Changes to this policy"],
  ["contact", "10. Contact"],
  ["cookies", "11. Cookies and similar technologies"],
  ["transfers", "12. International data transfers"],
  ["ads-analytics", "13. Advertising and analytics"],
];

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | 42LMS</title>
        <meta name="robots" content="index,follow" />
        <meta name="description" content="42LMS Privacy Policy" />
        <link rel="canonical" href={`${WEBSITE}/privacy-policy`} />
      </Head>

      <div className="privacy-page">
        <header className="privacy-hero">
          <div className="privacy-shell">
            <a className="brand-link" href={WEBSITE} aria-label="Go to 42LMS home">
              42LMS
            </a>
            <h1>Privacy Policy</h1>
            <p className="hero-meta">
              Effective date: {EFFECTIVE_DATE} | Last updated: {LAST_UPDATED}
            </p>
          </div>
        </header>

        <main className="privacy-shell privacy-content">
          <section className="intro-panel" aria-labelledby="summary-title">
            <h2 id="summary-title">Summary</h2>
            <p>
              This Privacy Policy explains how {APP_NAME} collects, uses, shares, and protects information when you use
              our mobile app and related services (the &quot;Service&quot;).
            </p>
            <p>
              Android package name: <strong>{ANDROID_PACKAGE_NAME}</strong>
            </p>
          </section>

          <nav className="quick-links" aria-label="Privacy policy sections">
            {sections.map(([id, label]) => (
              <a href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
          </nav>

          <section id="overview">
            <h2>1. Overview</h2>
            <p>
              {APP_NAME} (&quot;we&quot;, &quot;us&quot;) provides a learning management platform. This policy applies to the {APP_NAME}{" "}
              Android application and our website at {WEBSITE}.
            </p>
          </section>

          <section id="data-we-collect">
            <h2>2. Information we collect</h2>
            <h3>A. Information you provide</h3>
            <ul>
              <li>Account details such as name, email/phone, and organization/institute information, as applicable.</li>
              <li>Content you submit, such as assignments, uploads, messages, and form inputs, depending on enabled features.</li>
            </ul>

            <h3>B. Information collected automatically</h3>
            <ul>
              <li>Device and app information, such as device model, OS version, app version, and language.</li>
              <li>Log and diagnostic data, such as timestamps, IP address, crash reports, and performance data.</li>
              <li>Usage data, such as features used and interactions within the app.</li>
            </ul>

            <h3>C. Permissions and device access</h3>
            <p>The app may request device permissions to provide features you choose to use:</p>
            <ul>
              <li>
                <strong>Camera:</strong> used when you choose to capture photos/videos or scan/submit content.
              </li>
              <li>
                <strong>Microphone:</strong> used when you choose to record audio/video or use features that require audio input.
              </li>
              <li>
                <strong>Storage/Media access:</strong> used to select, upload, download, or open files you choose.
              </li>
              <li>
                <strong>Notifications:</strong> used to show updates such as reminders and announcements if you enable notifications.
              </li>
            </ul>
            <p>You can control permissions in your device settings. Denying permissions may limit certain features.</p>
            <p>
              <strong>Where your data is stored:</strong> account and app data may be stored in our database
              (MySQL). Files you upload, including images, videos, documents, and audio recordings, may be stored
              in Cloudflare R2 object storage as part of providing the Service.
            </p>
            <p>
              <strong>Third-party content and sign-in:</strong> the Service may use third-party services you choose to
              use, such as Google sign-in/OAuth, Google APIs, embedded YouTube videos, and document preview. When you
              interact with third-party services, their privacy policies apply.
            </p>
          </section>

          <section id="how-we-use">
            <h2>3. How we use information</h2>
            <ul>
              <li>Provide, operate, and maintain the Service.</li>
              <li>Improve reliability and performance.</li>
              <li>Communicate with you through service messages and notifications if enabled.</li>
              <li>Maintain security, prevent abuse, and comply with legal obligations.</li>
            </ul>
          </section>

          <section id="how-we-share">
            <h2>4. How we share information</h2>
            <p>We do not sell your personal information.</p>
            <ul>
              <li>We may share information with your organization, such as admins or instructors, as required to provide the Service.</li>
              <li>We may use service providers that help us operate the Service, including hosting and file storage such as Cloudflare R2.</li>
              <li>We may disclose information for legal and safety reasons, or in connection with a business transfer.</li>
            </ul>
            <p>The Service may include links or content from third parties. Their privacy practices are governed by their own policies.</p>
            <p>If you tap meeting links, such as Google Meet, Zoom, Teams, or Webex, we may open the corresponding app or browser on your device.</p>
          </section>

          <section id="retention">
            <h2>5. Data retention</h2>
            <p>
              We retain information as long as needed to provide the Service and for legitimate purposes such as
              security, backups, and auditing, unless a longer retention period is required by law or organizational
              agreements.
            </p>
          </section>

          <section id="security">
            <h2>6. Security</h2>
            <p>
              We use reasonable safeguards to protect your information. No method of transmission or storage is 100%
              secure, so we cannot guarantee absolute security.
            </p>
          </section>

          <section id="choices">
            <h2>7. Your choices and rights</h2>
            <p>
              Depending on your location and how your account is managed, you may have rights to access, correct, or
              delete your data. To request help, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
            <p>
              <strong>Account/data deletion requests:</strong> Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from your registered email/phone number, if
              applicable, with the subject &quot;Delete my 42LMS data&quot;.
            </p>
          </section>

          <section id="children">
            <h2>8. Children&apos;s privacy</h2>
            <p>
              42LMS may be used by students under an organization&apos;s supervision. If you believe a child has provided
              personal information without appropriate authorization, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section id="changes">
            <h2>9. Changes to this policy</h2>
            <p>We may update this policy from time to time. We will update the effective date at the top of this page.</p>
          </section>

          <section id="contact">
            <h2>10. Contact</h2>
            <p>
              If you have questions, contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section id="cookies">
            <h2>11. Cookies and similar technologies</h2>
            <p>
              Our website and in-app web content may use cookies or similar technologies to keep you signed in, remember
              preferences, and improve reliability. You can typically control cookies through your browser/device settings.
            </p>
          </section>

          <section id="transfers">
            <h2>12. International data transfers</h2>
            <p>
              Your information may be processed in countries where we or our service providers operate. We take
              reasonable steps to protect information when it is processed outside your country.
            </p>
          </section>

          <section id="ads-analytics">
            <h2>13. Advertising and analytics</h2>
            <p>We do not run third-party advertising in the 42LMS app.</p>
            <p>
              We do not use third-party analytics SDKs to track you across apps or websites. We may use in-house
              analytics to understand feature usage and improve the Service.
            </p>
            <p>
              If we introduce third-party analytics or advertising in the future, we will update this policy and the
              Google Play Data safety disclosures.
            </p>
          </section>
        </main>
      </div>

      <style jsx global>{`
        html,
        body {
          min-height: 100%;
          overflow-y: auto !important;
          background: #f6f8fb !important;
        }

        body {
          margin: 0;
        }

        body::before,
        body::after,
        #__next::before,
        #__next::after {
          display: none !important;
          content: none !important;
        }

        .ant-modal-mask,
        .offcanvas-backdrop,
        .modal-backdrop {
          display: none !important;
        }

        .privacy-page {
          min-height: 100vh;
          color: #172033;
          background: #f6f8fb;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.65;
          overflow: visible;
        }

        .privacy-shell {
          width: min(100% - 32px, 1040px);
          margin: 0 auto;
        }

        .privacy-hero {
          background: #266891;
          color: #ffffff;
          padding: 40px 0 36px;
        }

        .brand-link {
          color: rgba(255, 255, 255, 0.88);
          display: inline-block;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 18px;
          text-decoration: none;
        }

        .privacy-hero h1 {
          color: #ffffff;
          font-size: 40px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 10px;
        }

        .hero-meta {
          color: rgba(255, 255, 255, 0.86);
          font-size: 15px;
          margin: 0;
        }

        .privacy-content {
          padding: 28px 0 64px;
        }

        .intro-panel,
        .quick-links,
        .privacy-content section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 16px;
          padding: 24px;
        }

        .quick-links {
          display: grid;
          gap: 8px 16px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .quick-links a,
        .privacy-content a {
          color: #266891;
          font-weight: 700;
          text-decoration: none;
        }

        .quick-links a:hover,
        .privacy-content a:hover {
          text-decoration: underline;
        }

        .privacy-content h2 {
          color: #14213d;
          font-size: 22px;
          line-height: 1.3;
          margin: 0 0 12px;
        }

        .privacy-content h3 {
          color: #24324a;
          font-size: 17px;
          margin: 20px 0 8px;
        }

        .privacy-content p,
        .privacy-content li {
          color: #334155;
          font-size: 16px;
        }

        .privacy-content p {
          margin: 0 0 12px;
        }

        .privacy-content ul {
          margin: 0 0 14px;
          padding-left: 22px;
        }

        @media (max-width: 640px) {
          .privacy-shell {
            width: min(100% - 24px, 1040px);
          }

          .privacy-hero {
            padding: 30px 0 28px;
          }

          .privacy-hero h1 {
            font-size: 30px;
          }

          .intro-panel,
          .quick-links,
          .privacy-content section {
            padding: 18px;
          }
        }
      `}</style>
    </>
  );
}

PrivacyPolicy.nolayout = true;
