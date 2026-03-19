import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { getDb, COLLECTION } from "./_firebase";

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
      event = req.body as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature error:", err);
    return res.status(400).send("Webhook error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.metadata?.email || session.customer_email || "";

    if (email) {
      try {
        const db = getDb();
        const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
        await db.collection(COLLECTION).doc(docId).update({ pledged: true });
        console.log(`[Firestore] Marked pledged: ${email}`);
      } catch (err) {
        console.error("[Firestore] Failed to update pledge:", err);
      }
    }
  }

  return res.json({ received: true });
}
