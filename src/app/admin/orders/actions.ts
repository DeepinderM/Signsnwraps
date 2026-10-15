"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { updateOrder } from "@/lib/shop/orders";
import { orderStatuses, type OrderStatus } from "@/lib/shop/catalog";

export async function saveOrder(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as OrderStatus;
  if (!/^cs_[A-Za-z0-9_]+$/.test(id) || !orderStatuses.some((item) => item.value === status)) return;
  await updateOrder(id, { status, staffNote: String(form.get("staffNote") ?? "").slice(0, 2000), trackingNumber: String(form.get("trackingNumber") ?? "").slice(0, 120) });
  refresh();
}
