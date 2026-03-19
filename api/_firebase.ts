// Firebase Admin SDK helper for Vercel serverless functions
// Credential stored in FIREBASE_SERVICE_ACCOUNT_KEY env var (full JSON string)
import * as admin from "firebase-admin";

let _app: admin.app.App | null = null;

export function getFirestore(): admin.firestore.Firestore {
  if (!_app) {
    // Prevent duplicate app initialization (Vercel warm starts)
    if (admin.apps.length > 0) {
      _app = admin.apps[0]!;
    } else {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");
      const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
      _app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  }
  return admin.firestore();
}

export const COLLECTION = "waitlist";
