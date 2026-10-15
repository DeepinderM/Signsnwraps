import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";
import { TestModeBanner } from "@/components/shop/store-notice";
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Cart",description:"Review your Signsnwraps PPF kits, film and tools, choose shipping or click & collect, and check out securely.",robots:{index:false,follow:true}};
export default function CartPage(){return <section className="cart-page"><div className="container"><span className="eyebrow">WRAPS · YOUR CART</span><h1 className="heading-xl">Your cart.</h1><TestModeBanner/><CartView/></div></section>;}
