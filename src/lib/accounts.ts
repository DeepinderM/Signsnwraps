import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

// Customer profile details kept alongside Firebase Auth (users/{uid}). Server access only.
export type Profile = { name: string; phone: string };

const users = () => db().collection("users");

export async function getProfile(uid: string): Promise<Profile> {
  const doc = await users().doc(uid).get();
  return { name: doc.get("name") ?? "", phone: doc.get("phone") ?? "" };
}

export async function saveProfile(uid: string, profile: Profile) {
  await users().doc(uid).set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}
