import { useEffect, useState } from "react";
import Link from "next/link";
import s from "./marketing.module.scss";
import Icon from "./icons";
import { NAV } from "./data";

export default function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${s.header} ${scrolled ? s.headerScrolled : ""}`}>
      <div className={s.container}>
        <div className={s.headerInner}>
          <Link href="/" className={s.brand} aria-label="42 LMS home">
            <img
              src="/assets/images/login/logoo.png"
              alt="42 LMS"
              className={s.brandLogo}
              width="44"
              height="44"
              decoding="async"
            />
          </Link>

          <nav className={s.nav} aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={s.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={s.headerCtas}>
            <Link href="/login" className={s.loginLink}>
              Login
            </Link>
            <Link href="/request-demo" className={`${s.btn} ${s.btnPrimary}`}>
              Request a Demo
            </Link>
            <button
              className={s.menuBtn}
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>

        {open && (
          <div className={s.mobileMenu}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
