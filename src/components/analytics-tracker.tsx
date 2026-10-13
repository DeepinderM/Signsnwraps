"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
export function AnalyticsTracker(){useEffect(()=>{const onClick=(event:MouseEvent)=>{const target=event.target;if(!(target instanceof Element))return;const link=target.closest("a");const href=link?.getAttribute("href")??"";if(href.startsWith("tel:"))trackEvent("phone_click",{destination:href});if(href.startsWith("mailto:"))trackEvent("email_click",{destination:href});if(href==="/book")trackEvent("consultation_start");};document.addEventListener("click",onClick);return()=>document.removeEventListener("click",onClick);},[]);return null;}
