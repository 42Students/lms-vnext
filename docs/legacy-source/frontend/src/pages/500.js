import Link from "next/link";

// Brand teal (matches every primary button in the app) instead of antd's default blue, plus a
// "Go back" so a broken link doesn't strand the user on Home.
export default function Custom500() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem", background: "#fafbfc" }}>
      <h1 style={{ fontSize: "4rem", fontWeight: 800, margin: 0, color: "#1e9aa8" }}>500</h1>
      <h2 style={{ fontSize: "1.5rem", margin: "1rem 0 0.5rem", color: "#1a1d21" }}>Server Error</h2>
      <p style={{ color: "#6b7280", margin: "0 0 2rem", maxWidth: 420 }}>Something went wrong on our side. Please try again in a moment.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{ padding: "12px 24px", background: "#fff", color: "#1e9aa8", border: "1px solid #1e9aa8", borderRadius: 999, fontWeight: 600, cursor: "pointer" }}
        >
          Go back
        </button>
        <Link href="/" style={{ padding: "12px 24px", background: "#1e9aa8", color: "#fff", borderRadius: 999, fontWeight: 600, textDecoration: "none" }}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}
Custom500.nolayout = true;
