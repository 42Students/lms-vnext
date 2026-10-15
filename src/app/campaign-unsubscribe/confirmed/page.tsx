import Link from "next/link";
export default function Unsubscribed(){return <main className="mx-auto max-w-lg space-y-4 p-6">
<h1 className="text-xl font-semibold text-foreground">Email preference updated</h1>
<p className="text-sm text-body">Your address has been suppressed from campaign email. Transactional account messages may use separate preferences.</p>
<Link href="/" className="text-primary-text">Return home</Link></main>;}
