// Firebase Admin SDK - modular v9+ style (compatible with firebase-admin v13 on Vercel)
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const COLLECTION = "waitlist";

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (_db) return _db;

  // Re-use existing app across Vercel warm starts
  let app: App;
  if (getApps().length > 0) {
    app = getApps()[0]!;
  } else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. " +
        "Add it in Vercel project settings → Environment Variables."
      );
    }
    const serviceAccount = JSON.parse(raw);
    app = initializeApp({ credential: cert(serviceAccount) });
  }

  _db = getFirestore(app);
  return _db;
}
