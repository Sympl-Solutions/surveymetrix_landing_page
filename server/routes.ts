import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { appendWaitlistRow, updatePledgeStatus, ensureSheetHeaders } from "./googleSheets";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Ensure Google Sheet headers are written on startup (safe no-op if already present)
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (sheetId) {
    ensureSheetHeaders(sheetId).catch((e) =>
      console.warn("[Sheets] Header check failed:", e.message)
    );
  }

  // ── Waitlist signup ──────────────────────────────────────────────────────────
  app.post("/api/waitlist", async (req, res) => {
    try {
      const parsed = insertWaitlistSchema.parse(req.body);

      const existing = await storage.getWaitlistByEmail(parsed.email);
      if (existing) {
        return res.status(200).json({
          message: "You're already on the waitlist!",
          alreadyExists: true,
          entry: existing,
        });
      }

      const entry = await storage.addToWaitlist(parsed);

      // Sync to Google Sheets (non-blocking — never fails the API response)
      appendWaitlistRow(entry).catch((e) =>
        console.warn("[Sheets] Append failed:", e.message)
      );

      return res.status(201).json({ message: "You're on the waitlist!", entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please enter a valid email address." });
      }
      console.error("Waitlist error:", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ── Stripe Checkout Session ──────────────────────────────────────────────────
  app.post("/api/create-pledge-session", async (req, res) => {
    try {
      const { waitlistId, email } = req.body;
      if (!waitlistId || !email) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "SurveyMetrix Founding Tester Pledge",
                description: "Lock in founding tester pricing — applied as credit when we launch.",
              },
              unit_amount: 500, // $5.00
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        metadata: { waitlistId: String(waitlistId) },
        success_url: `${origin}/?pledge=success`,
        cancel_url: `${origin}/?pledge=cancelled`,
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe session error:", error);
      return res.status(500).json({ message: "Could not create payment session. Please try again." });
    }
  });

  // ── Stripe Webhook ───────────────────────────────────────────────────────────
  // Marks pledged=true in DB and updates Google Sheet after successful payment
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Dev fallback — no signature verification (only safe without webhookSecret set)
        event = req.body as Stripe.Event;
      }
    } catch (err) {
      console.error("Webhook signature error:", err);
      return res.status(400).send("Webhook error");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const waitlistId = session.metadata?.waitlistId;
      const email = session.customer_email ?? "";

      if (waitlistId) {
        // Update DB
        await storage.markAsPledged(Number(waitlistId));

        // Update Google Sheet (non-blocking)
        updatePledgeStatus(Number(waitlistId), email).catch((e) =>
          console.warn("[Sheets] Pledge update failed:", e.message)
        );
      }
    }

    return res.json({ received: true });
  });

  return httpServer;
}
