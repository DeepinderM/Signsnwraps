import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getVendorViewer } from "@/lib/vendor-auth";
import { AuthForm } from "@/app/account/login/auth-form";
import { ResendVerification, SignOutButton } from "@/app/account/account-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vendor sign in", robots: { index: false, follow: false } };

/** Vendor sign-in: the normal account sign-in, then the dashboard if the email is on a vendor's login list. */
export default async function VendorLoginPage() {
  if (await getVendorViewer()) redirect("/vendor");
  const user = await getSessionUser();
  return <section className="account-page"><div className="container account-login">
    <div><span className="eyebrow">SIGNSNWRAPS · VENDORS</span><h1 className="heading-xl">Vendor dashboard.</h1>
      <p className="body-lg">Sign in to see the purchase orders Signs N Wraps has sent you, with production sheets and artwork for every job.</p></div>
    {user ? <div className="vendor-denied">
      {!user.emailVerified ? <><p>You're signed in as <b>{user.email}</b>, but the email isn't verified yet. Open the link we emailed you, then reload this page.</p><ResendVerification /></>
        : <p>You're signed in as <b>{user.email}</b>, which isn't set up for a vendor dashboard. Ask Signs N Wraps to add this email to your vendor account, or sign in with the email they set up.</p>}
      <SignOutButton />
    </div> : <AuthForm next="/vendor" />}
  </div></section>;
}
