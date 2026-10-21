import Link from "next/link";
import s from "./marketing.module.scss";
import { NAV, DEMO_MAILTO } from "./data";

// BE-0066: only real 42 LMS profiles are linked. Until an address is set for a network, its icon is not shown
// (these used to point at twitter.com, facebook.com and instagram.com themselves).
const SOCIAL = [
  { href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER_URL, label: "42 LMS on Twitter", icon: "twitter.svg" },
  { href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL, label: "42 LMS on Facebook", icon: "facebook.svg" },
  { href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, label: "42 LMS on Instagram", icon: "insta.svg" },
].filter((x) => typeof x.href === "string" && /^https:\/\/[^/]+\/.+/.test(x.href));

export default function MarketingFooter() {
  const year = 2026;
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerTop}>
          <div>
            <span className={s.footerWordmark}>42 LMS</span>
            <p className={s.footerAbout}>
              The AI Talent &amp; Workforce Operating System — continuously understanding how
              people learn, work, and perform.
            </p>
            {SOCIAL.length > 0 && (
              <div className={s.social}>
                {SOCIAL.map((x) => (
                  <a key={x.icon} href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.label}>
                    <img src={`/assets/images/footer/${x.icon}`} alt="" width="16" height="16" loading="lazy" decoding="async" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className={s.footerColTitle}>Product</p>
            <ul className={s.footerLinks}>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={s.footerColTitle}>Get started</p>
            <ul className={s.footerLinks}>
              <li><Link href="/login">Login</Link></li>
              <li><Link href="/request-demo">Request a Demo</Link></li>
              <li><a href={DEMO_MAILTO}>Contact sales</a></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className={s.footerBottom}>
          <span>© {year} JRSPF Technologies Pvt. Ltd. All rights reserved.</span>
          <span>42 LMS</span>
        </div>
      </div>
    </footer>
  );
}
