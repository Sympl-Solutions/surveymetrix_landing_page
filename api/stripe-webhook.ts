import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Disable Vercel body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Update pledged:true via Firestore REST API — no Admin SDK / private key needed
async function markPledgedInFirestore(email: string): Promise<void> {
  const projectId = "surveymetrix-a4fc9";
  const apiKey = "AIzaSyAA6WdXc04dxCI1bxwEhKc5-Lv7gYM_Fac";
  const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/waitlist/${docId}` +
    `?updateMask.fieldPaths=pledged&key=${apiKey}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { pledged: { booleanValue: true } } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore REST update failed (${res.status}): ${text}`);
  }
  console.log(`[Firestore] Marked pledged via REST: ${email}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // No signing secret configured — accept raw body (dev/testing only)
      const rawBody = await getRawBody(req);
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    }
  } catch (err) {
    console.error("[Webhook] Signature error:", err);
    return res.status(400).send("Webhook error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.metadata?.email || session.customer_email || "";

    if (email) {
      try {
        await markPledgedInFirestore(email);
      } catch (err) {
        console.error("[Webhook] Firestore update failed:", err);
        // Still return 200 so Stripe doesn't retry — log the failure
      }
    }
  }

  return res.json({ received: true });
}
