// Firebase Admin SDK helper — used by the Express dev server
// Same credential as the Vercel API functions: FIREBASE_SERVICE_ACCOUNT_KEY env var
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const COLLECTION = "waitlist";

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (_db) return _db;

  let app: App;
  if (getApps().length > 0) {
    app = getApps()[0]!;
  } else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is not set. " +
        "Add it to your environment secrets (the full service account JSON as a string)."
      );
    }
    const serviceAccount = JSON.parse(raw);
    app = initializeApp({ credential: cert(serviceAccount) });
  }

  _db = getFirestore(app);
  return _db;
}
