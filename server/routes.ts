import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import Stripe from "stripe";
import { getDb, COLLECTION } from "./firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const waitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  organization: z.string().min(1),
  sector: z.string().optional().default(""),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Waitlist signup ──────────────────────────────────────────────────────────
  app.post("/api/waitlist", async (req, res) => {
    try {
      const parsed = waitlistSchema.parse(req.body);
      const db = getDb();

      const docId = parsed.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const docRef = db.collection(COLLECTION).doc(docId);
      const existing = await docRef.get();

      if (existing.exists) {
        return res.status(200).json({
          message: "You're already on the waitlist!",
          alreadyExists: true,
          entry: { email: parsed.email },
        });
      }

      const entry = {
        name: parsed.name,
        email: parsed.email,
        organization: parsed.organization,
        sector: parsed.sector,
        pledged: false,
        createdAt: new Date().toISOString(),
      };

      await docRef.set(entry);

      return res.status(201).json({
        message: "You're on the waitlist!",
        entry,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please fill in all required fields." });
      }
      console.error("[Waitlist] Error:", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ── Stripe Checkout Session ──────────────────────────────────────────────────
  app.post("/api/create-pledge-session", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Missing email." });
      }

      const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "SurveyMetrix Founding Tester Pledge",
              description: "Lock in founding tester pricing — applied as credit when we launch.",
            },
            unit_amount: 500,
          },
          quantity: 1,
        }],
        mode: "payment",
        customer_email: email,
        metadata: { email },
        success_url: `${origin}/?pledge=success`,
        cancel_url: `${origin}/?pledge=cancelled`,
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error("[Stripe] Session error:", error);
      return res.status(500).json({ message: "Could not create payment session. Please try again." });
    }
  });

  // ── Stripe Webhook ───────────────────────────────────────────────────────────
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      } else {
        event = req.body as Stripe.Event;
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
          const db = getDb();
          const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
          await db.collection(COLLECTION).doc(docId).update({ pledged: true });
          console.log(`[Firestore] Marked pledged: ${email}`);
        } catch (err) {
          console.error("[Firestore] Pledge update failed:", err);
        }
      }
    }

    return res.json({ received: true });
  });

  return httpServer;
}
