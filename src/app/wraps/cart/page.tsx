import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";
import { TestModeBanner } from "@/components/shop/store-notice";
import { PriceLock } from "@/components/shop/price-lock";
import { canSeePrices } from "@/lib/shop/price-access";
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Cart",description:"Review your Signsnwraps PPF kits, film and tools, choose shipping or click & collect, and check out securely.",robots:{index:false,follow:true}};
export default async function CartPage(){const signedIn=await canSeePrices();return <section className="cart-page"><div className="container"><span className="eyebrow">WRAPS · YOUR CART</span><h1 className="heading-xl">Your cart.</h1>{signedIn?<><TestModeBanner/><CartView/></>:<div className="cart-locked"><p className="body-lg">Prices and checkout are for account holders. Log in or create a free account to see prices and order.</p><PriceLock path="/wraps/cart"/></div>}</div></section>;}
