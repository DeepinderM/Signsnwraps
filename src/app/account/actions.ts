"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { saveProfile } from "@/lib/accounts";

export type ProfileState = { error?: string; saved?: boolean };

export async function updateProfile(_previous: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  if (name.length > 120) return { error: "Please shorten your name (120 characters max)." };
  if (phone && !/^[+()\d\s-]{6,24}$/.test(phone)) return { error: "Please enter a valid phone number." };
  await saveProfile(user.uid, { name, phone });
  refresh();
  return { saved: true };
}
