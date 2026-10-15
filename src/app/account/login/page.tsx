import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "./auth-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in or create an account", robots: { index: false, follow: false } };

/** Only allow redirects to this site. */
const safeNext = (value: string | undefined) => value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";

export default async function AccountLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getSessionUser()) redirect(next);
  return <section className="account-page"><div className="container account-login">
    <div><span className="eyebrow">MY ACCOUNT</span><h1 className="heading-xl">Sign in.</h1><p className="body-lg">See your orders, keep your details handy and check out faster. No account? Create one in a few seconds, or <Link href="/wraps/shop">keep shopping as a guest</Link>.</p></div>
    <AuthForm next={next} />
  </div></section>;
}
