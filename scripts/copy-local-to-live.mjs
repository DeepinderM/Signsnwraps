// Copies Firestore collections from the local emulator to the live Firebase project.
//
//   node scripts/copy-local-to-live.mjs --key <service-account.json> [--dry-run] [collection ...]
//
// With no collections it copies "catalog" (what the quote "Add from catalog" picker reads).
// Documents are written as-is (same ids, same fields), replacing live documents with the same id;
// live documents that don't exist locally are left alone. The local emulator must be running (port 8080).
import fs from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { GeoPoint, Timestamp, getFirestore } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const keyPath = args[args.indexOf("--key") + 1];
const dryRun = args.includes("--dry-run");
const collections = args.filter((arg, index) => !arg.startsWith("--") && args[index - 1] !== "--key");
if (!collections.length) collections.push("catalog");
if (!dryRun && (!args.includes("--key") || !keyPath || !fs.existsSync(keyPath))) {
  console.error("Pass the service account key: --key path/to/service-account.json (or --dry-run to only read local data)");
  process.exit(1);
}

const LOCAL = "http://localhost:8080/v1/projects/demo-signsnwraps/databases/(default)/documents";

/** Firestore REST value → plain JS value (for firebase-admin). */
function decode(value) {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) return Timestamp.fromDate(new Date(value.timestampValue));
  if ("geoPointValue" in value) return new GeoPoint(value.geoPointValue.latitude ?? 0, value.geoPointValue.longitude ?? 0);
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decode);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields ?? {});
  throw new Error(`Unsupported value ${JSON.stringify(value).slice(0, 80)}`);
}
const decodeFields = (fields) => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decode(value)]));

async function readLocal(collection) {
  const docs = [];
  let pageToken = "";
  do {
    const response = await fetch(`${LOCAL}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`, { headers: { Authorization: "Bearer owner" } });
    if (!response.ok) throw new Error(`Local emulator: ${response.status} ${await response.text()}`);
    const body = await response.json();
    for (const doc of body.documents ?? []) docs.push({ id: doc.name.split("/").at(-1), data: decodeFields(doc.fields ?? {}) });
    pageToken = body.nextPageToken ?? "";
  } while (pageToken);
  return docs;
}

const key = dryRun ? null : JSON.parse(fs.readFileSync(keyPath, "utf8"));
const live = key ? getFirestore(initializeApp({ credential: cert(key), projectId: key.project_id })) : null;
if (key) console.log(`Live project: ${key.project_id}`);

for (const collection of collections) {
  const docs = await readLocal(collection);
  console.log(`${collection}: ${docs.length} local documents${dryRun ? " (dry run, nothing written)" : ""}`);
  if (dryRun) continue;
  for (let index = 0; index < docs.length; index += 400) {
    const batch = live.batch();
    for (const doc of docs.slice(index, index + 400)) batch.set(live.collection(collection).doc(doc.id), doc.data);
    await batch.commit();
  }
  const count = (await live.collection(collection).count().get()).data().count;
  console.log(`${collection}: copied ${docs.length}; live now has ${count}`);
}
