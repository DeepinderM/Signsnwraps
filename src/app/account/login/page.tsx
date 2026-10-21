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
    <div><span className="eyebrow">MY ACCOUNT</span><h1 className="heading-xl">Sign in.</h1><p className="body-lg">Sign in to see prices, order online and track your orders. No account? Create one free in a few seconds. Or <Link href="/wraps/shop">keep browsing</Link>.</p></div>
    <AuthForm next={next} />
  </div></section>;
}
